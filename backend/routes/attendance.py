from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import AttendanceRecord, Student
from ..schemas import AttendanceRecordResponse, AttendanceRecordUpdate
from ..services.attendance_service import attendance_service

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.get("/session/{session_id}", response_model=List[AttendanceRecordResponse])
def get_session_attendance(session_id: int, db: Session = Depends(get_db)):
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id
    ).all()
    return records


@router.put("/{record_id}", response_model=AttendanceRecordResponse)
def update_attendance_record(
    record_id: int,
    payload: AttendanceRecordUpdate,
    db: Session = Depends(get_db)
):
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    if payload.status:
        record.status = payload.status
    if payload.sustained_presence_duration is not None:
        record.sustained_presence_duration = payload.sustained_presence_duration
    
    record.verified_manually = True
    record.verification_note = payload.verification_note or "Manual verification override by instructor"

    db.commit()
    db.refresh(record)

    # Recalculate session statistics
    attendance_service.calculate_session_attendance(
        db=db,
        session_id=record.session_id,
        session_duration_minutes=record.session.duration_minutes if record.session else 45
    )

    return record


@router.post("/session/{session_id}/recalculate")
def recalculate_attendance(session_id: int, db: Session = Depends(get_db)):
    result = attendance_service.calculate_session_attendance(
        db=db,
        session_id=session_id,
        session_duration_minutes=45
    )
    return {"message": "Attendance recalculated", "stats": result}
