from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import ClassroomSession, AttendanceRecord, Student, EngagementMetric, AIRecommendation
from ..schemas import ClassroomSessionResponse, ClassroomSessionCreate, ClassroomSessionDetail
from ..services.attendance_service import attendance_service
from ..services.recommendation_agent import recommendation_agent

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("", response_model=List[ClassroomSessionResponse])
def get_sessions(
    class_name: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ClassroomSession)
    if class_name:
        query = query.filter(ClassroomSession.class_name == class_name)
    if status:
        query = query.filter(ClassroomSession.status == status)
    return query.order_by(ClassroomSession.scheduled_start.desc()).all()


@router.post("", response_model=ClassroomSessionResponse)
def create_session(payload: ClassroomSessionCreate, db: Session = Depends(get_db)):
    # Auto-generate unique session code if not provided or collision
    code = payload.session_code
    if not code:
        code = f"SES-{datetime.utcnow().strftime('%Y%m%d')}-{db.query(ClassroomSession).count() + 101}"

    # Auto find enrolled students for class
    enrolled_students = db.query(Student).filter(Student.class_name == payload.class_name).all()
    if not enrolled_students:
        enrolled_students = db.query(Student).limit(10).all()

    session = ClassroomSession(
        session_code=code,
        title=payload.title,
        class_name=payload.class_name,
        subject=payload.subject,
        instructor_name=payload.instructor_name,
        room=payload.room,
        mode=payload.mode,
        duration_minutes=payload.duration_minutes,
        notes=payload.notes,
        status="scheduled",
        total_students_enrolled=len(enrolled_students),
        present_count=0,
        absent_count=len(enrolled_students),
        late_count=0,
        avg_attendance_rate=0.0,
        avg_engagement_score=0.0,
        is_simulated=payload.is_simulated
    )
    db.add(session)
    db.flush()

    # Pre-create initial attendance records (all initially unconfirmed/absent until detected)
    for st in enrolled_students:
        att = AttendanceRecord(
            session_id=session.id,
            student_id=st.id,
            status="absent",
            sustained_presence_duration=0,
            sustained_presence_ratio=0.0,
            detection_confidence=0.85,
            verified_manually=False,
            is_simulated=payload.is_simulated
        )
        db.add(att)

    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=ClassroomSessionDetail)
def get_session_detail(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/{session_id}/start")
def start_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "live"
    if not session.actual_start:
        session.actual_start = datetime.utcnow()
    db.commit()
    return {"message": "Session started", "status": session.status, "start_time": session.actual_start}


@router.post("/{session_id}/pause")
def pause_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "paused"
    db.commit()
    return {"message": "Session paused", "status": session.status}


@router.post("/{session_id}/resume")
def resume_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "live"
    db.commit()
    return {"message": "Session resumed", "status": session.status}


@router.post("/{session_id}/end")
def end_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "completed"
    session.actual_end = datetime.utcnow()

    # Re-calculate sustained presence attendance
    attendance_service.calculate_session_attendance(
        db=db,
        session_id=session.id,
        session_duration_minutes=session.duration_minutes
    )

    # Trigger recommendation analysis on all session metrics
    metrics = db.query(EngagementMetric).filter(
        EngagementMetric.session_id == session.id
    ).order_by(EngagementMetric.timestamp_offset_seconds.asc()).all()

    if metrics:
        metric_dicts = [
            {
                "timestamp_offset_seconds": m.timestamp_offset_seconds,
                "visual_activity_score": m.visual_activity_score,
                "head_pose_frontality": m.head_pose_frontality,
                "visual_inactivity_ratio": m.visual_inactivity_ratio,
                "speech_activity_ratio": m.speech_activity_ratio,
                "interaction_turn_count": m.interaction_turn_count,
                "composite_engagement_score": m.composite_engagement_score,
                "signal_quality_flag": m.signal_quality_flag
            }
            for m in metrics
        ]
        recs = recommendation_agent.analyze_session(metric_dicts)
        # Clear old automated recs if re-ended
        db.query(AIRecommendation).filter(AIRecommendation.session_id == session.id).delete()
        for r in recs:
            rec = AIRecommendation(
                session_id=session.id,
                category=r["category"],
                pattern_observed=r["pattern_observed"],
                supporting_metric=r["supporting_metric"],
                suggested_action=r["suggested_action"],
                pedagogical_rationale=r["pedagogical_rationale"],
                confidence_score=r["confidence_score"],
                data_quality_indicator=r["data_quality_indicator"],
                status="active"
            )
            db.add(rec)

    db.commit()
    db.refresh(session)
    return {
        "message": "Session completed",
        "status": session.status,
        "present_count": session.present_count,
        "absent_count": session.absent_count,
        "late_count": session.late_count,
        "avg_attendance_rate": session.avg_attendance_rate,
        "avg_engagement_score": session.avg_engagement_score
    }
