import React from 'react';
import {
  Video,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface TopNavbarProps {
  title: string;
  subtitle: string;
  selectedClass: string;
  setSelectedClass: (className: string) => void;
  availableClasses: string[];
  simulationMode: boolean;
  setSimulationMode: (val: boolean) => void;
  onQuickStartSession: () => void;
  onRefreshData?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  title,
  subtitle,
  selectedClass,
  setSelectedClass,
  availableClasses,
  simulationMode,
  setSimulationMode,
  onQuickStartSession,
  onRefreshData
}) => {
  return (
    <header className="h-18 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Class Filter */}
        <div className="flex items-center bg-slate-800/90 rounded-xl px-3 py-1.5 border border-slate-700/80 text-xs">
          <Layers className="w-3.5 h-3.5 text-indigo-400 mr-2" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-transparent text-slate-200 outline-none cursor-pointer pr-2 font-medium"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Registered Classes</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls} className="bg-slate-900 text-slate-200">
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Toggle (Real Sensor vs Demonstration Simulation) */}
        <button
          onClick={() => setSimulationMode(!simulationMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            simulationMode
              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
          }`}
          title="Toggle between Live Hardware and Simulation Demo mode"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              simulationMode ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <span>{simulationMode ? 'Simulation Demo Mode' : 'Hardware Sensors Active'}</span>
        </button>

        {/* Refresh button if available */}
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Quick Start Action */}
        <button
          onClick={onQuickStartSession}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Start Session</span>
        </button>
      </div>
    </header>
  );
};
