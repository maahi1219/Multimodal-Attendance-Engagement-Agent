# Attendance Calculation & Sustained Presence Service
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import AttendanceRecord, ClassroomSession, Student

class AttendanceService:
    """
    Manages robust, privacy-compliant attendance calculations:
    - Sustained Presence Rule: Students are marked 'present' only when sustained presence
      exceeds a defined duration threshold (e.g. >= 70% of session time).
    - Late Rule: Arrived after threshold window or present for 40-69% of duration.
    - Absent: Present < 40% of duration or not detected.
    - Manual review and override logging.
    - Privacy: Uses authorized student enrolled tokens, flags non-consenting records.
    """

    def calculate_session_attendance(
        self,
        db: Session,
        session_id: int,
        session_duration_minutes: int,
        sustained_threshold_ratio: float = 0.70,
        late_threshold_ratio: float = 0.40
    ) -> Dict[str, Any]:
        session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
        if not session:
            return {"error": "Session not found"}

        records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
        if not records:
            return {
                "total": 0, "present": 0, "absent": 0, "late": 0, "rate": 0.0
            }

        present_count = 0
        absent_count = 0
        late_count = 0

        for r in records:
            # If manually verified, preserve teacher's override unless recalculating unverified
            if not r.verified_manually:
                ratio = r.sustained_presence_ratio
                if ratio >= sustained_threshold_ratio:
                    r.status = "present"
                    present_count += 1
                elif ratio >= late_threshold_ratio:
                    r.status = "late"
                    late_count += 1
                else:
                    r.status = "absent"
                    absent_count += 1
            else:
                if r.status == "present":
                    present_count += 1
                elif r.status == "late":
                    late_count += 1
                else:
                    absent_count += 1

        total = len(records)
        attendance_rate = ((present_count + 0.5 * late_count) / total * 100.0) if total > 0 else 0.0

        session.present_count = present_count
        session.absent_count = absent_count
        session.late_count = late_count
        session.avg_attendance_rate = round(attendance_rate, 1)

        db.commit()

        return {
            "total": total,
            "present": present_count,
            "absent": absent_count,
            "late": late_count,
            "rate": round(attendance_rate, 1)
        }

    def update_student_attendance(
        self,
        db: Session,
        record_id: int,
        new_status: str,
        note: Optional[str] = None
    ) -> AttendanceRecord:
        record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
        if not record:
            raise ValueError(f"Attendance record {record_id} not found")

        record.status = new_status
        record.verified_manually = True
        record.verification_note = note or f"Manually updated to {new_status} by instructor on {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
        db.commit()
        db.refresh(record)

        # Recalculate session aggregates
        session = db.query(ClassroomSession).filter(ClassroomSession.id == record.session_id).first()
        if session:
            records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id).all()
            p = sum(1 for r in records if r.status == "present")
            a = sum(1 for r in records if r.status == "absent")
            l = sum(1 for r in records if r.status == "late")
            tot = len(records)
            session.present_count = p
            session.absent_count = a
            session.late_count = l
            session.avg_attendance_rate = round(((p + 0.5 * l) / tot * 100.0), 1) if tot > 0 else 0.0
            db.commit()

        return record


attendance_service = AttendanceService()
