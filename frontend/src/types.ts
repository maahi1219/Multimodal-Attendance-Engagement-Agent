export interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  class_name: string;
  department: string;
  enrollment_year: number;
  consent_status: boolean;
  avatar_url?: string;
  face_token?: string;
  is_simulated: boolean;
  created_at: string;
}

export interface StudentHistoryRecord {
  record_id: number;
  session_id: number;
  session_code: string;
  session_title: string;
  subject: string;
  date: string | null;
  status: 'present' | 'absent' | 'late';
  sustained_presence_duration: number;
  sustained_presence_ratio: number;
  verified_manually: boolean;
  verification_note?: string;
  is_simulated: boolean;
}

export interface StudentDetailResponse {
  student: Student;
  total_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_percentage: number;
  avg_sustained_presence_ratio: number;
  history: StudentHistoryRecord[];
}

export interface ClassroomSession {
  id: number;
  session_code: string;
  title: string;
  class_name: string;
  subject: string;
  instructor_name: string;
  room: string;
  status: 'scheduled' | 'live' | 'paused' | 'completed';
  mode: 'camera' | 'video_upload' | 'simulation';
  scheduled_start: string;
  actual_start?: string;
  actual_end?: string;
  duration_minutes: number;
  total_students_enrolled: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  avg_attendance_rate: number;
  avg_engagement_score: number;
  notes?: string;
  date?: string;
  is_simulated: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late';
  sustained_presence_duration: number;
  sustained_presence_ratio: number;
  first_seen_time?: string;
  last_seen_time?: string;
  detection_confidence: number;
  verified_manually: boolean;
  verification_note?: string;
  is_simulated: boolean;
  created_at: string;
  student?: Student;
}

export interface EngagementMetricPoint {
  offset_seconds: number;
  minute: number;
  visual_activity: number;
  head_pose_frontality: number;
  visual_inactivity: number;
  audio_level_db: number;
  speech_activity: number;
  silence_ratio: number;
  turns: number;
  composite_engagement: number;
  active_participants: number;
  quality_flag: string;
  data_source: string;
}

export interface SegmentAnalysis {
  avg_engagement: number;
  avg_visual: number;
  avg_speech: number;
  avg_frontality: number;
}

export interface SessionAnalyticsSummary {
  id: number;
  code: string;
  session_code?: string;
  title: string;
  class_name: string;
  subject: string;
  duration_minutes: number;
  total_enrolled: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_rate: number;
  avg_attendance_rate?: number;
  avg_engagement: number;
  avg_engagement_score?: number;
  status: string;
  is_simulated: boolean;
}

export interface SessionAnalyticsResponse {
  session: SessionAnalyticsSummary;
  timeline: EngagementMetricPoint[];
  segment_breakdown: {
    beginning: SegmentAnalysis;
    middle: SegmentAnalysis;
    end: SegmentAnalysis;
  };
  peaks_count: number;
  valleys_count: number;
  data_points_count: number;
}

export interface AIRecommendation {
  id: number;
  session_id: number;
  category: 'pacing' | 'interaction' | 'fatigue' | 'quality_alert' | 'reinforcement';
  pattern_observed: string;
  supporting_metric: string;
  suggested_action: string;
  pedagogical_rationale: string;
  confidence_score: number;
  data_quality_indicator: string;
  status: 'active' | 'acknowledged' | 'dismissed';
  created_at: string;
}

export interface DashboardStats {
  total_registered_students: number;
  total_sessions: number;
  average_attendance_rate: number;
  average_engagement_score: number;
  latest_session: ClassroomSession | null;
  recent_activity: ClassroomSession[];
  class_distribution: {
    class_name: string;
    student_count: number;
    session_count: number;
    avg_attendance: number;
    avg_engagement: number;
  }[];
}

export interface PrivacySettings {
  id: number;
  local_processing_only: boolean;
  camera_permission: boolean;
  microphone_permission: boolean;
  anonymize_student_identifiers: boolean;
  data_retention_days: number;
  auto_delete_raw_video: boolean;
  simulation_mode_active: boolean;
  disclaimer_accepted: boolean;
  updated_at: string;
}
