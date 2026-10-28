from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import Student, AttendanceRecord, ClassroomSession
from ..schemas import StudentResponse, StudentCreate, StudentUpdate

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=List[StudentResponse])
def get_students(
    search: Optional[str] = None,
    class_name: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Student)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Student.name.ilike(search_filter)) |
            (Student.student_id.ilike(search_filter)) |
            (Student.email.ilike(search_filter))
        )
    if class_name:
        query = query.filter(Student.class_name == class_name)
    if department:
        query = query.filter(Student.department == department)

    return query.order_by(Student.student_id.asc()).all()


@router.get("/classes")
def get_classes_and_departments(db: Session = Depends(get_db)):
    classes = db.query(Student.class_name).distinct().all()
    departments = db.query(Student.department).distinct().all()
    return {
        "classes": [c[0] for c in classes if c[0]],
        "departments": [d[0] for d in departments if d[0]]
    }


@router.get("/{student_id}")
def get_student_detail(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Fetch individual attendance records
    records = db.query(AttendanceRecord, ClassroomSession).join(
        ClassroomSession, AttendanceRecord.session_id == ClassroomSession.id
    ).filter(AttendanceRecord.student_id == student_id).order_by(ClassroomSession.scheduled_start.desc()).all()

    total_sessions = len(records)
    present_count = sum(1 for r, _ in records if r.status == "present")
    late_count = sum(1 for r, _ in records if r.status == "late")
    absent_count = sum(1 for r, _ in records if r.status == "absent")
    avg_sustained_ratio = (
        sum(r.sustained_presence_ratio for r, _ in records) / total_sessions
    ) if total_sessions > 0 else 0.0

    attendance_percentage = (
        ((present_count + 0.5 * late_count) / total_sessions) * 100.0
    ) if total_sessions > 0 else 0.0

    history = []
    for r, s in records:
        history.append({
            "record_id": r.id,
            "session_id": s.id,
            "session_code": s.session_code,
            "session_title": s.title,
            "subject": s.subject,
            "date": s.scheduled_start.strftime("%Y-%m-%d %H:%M") if s.scheduled_start else None,
            "status": r.status,
            "sustained_presence_duration": r.sustained_presence_duration,
            "sustained_presence_ratio": round(r.sustained_presence_ratio * 100, 1),
            "verified_manually": r.verified_manually,
            "verification_note": r.verification_note,
            "is_simulated": r.is_simulated
        })

    return {
        "student": StudentResponse.model_validate(student),
        "total_sessions": total_sessions,
        "present_count": present_count,
        "late_count": late_count,
        "absent_count": absent_count,
        "attendance_percentage": round(attendance_percentage, 1),
        "avg_sustained_presence_ratio": round(avg_sustained_ratio * 100, 1),
        "history": history
    }


@router.post("", response_model=StudentResponse)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(
        (Student.student_id == payload.student_id) | (Student.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID or email already registered")

    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(student, field, val)

    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
    return {"message": "Student successfully removed", "id": student_id}
