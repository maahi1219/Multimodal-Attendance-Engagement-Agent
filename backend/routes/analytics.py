from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import numpy as np

from ..database import get_db
from ..models import ClassroomSession, Student, AttendanceRecord, EngagementMetric, AIRecommendation

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard")
def get_dashboard_analytics(
    class_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    student_query = db.query(Student)
    session_query = db.query(ClassroomSession)

    if class_name:
        student_query = student_query.filter(Student.class_name == class_name)
        session_query = session_query.filter(ClassroomSession.class_name == class_name)

    total_students = student_query.count()
    sessions = session_query.order_by(ClassroomSession.scheduled_start.desc()).all()
    total_sessions = len(sessions)

    if total_sessions > 0:
        avg_attendance = float(np.mean([s.avg_attendance_rate for s in sessions]))
        avg_engagement = float(np.mean([s.avg_engagement_score for s in sessions]))
        latest_session = sessions[0]
    else:
        avg_attendance = 0.0
        avg_engagement = 0.0
        latest_session = None

    # Class distribution statistics
    classes = db.query(Student.class_name).distinct().all()
    class_dist = []
    for c_tuple in classes:
        c_name = c_tuple[0]
        if not c_name:
            continue
        c_students = db.query(Student).filter(Student.class_name == c_name).count()
        c_sessions = db.query(ClassroomSession).filter(ClassroomSession.class_name == c_name).all()
        c_avg_att = float(np.mean([s.avg_attendance_rate for s in c_sessions])) if c_sessions else 0.0
        c_avg_eng = float(np.mean([s.avg_engagement_score for s in c_sessions])) if c_sessions else 0.0
        class_dist.append({
            "class_name": c_name,
            "student_count": c_students,
            "session_count": len(c_sessions),
            "avg_attendance": round(c_avg_att, 1),
            "avg_engagement": round(c_avg_eng, 1)
        })

    # Recent activity timeline
    recent_activity = []
    for s in sessions[:5]:
        recent_activity.append({
            "id": s.id,
            "code": s.session_code,
            "title": s.title,
            "class_name": s.class_name,
            "subject": s.subject,
            "status": s.status,
            "date": s.scheduled_start.strftime("%b %d, %Y - %I:%M %p") if s.scheduled_start else None,
            "present_count": s.present_count,
            "absent_count": s.absent_count,
            "late_count": s.late_count,
            "attendance_rate": s.avg_attendance_rate,
            "engagement_score": s.avg_engagement_score,
            "is_simulated": s.is_simulated
        })

    return {
        "total_registered_students": total_students,
        "total_sessions": total_sessions,
        "average_attendance_rate": round(avg_attendance, 1),
        "average_engagement_score": round(avg_engagement, 1),
        "latest_session": recent_activity[0] if recent_activity else None,
        "recent_activity": recent_activity,
        "class_distribution": class_dist
    }


@router.get("/session/{session_id}")
def get_session_analytics(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    metrics = db.query(EngagementMetric).filter(
        EngagementMetric.session_id == session_id
    ).order_by(EngagementMetric.timestamp_offset_seconds.asc()).all()

    timeline = []
    for m in metrics:
        timeline.append({
            "offset_seconds": m.timestamp_offset_seconds,
            "minute": round(m.timestamp_offset_seconds / 60.0, 1),
            "visual_activity": m.visual_activity_score,
            "head_pose_frontality": m.head_pose_frontality,
            "visual_inactivity": m.visual_inactivity_ratio,
            "audio_level_db": m.audio_level_db,
            "speech_activity": m.speech_activity_ratio,
            "silence_ratio": m.silence_ratio,
            "turns": m.interaction_turn_count,
            "composite_engagement": m.composite_engagement_score,
            "active_participants": m.active_participants_detected,
            "quality_flag": m.signal_quality_flag,
            "data_source": m.data_source_type
        })

    # Segment Breakdown: Beginning (0-33%), Middle (33-66%), End (66-100%)
    segment_breakdown = {
        "beginning": {"avg_engagement": 0.0, "avg_visual": 0.0, "avg_speech": 0.0, "avg_frontality": 0.0},
        "middle": {"avg_engagement": 0.0, "avg_visual": 0.0, "avg_speech": 0.0, "avg_frontality": 0.0},
        "end": {"avg_engagement": 0.0, "avg_visual": 0.0, "avg_speech": 0.0, "avg_frontality": 0.0}
    }

    if len(timeline) >= 3:
        n = len(timeline)
        b_slice = timeline[:max(1, n // 3)]
        m_slice = timeline[max(1, n // 3):max(2, 2 * n // 3)]
        e_slice = timeline[max(2, 2 * n // 3):]

        def compute_avg(arr, key):
            vals = [item[key] for item in arr]
            return round(float(np.mean(vals)), 1) if vals else 0.0

        segment_breakdown["beginning"] = {
            "avg_engagement": compute_avg(b_slice, "composite_engagement"),
            "avg_visual": compute_avg(b_slice, "visual_activity"),
            "avg_speech": compute_avg(b_slice, "speech_activity"),
            "avg_frontality": compute_avg(b_slice, "head_pose_frontality")
        }
        segment_breakdown["middle"] = {
            "avg_engagement": compute_avg(m_slice, "composite_engagement"),
            "avg_visual": compute_avg(m_slice, "visual_activity"),
            "avg_speech": compute_avg(m_slice, "speech_activity"),
            "avg_frontality": compute_avg(m_slice, "head_pose_frontality")
        }
        segment_breakdown["end"] = {
            "avg_engagement": compute_avg(e_slice, "composite_engagement"),
            "avg_visual": compute_avg(e_slice, "visual_activity"),
            "avg_speech": compute_avg(e_slice, "speech_activity"),
            "avg_frontality": compute_avg(e_slice, "head_pose_frontality")
        }

    # High energy peaks and low activity valleys
    peaks = [t for t in timeline if t["composite_engagement"] >= 75.0]
    valleys = [t for t in timeline if t["composite_engagement"] < 45.0]

    return {
        "session": {
            "id": session.id,
            "code": session.session_code,
            "title": session.title,
            "class_name": session.class_name,
            "subject": session.subject,
            "duration_minutes": session.duration_minutes,
            "total_enrolled": session.total_students_enrolled,
            "present_count": session.present_count,
            "absent_count": session.absent_count,
            "late_count": session.late_count,
            "attendance_rate": session.avg_attendance_rate,
            "avg_engagement": session.avg_engagement_score,
            "status": session.status,
            "is_simulated": session.is_simulated
        },
        "timeline": timeline,
        "segment_breakdown": segment_breakdown,
        "peaks_count": len(peaks),
        "valleys_count": len(valleys),
        "data_points_count": len(timeline)
    }


@router.get("/compare")
def compare_sessions(
    session_ids: str = Query(..., description="Comma separated session IDs"),
    db: Session = Depends(get_db)
):
    ids = [int(i.strip()) for i in session_ids.split(",") if i.strip().isdigit()]
    sessions = db.query(ClassroomSession).filter(ClassroomSession.id.in_(ids)).all()

    comparison = []
    for s in sessions:
        comparison.append({
            "id": s.id,
            "code": s.session_code,
            "title": s.title,
            "class_name": s.class_name,
            "attendance_rate": s.avg_attendance_rate,
            "avg_engagement_score": s.avg_engagement_score,
            "duration_minutes": s.duration_minutes,
            "present_count": s.present_count,
            "absent_count": s.absent_count,
            "late_count": s.late_count,
            "is_simulated": s.is_simulated
        })

    return comparison
