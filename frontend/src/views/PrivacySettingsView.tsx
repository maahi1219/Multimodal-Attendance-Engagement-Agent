import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Camera,
  Mic,
  Trash2,
  RefreshCw,
  Database,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileText
} from 'lucide-react';
import { PrivacySettings, ClassroomSession } from '../types';
import { api } from '../api';

interface PrivacySettingsViewProps {
  simulationMode: boolean;
  setSimulationMode: (val: boolean) => void;
  onRefreshAllData: () => void;
}

export const PrivacySettingsView: React.FC<PrivacySettingsViewProps> = ({
  simulationMode,
  setSimulationMode,
  onRefreshAllData
}) => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [sessions, setSessions] = useState<ClassroomSession[]>([]);
  const [selectedPurgeSession, setSelectedPurgeSession] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getPrivacySettings().then(setSettings);
    api.getSessions().then((s) => {
      setSessions(s);
      if (s.length > 0) setSelectedPurgeSession(s[0].id);
    });
  }, []);

  const handleToggle = async (key: keyof PrivacySettings) => {
    if (!settings) return;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await api.updatePrivacySettings(updated);
      if (key === 'simulation_mode_active') {
        setSimulationMode(updated.simulation_mode_active);
      }
    } catch (e) {
      alert('Failed to update setting');
    }
  };

  const handleRetentionChange = async (days: number) => {
    if (!settings) return;
    const updated = { ...settings, data_retention_days: days };
    setSettings(updated);
    await api.updatePrivacySettings(updated);
  };

  const handlePurgeSessionData = async () => {
    if (!selectedPurgeSession) return;
    if (!confirm('Purge raw observational timeline metrics for this session? Attendance aggregate totals will be preserved.')) return;
    try {
      const res = await api.deleteSessionData(selectedPurgeSession);
      alert(res.message);
      onRefreshAllData();
    } catch (e) {
      alert('Failed to purge session metrics');
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('Reset database to pristine demonstration state with 24 synthetic students and sample sessions?')) return;
    try {
      await api.resetDatabase();
      alert('Database successfully reset and reseeded!');
      onRefreshAllData();
    } catch (e) {
      alert('Failed to reset database');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Local Edge Privacy & Data Governance Architecture
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Multimodal Attendance & Engagement Agent processes all video frames and audio signals on-device using local OpenCV, MediaPipe, and Librosa models. No cloud ingestion, no external API streaming, and zero persistent biometric tracking without explicit consent.
          </p>
        </div>
      </div>

      {/* Hardware & Processing Node Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase">Processing Node</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white">Local Offline SQLite</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Zero External Cloud Egress
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase">Camera Status</span>
            <Camera className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-white">Edge Sensor Ready</div>
          <div className="text-[11px] text-indigo-400 mt-1">
            Ephemeral Frames • No Video Stored
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase">Audio Processor</span>
            <Mic className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white">RMS & Acoustic VAD</div>
          <div className="text-[11px] text-amber-400 mt-1">
            Acoustic Energy Only • No Transcription
          </div>
        </div>
      </div>

      {/* Core Privacy Switches */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
          Privacy Policy Controls & Retention
        </h4>

        <div className="divide-y divide-slate-800/80 text-xs">
          {/* Toggle 1: Anonymize Identifiers */}
          <div className="py-4 flex items-center justify-between">
            <div className="pr-4">
              <div className="font-semibold text-slate-200">
                Pseudonymize Student Identifiers in Analytics
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Replaces student names and IDs with pseudonymous tokens (e.g., Participant #4) in charts and reports.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings?.anonymize_student_identifiers || false}
              onChange={() => handleToggle('anonymize_student_identifiers')}
              className="w-5 h-5 rounded text-indigo-600 bg-slate-950 border-slate-800 cursor-pointer"
            />
          </div>

          {/* Toggle 2: Auto-Delete Raw Video */}
          <div className="py-4 flex items-center justify-between">
            <div className="pr-4">
              <div className="font-semibold text-slate-200">
                Immediate Video Memory Purge
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Automatically purges buffered video frames immediately after OpenCV participant extraction.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings?.auto_delete_raw_video ?? true}
              onChange={() => handleToggle('auto_delete_raw_video')}
              className="w-5 h-5 rounded text-indigo-600 bg-slate-950 border-slate-800 cursor-pointer"
            />
          </div>

          {/* Toggle 3: Simulation Demo Mode */}
          <div className="py-4 flex items-center justify-between">
            <div className="pr-4">
              <div className="font-semibold text-slate-200">
                Simulation Demonstration Mode
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Generates realistic correlated multimodal proxies for offline evaluation without requiring a live classroom or webcam.
              </p>
            </div>
            <input
              type="checkbox"
              checked={simulationMode}
              onChange={() => {
                const next = !simulationMode;
                setSimulationMode(next);
                if (settings) {
                  api.updatePrivacySettings({ ...settings, simulation_mode_active: next });
                }
              }}
              className="w-5 h-5 rounded text-indigo-600 bg-slate-950 border-slate-800 cursor-pointer"
            />
          </div>

          {/* Retention Period Slider */}
          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Observational Data Retention Window</div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Automated purging interval for granular time-series engagement records.
                </p>
              </div>
              <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {settings?.data_retention_days || 30} Days
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => handleRetentionChange(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    settings?.data_retention_days === d
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dangerous Actions: Purge Session & Reset Database */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Data Lifecycle & Reset Operations
        </h4>

        {/* Purge Session Metrics */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-semibold text-slate-200">Purge Session Granular Signals</div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Permanently clears second-by-second head pose and audio logs while preserving the official attendance ledger.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedPurgeSession || ''}
              onChange={(e) => setSelectedPurgeSession(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-2.5 py-1.5 text-xs outline-none"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_code}
                </option>
              ))}
            </select>
            <button
              onClick={handlePurgeSessionData}
              className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold rounded-xl border border-rose-500/30 transition cursor-pointer"
            >
              Purge Metrics
            </button>
          </div>
        </div>

        {/* Reset Database */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-semibold text-slate-200">Reset & Reseed Demo Database</div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Refreshes the local SQLite database with the pristine 24-student cohort and calibrated sample sessions.
            </p>
          </div>

          <button
            onClick={handleResetDatabase}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
