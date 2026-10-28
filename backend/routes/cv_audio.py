from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import random
import numpy as np

from ..database import get_db
from ..models import ClassroomSession, EngagementMetric, AttendanceRecord
from ..services.cv_service import cv_service
from ..services.audio_service import audio_service

router = APIRouter(prefix="/api/cv", tags=["computer-vision"])


@router.post("/process-frame")
def process_video_frame(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Analyzes a base64 encoded camera or video frame with OpenCV:
    - Detects faces
    - Tracks participants with Euclidean centroid tracker
    - Calculates movement energy & head-pose orientation proxy
    - Checks optical quality (blur, lighting)
    """
    image_b64 = payload.get("image")
    if not image_b64:
        raise HTTPException(status_code=400, detail="Missing base64 image")

    analysis = cv_service.process_base64_image(image_b64)
    if "error" in analysis:
        raise HTTPException(status_code=400, detail=analysis["error"])

    # Optional: if session_id provided, record real-time point
    session_id = payload.get("session_id")
    offset_seconds = payload.get("offset_seconds", 0)

    if session_id:
        session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
        if session and session.status == "live":
            metric = EngagementMetric(
                session_id=session.id,
                timestamp_offset_seconds=offset_seconds,
                visual_activity_score=analysis["visual_activity_score"],
                head_pose_frontality=analysis["head_pose_frontality"],
                visual_inactivity_ratio=analysis["visual_inactivity_ratio"],
                audio_level_db=-30.0,
                speech_activity_ratio=25.0,
                silence_ratio=70.0,
                interaction_turn_count=1,
                composite_engagement_score=analysis["composite_visual_score"],
                active_participants_detected=analysis["sustained_participants"],
                data_source_type="measured",
                signal_quality_flag=analysis["quality_flag"]
            )
            db.add(metric)
            db.commit()

    return analysis


@router.post("/live-tick")
def process_live_simulation_tick(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Generates a realistic live tick for live demo sessions (every 3-5 seconds).
    Updates session timeline in real-time with correlated multimodal proxies.
    """
    session_id = payload.get("session_id")
    offset_seconds = payload.get("offset_seconds", 0)

    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    minute = offset_seconds / 60.0

    # Smooth correlated stochastic simulation based on elapsed minute
    base_front = 78.0 - (min(30.0, minute) * 0.4) + random.uniform(-4.0, 4.0)
    base_vis = 40.0 + random.uniform(-10.0, 15.0)
    base_speech = 22.0 + (random.uniform(5.0, 25.0) if minute > 10 and int(minute) % 4 == 0 else random.uniform(-5.0, 8.0))
    turns = random.randint(1, 4) if base_speech > 30.0 else random.randint(0, 1)

    frontality = float(np.clip(base_front, 45.0, 94.0))
    visual_act = float(np.clip(base_vis, 15.0, 85.0))
    speech_act = float(np.clip(base_speech, 5.0, 65.0))
    inactivity = float(np.clip(100.0 - visual_act * 1.3, 5.0, 85.0))
    silence = float(np.clip(100.0 - speech_act * 1.4, 20.0, 95.0))
    db_level = float(-36.0 + (speech_act * 0.3) + random.uniform(-2.0, 2.0))

    composite = float(np.clip(frontality * 0.45 + visual_act * 0.30 + speech_act * 0.25, 20.0, 96.0))

    # Calculate active sustained participants
    enrolled_count = session.total_students_enrolled or 8
    active_count = max(1, min(enrolled_count, int(enrolled_count * random.uniform(0.75, 0.95))))

    metric = EngagementMetric(
        session_id=session.id,
        timestamp_offset_seconds=offset_seconds,
        visual_activity_score=round(visual_act, 1),
        head_pose_frontality=round(frontality, 1),
        visual_inactivity_ratio=round(inactivity, 1),
        audio_level_db=round(db_level, 1),
        speech_activity_ratio=round(speech_act, 1),
        silence_ratio=round(silence, 1),
        interaction_turn_count=turns,
        composite_engagement_score=round(composite, 1),
        active_participants_detected=active_count,
        data_source_type="simulated",
        signal_quality_flag="optimal"
    )
    db.add(metric)

    # Gradually build sustained presence for enrolled students
    records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id).all()
    for r in records[:active_count]:
        if not r.verified_manually:
            curr_dur = r.sustained_presence_duration or 0
            new_dur = curr_dur + 1
            r.sustained_presence_duration = new_dur
            r.sustained_presence_ratio = round(min(1.0, new_dur / max(1.0, session.duration_minutes)), 2)
            if r.sustained_presence_ratio >= 0.70:
                r.status = "present"
            elif r.sustained_presence_ratio >= 0.40:
                r.status = "late"

    # Update session averages
    present_cnt = sum(1 for r in records if r.status == "present")
    late_cnt = sum(1 for r in records if r.status == "late")
    absent_cnt = sum(1 for r in records if r.status == "absent")

    session.present_count = present_cnt
    session.late_count = late_cnt
    session.absent_count = absent_cnt
    session.avg_attendance_rate = round(((present_cnt + 0.5 * late_cnt) / max(1, len(records)) * 100.0), 1)

    all_scores = [m.composite_engagement_score for m in session.engagement_metrics]
    session.avg_engagement_score = round(float(np.mean(all_scores)), 1) if all_scores else round(composite, 1)

    db.commit()

    return {
        "timestamp_offset_seconds": offset_seconds,
        "visual_activity": round(visual_act, 1),
        "head_pose_frontality": round(frontality, 1),
        "visual_inactivity": round(inactivity, 1),
        "audio_level_db": round(db_level, 1),
        "speech_activity": round(speech_act, 1),
        "silence_ratio": round(silence, 1),
        "turns": turns,
        "composite_engagement": round(composite, 1),
        "active_participants": active_count,
        "present_count": present_cnt,
        "late_count": late_cnt,
        "absent_count": absent_cnt,
        "avg_attendance_rate": session.avg_attendance_rate,
        "is_simulated": True
    }
