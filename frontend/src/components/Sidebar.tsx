import React from 'react';
import {
  LayoutDashboard,
  Users,
  Video,
  ClipboardCheck,
  TrendingUp,
  Sparkles,
  FileText,
  ShieldCheck,
  Cpu,
  Radio
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeRecommendationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeRecommendationsCount
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'live-session', label: 'Live Session', icon: Video, badge: 'LIVE', isLive: true },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'analytics', label: 'Engagement Analytics', icon: TrendingUp },
    {
      id: 'recommendations',
      label: 'AI Recommendations',
      icon: Sparkles,
      count: activeRecommendationsCount
    },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'privacy', label: 'Privacy & Settings', icon: ShieldCheck },
  ];

  return (
    <aside className="w-68 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">
              ClassroomAI
            </h1>
            <p className="text-xs text-indigo-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Multimodal Agent
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.isLive && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live
                  </span>
                )}

                {item.count !== undefined && item.count > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Privacy & Edge Status Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Offline Privacy
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Data stays on local device. No raw video stored without consent.
          </p>
        </div>
      </div>
    </aside>
  );
};
