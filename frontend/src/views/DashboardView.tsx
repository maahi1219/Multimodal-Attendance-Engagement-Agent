import React, { useState, useEffect } from 'react';
import {
  Users,
  Video,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { DashboardStats, ClassroomSession, SessionAnalyticsResponse, AIRecommendation } from '../types';
import { api } from '../api';

interface DashboardViewProps {
  stats: DashboardStats | null;
  onNavigateTab: (tab: string, sessionId?: number) => void;
  selectedClass: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onNavigateTab,
  selectedClass
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalyticsResponse | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Initialize selected session when stats load
  useEffect(() => {
    if (stats?.recent_activity && stats.recent_activity.length > 0 && !selectedSessionId) {
      setSelectedSessionId(stats.recent_activity[0].id);
    }
  }, [stats]);

  // Load analytics when selected session changes
  useEffect(() => {
    if (!selectedSessionId) return;
    setLoadingAnalytics(true);
    api.getSessionAnalytics(selectedSessionId)
      .then((data) => setSessionAnalytics(data))
      .catch((err) => console.error(err))
      .finally(() => setLoadingAnalytics(false));

    api.getRecommendations(selectedSessionId)
      .then((data) => setRecommendations(data))
      .catch((err) => console.error(err));
  }, [selectedSessionId]);

  const selectedSession = stats?.recent_activity.find((s) => s.id === selectedSessionId) || stats?.latest_session;

  const attendanceData = selectedSession ? [
    { name: 'Present', count: selectedSession.present_count, color: '#10b981' },
    { name: 'Late', count: selectedSession.late_count, color: '#f59e0b' },
    { name: 'Absent', count: selectedSession.absent_count, color: '#ef4444' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Privacy-First Intelligent Classroom Analytics
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Observable proxies (head orientation, motion energy, acoustic intervals) are modeled for educator assistance. No individual facial surveillance or biometric profiling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
            Offline Edge Node
          </span>
          {stats?.latest_session?.is_simulated && (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
              Demo Synthetic Records
            </span>
          )}
        </div>
      </div>

      {/* 4 Key Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Students */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats?.total_registered_students ?? 0}
            </span>
            <span className="text-xs text-blue-400 font-medium">
              {selectedClass ? selectedClass.split(' ')[0] : 'All Classes'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">100% Opt-in Consent</span>
            <span>recorded</span>
          </div>
        </div>

        {/* Card 2: Classroom Sessions */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Sessions Tracked
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats?.total_sessions ?? 0}
            </span>
            <span className="text-xs text-indigo-400 font-medium">Complete</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Avg 48 mins / session</span>
          </div>
        </div>

        {/* Card 3: Average Attendance Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Avg Attendance
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats?.average_attendance_rate ?? 0}%
            </span>
            <span className="text-xs text-emerald-400 font-medium">Sustained Ratio</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">≥70% time threshold</span>
            <span>for 'Present'</span>
          </div>
        </div>

        {/* Card 4: Average Engagement Score */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Avg Engagement Index
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats?.average_engagement_score ?? 0}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
            <span className="text-xs text-purple-400 font-medium ml-1">Explainable</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-purple-400 font-medium">Head Pose & Motion & Audio</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Selected Session Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Multimodal Engagement Trends */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Multimodal Engagement Timeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Observable classroom activity index combining visual motion, forward orientation, and acoustic speech signals.
                </p>
              </div>

              {/* Session Selector */}
              <select
                value={selectedSessionId || ''}
                onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none cursor-pointer font-medium"
              >
                {stats?.recent_activity.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.session_code}: {s.subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-68 w-full">
              {sessionAnalytics?.timeline && sessionAnalytics.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sessionAnalytics.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="frontGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="minute"
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(m) => `${m}m`}
                    />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }}
                      formatter={(val: any, name: any) => [
                        `${val}%`,
                        name === 'composite_engagement'
                          ? 'Composite Engagement'
                          : name === 'head_pose_frontality'
                          ? 'Head-Pose Frontality'
                          : name === 'speech_activity'
                          ? 'Speech Activity'
                          : 'Visual Motion'
                      ]}
                      labelFormatter={(m) => `Session Minute: ${m}m`}
                    />
                    <Area
                      type="monotone"
                      dataKey="composite_engagement"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#engGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="head_pose_frontality"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#frontGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  {loadingAnalytics ? 'Loading timeline metrics...' : 'No metric timeline recorded yet.'}
                </div>
              )}
            </div>
          </div>

          {/* Chart Legend & Signal Proxies Explanation */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                Composite Index
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-0.5 bg-emerald-400 border border-dashed"></span>
                Head-Pose Frontality (Board Focus)
              </span>
            </div>

            <button
              onClick={() => onNavigateTab('analytics', selectedSessionId || undefined)}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
            >
              <span>Detailed Signal Breakdown</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Col: Selected Session Attendance Tally & Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Session Attendance
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {selectedSession?.class_name.split(' ')[0]}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 mb-5">
              <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                {selectedSession?.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{selectedSession?.subject}</span>
                <span>{selectedSession?.duration_minutes} Minutes</span>
              </div>
            </div>

            {/* Bar Representation of Attendance */}
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={12} width={50} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Tally Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-lg font-bold text-emerald-400">{selectedSession?.present_count ?? 0}</div>
                <div className="text-[10px] uppercase font-semibold text-emerald-300/80">Present</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-lg font-bold text-amber-400">{selectedSession?.late_count ?? 0}</div>
                <div className="text-[10px] uppercase font-semibold text-amber-300/80">Late</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="text-lg font-bold text-rose-400">{selectedSession?.absent_count ?? 0}</div>
                <div className="text-[10px] uppercase font-semibold text-rose-300/80">Absent</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('attendance', selectedSessionId || undefined)}
            className="mt-5 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <span>Review Full Roster & Overrides</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI Recommendations Preview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: AI Recommendations Highlight */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">AI Pedagogical Advice</h3>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Assistive Decision Support
              </span>
            </div>

            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, 2).map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-300 capitalize">
                        {rec.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rec.confidence_score}% Confidence
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium leading-relaxed">
                      {rec.suggested_action}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      <strong className="text-slate-300">Observed:</strong> {rec.pattern_observed}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Select a completed session to inspect AI generated recommendations.
              </p>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('recommendations', selectedSessionId || undefined)}
            className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            <span>View All AI Teaching Insights</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right 2 Cols: Recent Classroom Sessions Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Recent Classroom Sessions
              </h3>
              <button
                onClick={() => onNavigateTab('live-session')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>New Session</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Session / Title</th>
                    <th className="pb-3 font-semibold">Class</th>
                    <th className="pb-3 font-semibold">Attendance</th>
                    <th className="pb-3 font-semibold">Engagement</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats?.recent_activity.map((ses) => (
                    <tr key={ses.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3">
                        <div className="font-semibold text-slate-200">{ses.title}</div>
                        <div className="text-[11px] text-slate-400">{ses.session_code} • {ses.date}</div>
                      </td>
                      <td className="py-3 text-slate-300 font-medium">
                        {ses.class_name.split(' ')[0]}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400">{ses.avg_attendance_rate}%</span>
                          <span className="text-[10px] text-slate-400">({ses.present_count} present)</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {ses.avg_engagement_score} / 100
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => setSelectedSessionId(ses.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('students')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                Register Students
              </button>
              <button
                onClick={() => onNavigateTab('reports')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                View Reports
              </button>
            </div>

            <a
              href={api.getAttendanceCsvUrl(selectedSessionId || undefined, selectedClass || undefined)}
              download
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
