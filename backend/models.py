from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from .database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    class_name = Column(String(100), nullable=False) # e.g. "CS-301 Computer Networks"
    department = Column(String(100), nullable=False) # e.g. "Computer Science & Engineering"
    enrollment_year = Column(Integer, default=2024)
    consent_status = Column(Boolean, default=True) # Privacy opt-in
    avatar_url = Column(String(255), nullable=True)
    face_token = Column(String(255), nullable=True) # Pseudonymized identifier, not raw biometrics
    is_simulated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")


class ClassroomSession(Base):
    __tablename__ = "classroom_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    class_name = Column(String(100), nullable=False)
    subject = Column(String(100), nullable=False)
    instructor_name = Column(String(100), default="Prof. Elena Vance")
    room = Column(String(50), default="Hall 4B / Intelligent Lab")
    status = Column(String(20), default="scheduled") # "scheduled", "live", "paused", "completed"
    mode = Column(String(30), default="simulation") # "camera", "video_upload", "simulation"
    scheduled_start = Column(DateTime, default=datetime.utcnow)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=45)
    total_students_enrolled = Column(Integer, default=0)
    present_count = Column(Integer, default=0)
    absent_count = Column(Integer, default=0)
    late_count = Column(Integer, default=0)
    avg_attendance_rate = Column(Float, default=0.0) # Percentage e.g. 88.5
    avg_engagement_score = Column(Float, default=0.0) # Composite score 0-100
    notes = Column(Text, nullable=True)
    is_simulated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    attendance_records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")
    engagement_metrics = relationship("EngagementMetric", back_populates="session", cascade="all, delete-orphan")
    recommendations = relationship("AIRecommendation", back_populates="session", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("classroom_sessions.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    status = Column(String(20), default="absent") # "present", "absent", "late"
    sustained_presence_duration = Column(Integer, default=0) # duration in minutes
    sustained_presence_ratio = Column(Float, default=0.0) # 0.0 to 1.0 (e.g. 0.82 is 82% of class present)
    first_seen_time = Column(DateTime, nullable=True)
    last_seen_time = Column(DateTime, nullable=True)
    detection_confidence = Column(Float, default=0.85)
    verified_manually = Column(Boolean, default=False)
    verification_note = Column(String(255), nullable=True)
    is_simulated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ClassroomSession", back_populates="attendance_records")
    student = relationship("Student", back_populates="attendance_records")


class EngagementMetric(Base):
    __tablename__ = "engagement_metrics"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("classroom_sessions.id"), nullable=False, index=True)
    timestamp_offset_seconds = Column(Integer, nullable=False) # e.g. 0, 60, 120...
    visual_activity_score = Column(Float, default=0.0) # 0-100 (movement & gestures)
    head_pose_frontality = Column(Float, default=0.0) # 0-100 (facing board/slides proxy)
    visual_inactivity_ratio = Column(Float, default=0.0) # 0-100 (prolonged inactivity)
    audio_level_db = Column(Float, default=-30.0) # ambient sound energy
    speech_activity_ratio = Column(Float, default=0.0) # 0-100 (speaking vs background)
    silence_ratio = Column(Float, default=0.0) # 0-100
    interaction_turn_count = Column(Integer, default=0) # estimated verbal shifts/queries
    composite_engagement_score = Column(Float, default=0.0) # 0-100 blended explainable index
    active_participants_detected = Column(Integer, default=0)
    data_source_type = Column(String(30), default="simulated") # "measured", "simulated", "hybrid"
    signal_quality_flag = Column(String(30), default="optimal") # "optimal", "low_light", "mic_noise", "occluded"
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ClassroomSession", back_populates="engagement_metrics")


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("classroom_sessions.id"), nullable=False, index=True)
    category = Column(String(50), nullable=False) # "pacing", "interaction", "inactivity_break", "quality_alert", "high_energy"
    pattern_observed = Column(String(255), nullable=False)
    supporting_metric = Column(String(255), nullable=False)
    suggested_action = Column(Text, nullable=False)
    pedagogical_rationale = Column(Text, nullable=False)
    confidence_score = Column(Float, default=85.0) # 0-100
    data_quality_indicator = Column(String(50), default="High Confidence (Multi-signal corroborated)")
    status = Column(String(20), default="active") # "active", "acknowledged", "dismissed"
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ClassroomSession", back_populates="recommendations")


class PrivacySettings(Base):
    __tablename__ = "privacy_settings"

    id = Column(Integer, primary_key=True, index=True)
    local_processing_only = Column(Boolean, default=True)
    camera_permission = Column(Boolean, default=True)
    microphone_permission = Column(Boolean, default=True)
    anonymize_student_identifiers = Column(Boolean, default=False)
    data_retention_days = Column(Integer, default=30)
    auto_delete_raw_video = Column(Boolean, default=True)
    simulation_mode_active = Column(Boolean, default=False)
    disclaimer_accepted = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
