import {
  Student,
  StudentDetailResponse,
  ClassroomSession,
  AttendanceRecord,
  SessionAnalyticsResponse,
  AIRecommendation,
  DashboardStats,
  PrivacySettings
} from './types';

const API_BASE = '/api';

export const api = {
  // Dashboard
  async getDashboard(className?: string): Promise<DashboardStats> {
    const url = className ? `${API_BASE}/analytics/dashboard?class_name=${encodeURIComponent(className)}` : `${API_BASE}/analytics/dashboard`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Students
  async getStudents(search?: string, className?: string, department?: string): Promise<Student[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (className) params.append('class_name', className);
    if (department) params.append('department', department);
    const res = await fetch(`${API_BASE}/students?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  async getClassesAndDepartments(): Promise<{ classes: string[]; departments: string[] }> {
    const res = await fetch(`${API_BASE}/students/classes`);
    if (!res.ok) throw new Error('Failed to fetch classes');
    return res.json();
  },

  async getStudentDetail(studentId: number): Promise<StudentDetailResponse> {
    const res = await fetch(`${API_BASE}/students/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch student details');
    return res.json();
  },

  async createStudent(student: Partial<Student>): Promise<Student> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create student');
    }
    return res.json();
  },

  async updateStudent(studentId: number, student: Partial<Student>): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    if (!res.ok) throw new Error('Failed to update student');
    return res.json();
  },

  async deleteStudent(studentId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/students/${studentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete student');
  },

  // Sessions
  async getSessions(className?: string, status?: string): Promise<ClassroomSession[]> {
    const params = new URLSearchParams();
    if (className) params.append('class_name', className);
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/sessions?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  async getSessionDetail(sessionId: number): Promise<ClassroomSession & { attendance_records: AttendanceRecord[]; recommendations: AIRecommendation[] }> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch session detail');
    return res.json();
  },

  async createSession(session: Partial<ClassroomSession>): Promise<ClassroomSession> {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  },

  async startSession(sessionId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start session');
    return res.json();
  },

  async pauseSession(sessionId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to pause session');
    return res.json();
  },

  async resumeSession(sessionId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/resume`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resume session');
    return res.json();
  },

  async endSession(sessionId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/end`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to end session');
    return res.json();
  },

  // Attendance
  async getSessionAttendance(sessionId: number): Promise<AttendanceRecord[]> {
    const res = await fetch(`${API_BASE}/attendance/session/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  },

  async updateAttendanceRecord(recordId: number, status: string, note?: string): Promise<AttendanceRecord> {
    const res = await fetch(`${API_BASE}/attendance/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, verified_manually: true, verification_note: note })
    });
    if (!res.ok) throw new Error('Failed to update attendance');
    return res.json();
  },

  // Live CV & Simulation Ticks
  async processFrame(imageBase64: string, sessionId?: number, offsetSeconds?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/cv/process-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, session_id: sessionId, offset_seconds: offsetSeconds })
    });
    if (!res.ok) throw new Error('Failed to process video frame');
    return res.json();
  },

  async liveTick(sessionId: number, offsetSeconds: number): Promise<any> {
    const res = await fetch(`${API_BASE}/cv/live-tick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, offset_seconds: offsetSeconds })
    });
    if (!res.ok) throw new Error('Failed to send live tick');
    return res.json();
  },

  // Analytics
  async getSessionAnalytics(sessionId: number): Promise<SessionAnalyticsResponse> {
    const res = await fetch(`${API_BASE}/analytics/session/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch session analytics');
    return res.json();
  },

  async compareSessions(sessionIds: number[]): Promise<any[]> {
    const res = await fetch(`${API_BASE}/analytics/compare?session_ids=${sessionIds.join(',')}`);
    if (!res.ok) throw new Error('Failed to compare sessions');
    return res.json();
  },

  // Recommendations
  async getRecommendations(sessionId?: number, category?: string, status?: string): Promise<AIRecommendation[]> {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId.toString());
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/recommendations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  async updateRecommendationStatus(recId: number, status: 'active' | 'acknowledged' | 'dismissed'): Promise<any> {
    const res = await fetch(`${API_BASE}/recommendations/${recId}/status?status=${status}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async generateRecommendations(sessionId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/recommendations/session/${sessionId}/generate`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to generate recommendations');
    return res.json();
  },

  // Reports
  getAttendanceCsvUrl(sessionId?: number, className?: string): string {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId.toString());
    if (className) params.append('class_name', className);
    return `${API_BASE}/reports/attendance/csv?${params.toString()}`;
  },

  async getSessionReportSummary(sessionId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/session/${sessionId}/summary`);
    if (!res.ok) throw new Error('Failed to fetch session report summary');
    return res.json();
  },

  // Privacy & Settings
  async getPrivacySettings(): Promise<PrivacySettings> {
    const res = await fetch(`${API_BASE}/privacy`);
    if (!res.ok) throw new Error('Failed to fetch privacy settings');
    return res.json();
  },

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const res = await fetch(`${API_BASE}/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update privacy settings');
    return res.json();
  },

  async deleteSessionData(sessionId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/privacy/delete-session-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    if (!res.ok) throw new Error('Failed to delete session data');
    return res.json();
  },

  async resetDatabase(): Promise<any> {
    const res = await fetch(`${API_BASE}/privacy/reset-database`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reset database');
    return res.json();
  }
};
