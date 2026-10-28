from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any

from ..database import get_db
from ..models import PrivacySettings, ClassroomSession, EngagementMetric, AttendanceRecord, AIRecommendation
from ..schemas import PrivacySettingsResponse, PrivacySettingsBase
from ..seed_data import seed_database

router = APIRouter(prefix="/api/privacy", tags=["privacy"])


@router.get("", response_model=PrivacySettingsResponse)
def get_privacy_settings(db: Session = Depends(get_db)):
    settings = db.query(PrivacySettings).first()
    if not settings:
        settings = PrivacySettings(
            local_processing_only=True,
            camera_permission=True,
            microphone_permission=True,
            anonymize_student_identifiers=False,
            data_retention_days=30,
            auto_delete_raw_video=True,
            simulation_mode_active=False,
            disclaimer_accepted=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("", response_model=PrivacySettingsResponse)
def update_privacy_settings(
    payload: PrivacySettingsBase,
    db: Session = Depends(get_db)
):
    settings = db.query(PrivacySettings).first()
    if not settings:
        settings = PrivacySettings()
        db.add(settings)

    for field, val in payload.model_dump().items():
        setattr(settings, field, val)

    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/delete-session-data")
def delete_session_data(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Purges raw session metrics and time-series data while preserving attendance totals if desired.
    """
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Purge time-series metrics
    deleted_metrics = db.query(EngagementMetric).filter(
        EngagementMetric.session_id == session_id
    ).delete()

    db.commit()

    return {
        "message": f"Successfully purged {deleted_metrics} engagement metric rows for session {session.session_code}",
        "session_id": session_id,
        "privacy_compliance": "Raw observational metrics purged; high-level attendance aggregate preserved"
    }


@router.post("/reset-database")
def reset_and_reseed_database():
    seed_database(force=True)
    return {"message": "Database reset and re-seeded with pristine demonstration data."}
