import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Edit3,
  ShieldCheck,
  RefreshCw,
  Info,
  X
} from 'lucide-react';
import { ClassroomSession, AttendanceRecord } from '../types';
import { api } from '../api';

interface AttendanceViewProps {
  initialSessionId?: number;
  selectedClass: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  initialSessionId,
  selectedClass
}) => {
  const [sessions, setSessions] = useState<ClassroomSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(initialSessionId || null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Manual Override Modal
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>('present');
  const [overrideNote, setOverrideNote] = useState<string>('');
  const [savingOverride, setSavingOverride] = useState(false);

  // Load Sessions
  useEffect(() => {
    api.getSessions(selectedClass || undefined).then((data) => {
      setSessions(data);
      if (data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].id);
      }
    });
  }, [selectedClass]);

  // Load Attendance Records for Selected Session
  const loadAttendance = async (sessionId: number) => {
    setLoading(true);
    try {
      const data = await api.getSessionAttendance(sessionId);
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      loadAttendance(selectedSessionId);
    }
  }, [selectedSessionId]);

  const currentSession = sessions.find((s) => s.id === selectedSessionId);

  // Handle Manual Override Submit
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSavingOverride(true);
    try {
      await api.updateAttendanceRecord(selectedRecord.id, overrideStatus, overrideNote);
      setSelectedRecord(null);
      if (selectedSessionId) {
        await loadAttendance(selectedSessionId);
      }
    } catch (e) {
      alert('Failed to update attendance record');
    } finally {
      setSavingOverride(false);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedSessionId) return;
    try {
      await fetch(`/api/attendance/session/${selectedSessionId}/recalculate`, { method: 'POST' });
      await loadAttendance(selectedSessionId);
      alert('Sustained presence attendance thresholds recalculated.');
    } catch (e) {
      alert('Failed to recalculate');
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'override'
        ? r.verified_manually
        : r.status === statusFilter;

    const matchesSearch =
      !search ||
      r.student?.name.toLowerCase().includes(search.toLowerCase()) ||
      r.student?.student_id.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;

  return (
    <div className="space-y-6">
      {/* Session Selector & Sustained Presence Threshold Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Sustained Attendance Ledger</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {currentSession?.session_code}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Attendance is determined by continuous physical tracking across video frames (Threshold: ≥70% duration for Present, 40-69% for Late).
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

          <a
            href={api.getAttendanceCsvUrl(selectedSessionId || undefined)}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </a>
        </div>
      </div>

      {/* 3 Metric Cards for this Session */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Enrolled in Class</div>
          <div className="text-2xl font-bold text-white mt-1">{records.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">{currentSession?.class_name}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-xs text-emerald-300 font-medium uppercase tracking-wider">Present (≥70% time)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{presentCount}</div>
          <div className="text-[11px] text-emerald-300/80 mt-1">
            {records.length ? Math.round((presentCount / records.length) * 100) : 0}% of roster
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-xs text-amber-300 font-medium uppercase tracking-wider">Late Arrivals</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{lateCount}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">40% - 69% duration</div>
        </div>

        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <div className="text-xs text-rose-300 font-medium uppercase tracking-wider">Unconfirmed / Absent</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{absentCount}</div>
          <div className="text-[11px] text-rose-300/80 mt-1">&lt; 40% duration</div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
            {['all', 'present', 'late', 'absent', 'override'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'override' ? 'Overrides' : st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRecalculate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition"
          title="Recalculate based on updated session duration"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate</span>
        </button>
      </div>

      {/* Attendance Roster Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading attendance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No attendance records match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Student</th>
                  <th className="pb-3 font-semibold">Student ID</th>
                  <th className="pb-3 font-semibold">Sustained Duration</th>
                  <th className="pb-3 font-semibold">Presence Ratio</th>
                  <th className="pb-3 font-semibold">Attendance Status</th>
                  <th className="pb-3 font-semibold">Verification Audit</th>
                  <th className="pb-3 font-semibold text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.student?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={r.student?.name}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-200">{r.student?.name}</div>
                          <div className="text-[11px] text-slate-400">{r.student?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {r.student?.student_id}
                    </td>
                    <td className="py-3 font-mono">
                      <span className="font-semibold text-white">{r.sustained_presence_duration} mins</span>
                      <span className="text-[10px] text-slate-500 ml-1">/ {currentSession?.duration_minutes || 45}m</span>
                    </td>
                    <td className="py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full ${
                              r.sustained_presence_ratio >= 0.70
                                ? 'bg-emerald-500'
                                : r.sustained_presence_ratio >= 0.40
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.round(r.sustained_presence_ratio * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-300 w-9 text-right">
                          {Math.round(r.sustained_presence_ratio * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                          r.status === 'present'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : r.status === 'late'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {r.status === 'present' && <CheckCircle2 className="w-3 h-3" />}
                        {r.status === 'late' && <Clock className="w-3 h-3" />}
                        {r.status === 'absent' && <XCircle className="w-3 h-3" />}
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-[11px]">
                      {r.verified_manually ? (
                        <div className="text-indigo-400">
                          <span className="font-semibold">Instructor Override:</span> {r.verification_note}
                        </div>
                      ) : (
                        <span className="text-slate-400">Automated Edge Tracker</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedRecord(r);
                          setOverrideStatus(r.status);
                          setOverrideNote(r.verification_note || '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium border border-slate-700 transition flex items-center gap-1 ml-auto"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Override</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Override Dialog */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveOverride}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Manual Attendance Override</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update status for {selectedRecord.student?.name} ({selectedRecord.student?.student_id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Set Attendance Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['present', 'late', 'absent'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOverrideStatus(st)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition border ${
                        overrideStatus === st
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Audit Verification Note</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Instructor verified student present at seat 4; temporary camera obstruction."
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Compliance Audit:</span> Manual corrections are tagged with timestamp and instructor authorization to prevent erroneous penalties.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingOverride}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30"
              >
                {savingOverride ? 'Saving...' : 'Confirm Override'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
