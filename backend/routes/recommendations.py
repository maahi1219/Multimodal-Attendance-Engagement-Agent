from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import AIRecommendation, ClassroomSession, EngagementMetric
from ..schemas import AIRecommendationResponse
from ..services.recommendation_agent import recommendation_agent

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("", response_model=List[AIRecommendationResponse])
def get_recommendations(
    session_id: Optional[int] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AIRecommendation)
    if session_id:
        query = query.filter(AIRecommendation.session_id == session_id)
    if category:
        query = query.filter(AIRecommendation.category == category)
    if status:
        query = query.filter(AIRecommendation.status == status)

    return query.order_by(AIRecommendation.created_at.desc()).all()


@router.put("/{rec_id}/status")
def update_recommendation_status(
    rec_id: int,
    status: str = Query(..., pattern="^(active|acknowledged|dismissed)$"),
    db: Session = Depends(get_db)
):
    rec = db.query(AIRecommendation).filter(AIRecommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = status
    db.commit()
    return {"message": f"Recommendation marked as {status}", "id": rec_id, "status": status}


@router.post("/session/{session_id}/generate")
def generate_recommendations_for_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    metrics = db.query(EngagementMetric).filter(
        EngagementMetric.session_id == session_id
    ).order_by(EngagementMetric.timestamp_offset_seconds.asc()).all()

    if not metrics:
        raise HTTPException(status_code=400, detail="Insufficient metric points for analysis")

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

    new_recs = recommendation_agent.analyze_session(metric_dicts)

    # Replace old automated recommendations
    db.query(AIRecommendation).filter(AIRecommendation.session_id == session_id).delete()
    saved = []
    for r in new_recs:
        rec = AIRecommendation(
            session_id=session_id,
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
        saved.append(rec)

    db.commit()
    return {"message": f"Generated {len(saved)} recommendations", "count": len(saved)}
