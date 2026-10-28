import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Search
} from 'lucide-react';
import { ClassroomSession } from '../types';
import { api } from '../api';

interface ReportsViewProps {
  availableClasses: string[];
  selectedClass: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  availableClasses,
  selectedClass
}) => {
  const [sessions, setSessions] = useState<ClassroomSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [reportType, setReportType] = useState<'session_full' | 'class_summary' | 'student_audit'>('session_full');
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

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
    api.getSessionReportSummary(selectedSessionId)
      .then((data) => setReportData(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [selectedSessionId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Academic Analytics & Compliance Reports</h3>
          </div>
          <p className="text-xs text-slate-400">
            Generate audit-ready attendance summaries, sustained presence ledgers, and multimodal engagement documentation.
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

          <a
            href={api.getAttendanceCsvUrl(selectedSessionId || undefined)}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas Document */}
      <div className="p-8 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200 max-w-4xl mx-auto space-y-6 print:p-0 print:shadow-none print:border-none print:max-w-none">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Department of Academic Intelligence & Evaluation
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight mt-1">
              Classroom Attendance & Multimodal Engagement Report
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Verified Local Edge Assessment • Privacy Preserving Sustained Presence Tracking
            </p>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono">
            <div>Report ID: REP-{reportData?.session.code || '2026'}</div>
            <div>Generated: {reportData?.generated_at}</div>
            <div className="font-semibold text-emerald-700 mt-0.5">Status: Verified</div>
          </div>
        </div>

        {/* Session Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Class / Course</span>
            <span className="font-bold text-slate-900 text-sm">{reportData?.session.class_name}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Subject / Module</span>
            <span className="font-bold text-slate-900 text-sm">{reportData?.session.subject}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Instructor</span>
            <span className="font-bold text-slate-900 text-sm">{reportData?.session.instructor}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Date & Room</span>
            <span className="font-bold text-slate-900 text-sm">{reportData?.session.room}</span>
          </div>
        </div>

        {/* 3 Metric High-Level Summaries */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="text-2xl font-black text-emerald-600">
              {reportData?.session.attendance_rate}%
            </div>
            <div className="text-[10px] font-bold text-slate-600 uppercase mt-1">
              Average Sustained Attendance
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {reportData?.session.present_count} Present • {reportData?.session.late_count} Late • {reportData?.session.absent_count} Absent
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="text-2xl font-black text-indigo-600">
              {reportData?.session.avg_engagement} <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <div className="text-[10px] font-bold text-slate-600 uppercase mt-1">
              Multimodal Engagement Score
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Correlated Visual Motion & Audio Turns
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="text-2xl font-black text-slate-800">
              {reportData?.session.duration_minutes} Mins
            </div>
            <div className="text-[10px] font-bold text-slate-600 uppercase mt-1">
              Full Lecture Duration
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Threshold: ≥70% Sustained Time
            </div>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
            I. Student Sustained Presence Roster
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Sustained Time</th>
                  <th className="py-2.5 px-3">Presence Ratio</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Audit Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {reportData?.attendance.map((stu: any) => (
                  <tr key={stu.student_id}>
                    <td className="py-2.5 px-3 font-semibold">{stu.name}</td>
                    <td className="py-2.5 px-3 font-mono">{stu.student_id}</td>
                    <td className="py-2.5 px-3 font-mono">{stu.sustained_duration_mins} mins</td>
                    <td className="py-2.5 px-3 font-mono">{stu.sustained_ratio_pct}%</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                          stu.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : stu.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {stu.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600">
                      {stu.verified_manually ? (
                        <span className="text-indigo-700 font-medium">Instructor Override ({stu.note})</span>
                      ) : (
                        'Automated Computer Vision Tracker'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Teaching Recommendations Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
            II. AI Instructional Insights & Pedagogical Feedback
          </h3>

          <div className="space-y-3">
            {reportData?.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="text-indigo-700 capitalize">{rec.category.replace('_', ' ')} Strategy</span>
                  <span className="font-mono text-slate-500 text-[11px]">{rec.confidence}% Confidence</span>
                </div>
                <div>
                  <strong>Observed Pattern: </strong>
                  <span className="text-slate-700">{rec.pattern}</span>
                </div>
                <div>
                  <strong>Suggested Teaching Action: </strong>
                  <span className="text-slate-900 font-semibold">{rec.action}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <strong>Rationale: </strong>{rec.rationale}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures & Certification Footer */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-600">
          <div>
            <div className="font-bold text-slate-900 mb-6">Instructor In-Charge Signature:</div>
            <div className="border-b border-slate-400 w-48 mb-1"></div>
            <div>Prof. Elena Vance</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-900 mb-6">Department Head Verification:</div>
            <div className="border-b border-slate-400 w-48 ml-auto mb-1"></div>
            <div>Academic Dean / Registrar</div>
          </div>
        </div>
      </div>
    </div>
  );
};
