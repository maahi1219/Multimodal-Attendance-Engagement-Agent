import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Sliders,
  Filter,
  Check
} from 'lucide-react';
import { ClassroomSession, AIRecommendation } from '../types';
import { api } from '../api';

interface RecommendationsViewProps {
  initialSessionId?: number;
  selectedClass: string;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  initialSessionId,
  selectedClass
}) => {
  const [sessions, setSessions] = useState<ClassroomSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(initialSessionId || null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    api.getSessions(selectedClass || undefined).then((data) => {
      setSessions(data);
      if (data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].id);
      }
    });
  }, [selectedClass]);

  const loadRecommendations = async (sessionId?: number) => {
    setLoading(true);
    try {
      const data = await api.getRecommendations(
        sessionId || undefined,
        categoryFilter === 'all' ? undefined : categoryFilter,
        statusFilter === 'all' ? undefined : statusFilter
      );
      setRecommendations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations(selectedSessionId || undefined);
  }, [selectedSessionId, categoryFilter, statusFilter]);

  const handleUpdateStatus = async (recId: number, newStatus: 'active' | 'acknowledged' | 'dismissed') => {
    try {
      await api.updateRecommendationStatus(recId, newStatus);
      loadRecommendations(selectedSessionId || undefined);
    } catch (e) {
      alert('Failed to update recommendation');
    }
  };

  const handleRegenerate = async () => {
    if (!selectedSessionId) return;
    setRegenerating(true);
    try {
      await api.generateRecommendations(selectedSessionId);
      await loadRecommendations(selectedSessionId);
      alert('AI Teaching Agent finished evaluating session telemetry.');
    } catch (e) {
      alert('Failed to re-generate recommendations');
    } finally {
      setRegenerating(false);
    }
  };

  const currentSession = sessions.find((s) => s.id === selectedSessionId);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'pacing':
        return { label: 'Lecture Pacing', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'interaction':
        return { label: 'Student Interaction', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      case 'fatigue':
        return { label: 'Fatigue & Attention Reset', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'quality_alert':
        return { label: 'Sensor Quality Alert', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'reinforcement':
        return { label: 'Positive Reinforcement', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      default:
        return { label: category, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-bold text-white">AI Teaching Recommendation Agent</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
              Decision Support System
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Correlates temporal classroom proxies to generate evidence-backed pedagogical interventions. Strictly non-punitive; intended solely for reflective teaching enhancement.
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
                {s.session_code}: {s.subject}
              </option>
            ))}
          </select>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>{regenerating ? 'Analyzing...' : 'Re-Analyze Session'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Categories Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {[
            { id: 'all', label: 'All Findings' },
            { id: 'interaction', label: 'Interaction' },
            { id: 'fatigue', label: 'Fatigue & Pacing' },
            { id: 'reinforcement', label: 'Highlights' },
            { id: 'quality_alert', label: 'Quality Flags' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                categoryFilter === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
          {['all', 'active', 'acknowledged', 'dismissed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                statusFilter === st
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Recommendation Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading AI recommendations...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
          <Lightbulb className="w-8 h-8 text-indigo-400 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-200">No Recommendations Match Active Filter</h4>
          <p className="text-xs max-w-md mx-auto">
            Try switching to 'All Findings' or select another classroom session.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendations.map((rec) => {
            const badge = getCategoryBadge(rec.category);
            return (
              <div
                key={rec.id}
                className="p-5 rounded-2xl bg-slate-900/85 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3 text-xs">
                  {/* Card Header: Category Badge + Confidence Pill */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${badge.bg}`}>
                      {badge.label}
                    </span>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{rec.confidence_score}% Confidence</span>
                    </div>
                  </div>

                  {/* 1. Suggested Teaching Action */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-indigo-500/20">
                    <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Suggested Instructional Intervention
                    </div>
                    <p className="text-sm font-bold text-white leading-snug">
                      {rec.suggested_action}
                    </p>
                  </div>

                  {/* 2. Observed Pattern & Supporting Metric */}
                  <div className="space-y-1.5 pl-1">
                    <div>
                      <span className="font-semibold text-slate-300">Observed Pattern: </span>
                      <span className="text-slate-400 leading-relaxed">{rec.pattern_observed}</span>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-300">Supporting Metric: </span>
                      <span className="text-indigo-300/90 font-mono text-[11px]">{rec.supporting_metric}</span>
                    </div>
                  </div>

                  {/* 3. Pedagogical Rationale */}
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Pedagogical Why: </strong>
                    {rec.pedagogical_rationale}
                  </div>

                  {/* Data Quality Indicator */}
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span>Evidence Rigor:</span>
                    <span className="text-slate-400 font-medium">{rec.data_quality_indicator}</span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      rec.status === 'acknowledged'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : rec.status === 'dismissed'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-indigo-500/10 text-indigo-300'
                    }`}
                  >
                    Status: {rec.status}
                  </span>

                  <div className="flex items-center gap-2 text-xs">
                    {rec.status !== 'acknowledged' && (
                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'acknowledged')}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition font-medium"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {rec.status !== 'dismissed' && (
                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'dismissed')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition text-[11px]"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
