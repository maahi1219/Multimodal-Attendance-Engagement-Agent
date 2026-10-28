import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from ..database import get_db
from ..models import AttendanceRecord, ClassroomSession, Student, EngagementMetric, AIRecommendation

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/attendance/csv")
def export_attendance_csv(
    session_id: Optional[int] = None,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        AttendanceRecord, Student, ClassroomSession
    ).join(
        Student, AttendanceRecord.student_id == Student.id
    ).join(
        ClassroomSession, AttendanceRecord.session_id == ClassroomSession.id
    )

    if session_id:
        query = query.filter(AttendanceRecord.session_id == session_id)
    if class_name:
        query = query.filter(Student.class_name == class_name)

    records = query.order_by(ClassroomSession.scheduled_start.desc(), Student.student_id.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Write CSV Header
    writer.writerow([
        "Session Code",
        "Session Title",
        "Class",
        "Subject",
        "Date",
        "Student ID",
        "Student Name",
        "Department",
        "Attendance Status",
        "Sustained Presence (Mins)",
        "Sustained Ratio (%)",
        "Detection Confidence",
        "Manual Override",
        "Verification Note",
        "Data Mode"
    ])

    for att, stu, ses in records:
        writer.writerow([
            ses.session_code,
            ses.title,
            ses.class_name,
            ses.subject,
            ses.scheduled_start.strftime("%Y-%m-%d %H:%M") if ses.scheduled_start else "N/A",
            stu.student_id,
            stu.name,
            stu.department,
            att.status.capitalize(),
            att.sustained_presence_duration,
            f"{round(att.sustained_presence_ratio * 100, 1)}%",
            f"{round(att.detection_confidence * 100, 1)}%",
            "Yes" if att.verified_manually else "No",
            att.verification_note or "Automated",
            "Simulated Demo" if att.is_simulated else "Live Sensor"
        ])

    output.seek(0)
    filename = f"attendance_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/session/{session_id}/summary")
def get_session_report_summary(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    records = db.query(AttendanceRecord, Student).join(
        Student, AttendanceRecord.student_id == Student.id
    ).filter(AttendanceRecord.session_id == session_id).all()

    recommendations = db.query(AIRecommendation).filter(
        AIRecommendation.session_id == session_id
    ).all()

    attendance_list = []
    for att, stu in records:
        attendance_list.append({
            "student_id": stu.student_id,
            "name": stu.name,
            "class_name": stu.class_name,
            "status": att.status,
            "sustained_duration_mins": att.sustained_presence_duration,
            "sustained_ratio_pct": round(att.sustained_presence_ratio * 100, 1),
            "verified_manually": att.verified_manually,
            "note": att.verification_note
        })

    recs_list = []
    for r in recommendations:
        recs_list.append({
            "category": r.category,
            "pattern": r.pattern_observed,
            "metric": r.supporting_metric,
            "action": r.suggested_action,
            "rationale": r.pedagogical_rationale,
            "confidence": r.confidence_score,
            "quality": r.data_quality_indicator
        })

    return {
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "session": {
            "code": session.session_code,
            "title": session.title,
            "class_name": session.class_name,
            "subject": session.subject,
            "instructor": session.instructor_name,
            "room": session.room,
            "duration_minutes": session.duration_minutes,
            "date": session.scheduled_start.strftime("%B %d, %Y - %I:%M %p") if session.scheduled_start else None,
            "attendance_rate": session.avg_attendance_rate,
            "avg_engagement": session.avg_engagement_score,
            "total_enrolled": session.total_students_enrolled,
            "present_count": session.present_count,
            "late_count": session.late_count,
            "absent_count": session.absent_count,
            "is_simulated": session.is_simulated
        },
        "attendance": attendance_list,
        "recommendations": recs_list
    }
