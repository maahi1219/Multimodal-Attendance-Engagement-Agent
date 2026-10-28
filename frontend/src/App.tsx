import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { LiveSessionView } from './views/LiveSessionView';
import { AttendanceView } from './views/AttendanceView';
import { AnalyticsView } from './views/AnalyticsView';
import { RecommendationsView } from './views/RecommendationsView';
import { ReportsView } from './views/ReportsView';
import { PrivacySettingsView } from './views/PrivacySettingsView';
import { DashboardStats } from './types';
import { api } from './api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [simulationMode, setSimulationMode] = useState<boolean>(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [activeRecsCount, setActiveRecsCount] = useState<number>(3);
  const [targetedSessionId, setTargetedSessionId] = useState<number | undefined>(undefined);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Initial Data Fetch
  const refreshAllData = async () => {
    try {
      const [stats, classData, recs] = await Promise.all([
        api.getDashboard(selectedClass || undefined),
        api.getClassesAndDepartments(),
        api.getRecommendations(undefined, undefined, 'active')
      ]);
      setDashboardStats(stats);
      setAvailableClasses(classData.classes);
      setActiveRecsCount(recs.length);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [selectedClass]);

  const handleNavigateTab = (tab: string, sessionId?: number) => {
    if (sessionId) {
      setTargetedSessionId(sessionId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getViewTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Classroom Intelligence Dashboard', subtitle: 'Automated attendance, multimodal proxies & AI recommendations' };
      case 'students':
        return { title: 'Student Roster Management', subtitle: 'Consent records, enrollment details & individual attendance histories' };
      case 'live-session':
        return { title: 'Automated Attendance & Live Session', subtitle: 'Real-time OpenCV tracking, telemetry gauges & assistive copilot' };
      case 'attendance':
        return { title: 'Sustained Presence Attendance', subtitle: 'Continuous frame tracking verification and instructor audit overrides' };
      case 'analytics':
        return { title: 'Multimodal Engagement Analytics', subtitle: 'Signal timelines, curriculum segment comparisons & cross-session benchmarks' };
      case 'recommendations':
        return { title: 'AI Teaching Recommendation Agent', subtitle: 'Assistive pedagogical suggestions with supporting metrics and rationales' };
      case 'reports':
        return { title: 'Reports & Compliance Export', subtitle: 'Printable session summaries, attendance rosters & CSV data exports' };
      case 'privacy':
        return { title: 'Privacy & System Settings', subtitle: 'Local edge processing verification, data retention & simulation controls' };
      default:
        return { title: 'Classroom Analytics Agent', subtitle: 'Offline Multimodal Intelligence' };
    }
  };

  const { title, subtitle } = getViewTitle();

  return (
    <div className="flex min-h-screen w-full bg-[#0b0f19] text-slate-100 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setTargetedSessionId(undefined);
          setActiveTab(tab);
        }}
        activeRecommendationsCount={activeRecsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          title={title}
          subtitle={subtitle}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          availableClasses={availableClasses}
          simulationMode={simulationMode}
          setSimulationMode={setSimulationMode}
          onQuickStartSession={() => handleNavigateTab('live-session')}
          onRefreshData={refreshAllData}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loadingInitial ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-400">Loading intelligent classroom models...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  stats={dashboardStats}
                  onNavigateTab={handleNavigateTab}
                  selectedClass={selectedClass}
                />
              )}

              {activeTab === 'students' && (
                <StudentsView selectedClass={selectedClass} />
              )}

              {activeTab === 'live-session' && (
                <LiveSessionView
                  availableClasses={availableClasses}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceView
                  initialSessionId={targetedSessionId}
                  selectedClass={selectedClass}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  initialSessionId={targetedSessionId}
                  selectedClass={selectedClass}
                />
              )}

              {activeTab === 'recommendations' && (
                <RecommendationsView
                  initialSessionId={targetedSessionId}
                  selectedClass={selectedClass}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  availableClasses={availableClasses}
                  selectedClass={selectedClass}
                />
              )}

              {activeTab === 'privacy' && (
                <PrivacySettingsView
                  simulationMode={simulationMode}
                  setSimulationMode={setSimulationMode}
                  onRefreshAllData={refreshAllData}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
