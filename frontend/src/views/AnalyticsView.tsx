import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Layers,
  Calendar,
  Sparkles,
  Eye,
  Activity,
  Mic,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Filter,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts';
import { ClassroomSession, SessionAnalyticsResponse } from '../types';
import { api } from '../api';

interface AnalyticsViewProps {
  initialSessionId?: number;
  selectedClass: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  initialSessionId,
  selectedClass
}) => {
  const [sessions, setSessions] = useState<ClassroomSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(initialSessionId || null);
  const [analytics, setAnalytics] = useState<SessionAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Multi-session comparison selection
  const [comparisonSessions, setComparisonSessions] = useState<ClassroomSession[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    api.getSessions(selectedClass || undefined).then((data) => {
      setSessions(data);
      if (data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].id);
      }
    });
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedSessionId) return;
    setLoading(true);
    api.getSessionAnalytics(selectedSessionId)
      .then((data) => setAnalytics(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [selectedSessionId]);

  // Load comparison data
  const handleToggleComparison = async () => {
    if (!showComparison) {
      const topIds = sessions.slice(0, 4).map((s) => s.id);
      if (topIds.length > 0) {
        const comp = await api.compareSessions(topIds);
        setComparisonSessions(comp);
      }
    }
    setShowComparison(!showComparison);
  };

  const segmentData = analytics?.segment_breakdown ? [
    {
      segment: 'Beginning (0-33%)',
      Engagement: analytics.segment_breakdown.beginning.avg_engagement,
      Visual: analytics.segment_breakdown.beginning.avg_visual,
      Speech: analytics.segment_breakdown.beginning.avg_speech,
      Frontality: analytics.segment_breakdown.beginning.avg_frontality,
    },
    {
      segment: 'Middle (33-66%)',
      Engagement: analytics.segment_breakdown.middle.avg_engagement,
      Visual: analytics.segment_breakdown.middle.avg_visual,
      Speech: analytics.segment_breakdown.middle.avg_speech,
      Frontality: analytics.segment_breakdown.middle.avg_frontality,
    },
    {
      segment: 'End (66-100%)',
      Engagement: analytics.segment_breakdown.end.avg_engagement,
      Visual: analytics.segment_breakdown.end.avg_visual,
      Speech: analytics.segment_breakdown.end.avg_speech,
      Frontality: analytics.segment_breakdown.end.avg_frontality,
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Top Controls & Session Selector */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Multimodal Engagement Intelligence</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
              {analytics?.session.code}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Temporal decomposition of observable proxies: head orientation, movement energy, and speech acoustics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none cursor-pointer font-medium"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.session_code}: {s.subject} ({s.class_name.split(' ')[0]})
              </option>
            ))}
          </select>

          <button
            onClick={handleToggleComparison}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition ${
              showComparison
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {showComparison ? 'Close Cross-Session Matrix' : 'Compare Sessions'}
          </button>
        </div>
      </div>

      {/* Multi-Session Comparison Matrix (if toggled) */}
      {showComparison && (
        <div className="p-6 rounded-2xl bg-slate-900/95 border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Cross-Session Comparison Benchmark
            </h4>
            <span className="text-xs text-slate-400">Comparing 4 latest curriculum lectures</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonSessions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="code" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="attendance_rate" name="Attendance %" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg_engagement_score" name="Engagement Index" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4 Summary Stat Cards for this Session */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Overall Engagement</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {analytics?.session.avg_engagement ?? 0} <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Composite proxy index</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Attendance Rate</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {analytics?.session.attendance_rate ?? 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {analytics?.session.present_count} Present • {analytics?.session.late_count} Late
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Discussion Peaks</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {analytics?.peaks_count ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">High acoustic interaction periods</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Inactivity Slumps</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {analytics?.valleys_count ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Intervals &lt; 45% activity proxy</div>
        </div>
      </div>

      {/* Synchronized Multi-Signal Timeline Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Multimodal Temporal Signals
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlated time-series displaying visual frontality, visual movement, speech ratio, and composite engagement across lecture minutes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Composite Index
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Head-Pose Frontality
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Visual Movement
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Speech Activity
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {analytics?.timeline && analytics.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="minute" stroke="#64748b" fontSize={11} tickFormatter={(m) => `${m}m`} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#f8fafc' }}
                  labelFormatter={(m) => `Minute ${m} of Session`}
                />
                <Line type="monotone" dataKey="composite_engagement" name="Composite" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="head_pose_frontality" name="Frontality" stroke="#10b981" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="visual_activity" name="Visual Motion" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="speech_activity" name="Speech Activity" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              {loading ? 'Compiling timeline signals...' : 'No telemetry recorded for this session.'}
            </div>
          )}
        </div>
      </div>

      {/* Segment Breakdown: Beginning vs Middle vs End */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Curriculum Segment Breakdown
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparison of behavioral proxy averages across early lecture, middle block, and concluding synthesis.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="segment" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Engagement" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Frontality" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Visual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Speech" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pedagogical Observations Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-white">Segment Findings</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-semibold text-emerald-400 block mb-0.5">Beginning (0-15m)</span>
                <p className="text-slate-300 leading-relaxed">
                  Strong initial orientation ({analytics?.segment_breakdown.beginning.avg_frontality}% frontality). Students promptly attentive to introductory problem statement.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-semibold text-amber-400 block mb-0.5">Middle Block (15-30m)</span>
                <p className="text-slate-300 leading-relaxed">
                  Noticeable dip in speech activity and rising stillness. Typical cognitive saturation window during dense theoretical proof.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-semibold text-indigo-400 block mb-0.5">Concluding Segment (30-45m)</span>
                <p className="text-slate-300 leading-relaxed">
                  Discussion surge observed with active vocal participation ({analytics?.segment_breakdown.end.avg_speech}% speech ratio) during student Q&A.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-slate-400 mt-4">
            <span className="text-indigo-300 font-semibold">Assistive Note:</span> Proxies reflect physical/acoustic classroom dynamics, not internal learning capacity.
          </div>
        </div>
      </div>
    </div>
  );
};
