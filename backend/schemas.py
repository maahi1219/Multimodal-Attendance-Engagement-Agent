from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# Student Schemas
class StudentBase(BaseModel):
    student_id: str = Field(..., example="STU-2026-001")
    name: str = Field(..., example="Aria Chen")
    email: str = Field(..., example="aria.chen@university.edu")
    class_name: str = Field(..., example="CS-301 Computer Networks")
    department: str = Field(..., example="Computer Science & Engineering")
    enrollment_year: int = Field(default=2024)
    consent_status: bool = Field(default=True)
    avatar_url: Optional[str] = None
    face_token: Optional[str] = None
    is_simulated: bool = False


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    class_name: Optional[str] = None
    department: Optional[str] = None
    enrollment_year: Optional[int] = None
    consent_status: Optional[bool] = None
    avatar_url: Optional[str] = None
    face_token: Optional[str] = None


class StudentResponse(StudentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Attendance Schemas
class AttendanceRecordBase(BaseModel):
    session_id: int
    student_id: int
    status: str = "absent" # "present", "absent", "late"
    sustained_presence_duration: int = 0
    sustained_presence_ratio: float = 0.0
    first_seen_time: Optional[datetime] = None
    last_seen_time: Optional[datetime] = None
    detection_confidence: float = 0.85
    verified_manually: bool = False
    verification_note: Optional[str] = None
    is_simulated: bool = False


class AttendanceRecordUpdate(BaseModel):
    status: Optional[str] = None
    verified_manually: Optional[bool] = True
    verification_note: Optional[str] = None
    sustained_presence_duration: Optional[int] = None


class AttendanceRecordResponse(AttendanceRecordBase):
    id: int
    created_at: datetime
    student: Optional[StudentResponse] = None

    class Config:
        from_attributes = True


# Engagement Metric Schemas
class EngagementMetricBase(BaseModel):
    timestamp_offset_seconds: int
    visual_activity_score: float
    head_pose_frontality: float
    visual_inactivity_ratio: float
    audio_level_db: float
    speech_activity_ratio: float
    silence_ratio: float
    interaction_turn_count: int
    composite_engagement_score: float
    active_participants_detected: int
    data_source_type: str = "simulated"
    signal_quality_flag: str = "optimal"


class EngagementMetricResponse(EngagementMetricBase):
    id: int
    session_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Recommendation Schemas
class AIRecommendationBase(BaseModel):
    category: str
    pattern_observed: str
    supporting_metric: str
    suggested_action: str
    pedagogical_rationale: str
    confidence_score: float = 85.0
    data_quality_indicator: str = "High Confidence"
    status: str = "active"


class AIRecommendationResponse(AIRecommendationBase):
    id: int
    session_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Classroom Session Schemas
class ClassroomSessionBase(BaseModel):
    session_code: str
    title: str
    class_name: str
    subject: str
    instructor_name: str = "Prof. Elena Vance"
    room: str = "Hall 4B / Intelligent Lab"
    mode: str = "simulation" # "camera", "video_upload", "simulation"
    duration_minutes: int = 45
    notes: Optional[str] = None
    is_simulated: bool = False


class ClassroomSessionCreate(ClassroomSessionBase):
    pass


class ClassroomSessionResponse(ClassroomSessionBase):
    id: int
    status: str
    scheduled_start: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    total_students_enrolled: int
    present_count: int
    absent_count: int
    late_count: int
    avg_attendance_rate: float
    avg_engagement_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class ClassroomSessionDetail(ClassroomSessionResponse):
    attendance_records: List[AttendanceRecordResponse] = []
    engagement_metrics: List[EngagementMetricResponse] = []
    recommendations: List[AIRecommendationResponse] = []


# Privacy Settings Schemas
class PrivacySettingsBase(BaseModel):
    local_processing_only: bool = True
    camera_permission: bool = True
    microphone_permission: bool = True
    anonymize_student_identifiers: bool = False
    data_retention_days: int = 30
    auto_delete_raw_video: bool = True
    simulation_mode_active: bool = False
    disclaimer_accepted: bool = True


class PrivacySettingsResponse(PrivacySettingsBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


# Dashboard Stats Schema
class DashboardStats(BaseModel):
    total_registered_students: int
    total_sessions: int
    average_attendance_rate: float
    average_engagement_score: float
    latest_session: Optional[ClassroomSessionResponse] = None
    recent_activity: List[dict] = []
    class_distribution: List[dict] = []
