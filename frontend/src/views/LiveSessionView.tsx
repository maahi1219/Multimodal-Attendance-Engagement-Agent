import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Video,
  Upload,
  Cpu,
  ShieldCheck,
  Users,
  Eye,
  Mic,
  Activity,
  AlertCircle,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Clock,
  Layers,
  Volume2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { ClassroomSession, AttendanceRecord, AIRecommendation } from '../types';
import { api } from '../api';

interface LiveSessionViewProps {
  availableClasses: string[];
  onNavigateTab: (tab: string, sessionId?: number) => void;
}

export const LiveSessionView: React.FC<LiveSessionViewProps> = ({
  availableClasses,
  onNavigateTab
}) => {
  // Session State
  const [sessions, setSessions] = useState<ClassroomSession[]>([]);
  const [activeSession, setActiveSession] = useState<ClassroomSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'live' | 'paused' | 'completed'>('idle');
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);

  // Mode: 'simulation' | 'webcam' | 'video_upload'
  const [inputMode, setInputMode] = useState<'simulation' | 'webcam' | 'video_upload'>('simulation');

  // Real-time Multimodal Metrics
  const [liveMetrics, setLiveMetrics] = useState({
    visual_activity: 46.2,
    head_pose_frontality: 84.5,
    visual_inactivity: 28.0,
    audio_level_db: -28.4,
    speech_activity: 24.0,
    silence_ratio: 76.0,
    turns: 2,
    composite_engagement: 74.8,
    active_participants: 8,
    present_count: 7,
    late_count: 1,
    absent_count: 0,
    quality_flag: 'optimal'
  });

  const [metricHistory, setMetricHistory] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [liveAIAdvice, setLiveAIAdvice] = useState<string>(
    "Instructional baseline optimal. Frontality proxy indicates high lecture focal engagement."
  );

  // Hardware Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cvTrackedOverlays, setCvTrackedOverlays] = useState<any[]>([]);

  // Video Upload Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // New Session Creation Form Modal
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({
    title: 'Advanced Distributed Protocols & State Machines',
    class_name: availableClasses[0] || 'CS-301 Computer Networks',
    subject: 'Distributed Consensus',
    room: 'Hall 4B - Intelligent Lab',
    duration_minutes: 45
  });

  // Load Sessions
  const fetchSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        // Find existing live session or newest
        const live = data.find((s) => s.status === 'live' || s.status === 'paused');
        if (live) {
          setActiveSession(live);
          setSessionStatus(live.status as any);
        } else {
          setActiveSession(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Load attendance records whenever active session changes
  useEffect(() => {
    if (!activeSession) return;
    api.getSessionAttendance(activeSession.id)
      .then((recs) => setAttendanceRecords(recs))
      .catch((e) => console.error(e));
  }, [activeSession]);

  // Webcam Setup & Cleanup
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      alert('Camera access denied or unavailable. Falling back to Simulation Mode.');
      setInputMode('simulation');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (inputMode === 'webcam') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [inputMode]);

  // Capture frame from video/canvas and send to backend OpenCV CV tracker
  const captureAndProcessWebcamFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const b64Image = canvas.toDataURL('image/jpeg', 0.7);

    try {
      const analysis = await api.processFrame(
        b64Image,
        activeSession?.id,
        sessionElapsedSeconds
      );
      if (analysis && analysis.participants) {
        setCvTrackedOverlays(analysis.participants);
        setLiveMetrics((prev) => ({
          ...prev,
          visual_activity: analysis.visual_activity_score,
          head_pose_frontality: analysis.head_pose_frontality,
          visual_inactivity: analysis.visual_inactivity_ratio,
          composite_engagement: analysis.composite_visual_score,
          active_participants: analysis.sustained_participants,
          quality_flag: analysis.quality_flag
        }));
      }
    } catch (e) {
      console.error('Frame processing error', e);
    }
  };

  // Video File Upload Handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.play();
      }
    }
  };

  // Periodic Ticks during Live Session (every 3 seconds)
  useEffect(() => {
    if (sessionStatus !== 'live' || !activeSession) return;

    const interval = setInterval(async () => {
      setSessionElapsedSeconds((prev) => {
        const nextSec = prev + 3;

        // If in webcam or uploaded video mode, analyze actual frames
        if ((inputMode === 'webcam' || inputMode === 'video_upload') && cameraActive) {
          captureAndProcessWebcamFrame();
        } else {
          // Simulation / Demonstration Mode
          api.liveTick(activeSession.id, nextSec).then((tick) => {
            setLiveMetrics(tick);
            setMetricHistory((hist) => {
              const updated = [
                ...hist,
                {
                  second: nextSec,
                  minute: roundDec(nextSec / 60, 1),
                  engagement: tick.composite_engagement,
                  visual: tick.visual_activity,
                  frontality: tick.head_pose_frontality,
                  speech: tick.speech_activity
                }
              ];
              return updated.slice(-20); // Keep last 20 rolling points
            });

            // Update live attendance records
            api.getSessionAttendance(activeSession.id).then(setAttendanceRecords);

            // Dynamic Pedagogical AI Advice
            if (tick.composite_engagement < 45.0) {
              setLiveAIAdvice("Observable activity slump detected. Recommend posing a quick concept question or launching a 2-min Think-Pair-Share.");
            } else if (tick.speech_activity > 38.0) {
              setLiveAIAdvice("High conversational exchange detected. Students actively engaging in vocal discussion.");
            } else if (tick.head_pose_frontality > 85.0) {
              setLiveAIAdvice("High forward orientation proxy. Focused lecture reception maintained.");
            } else {
              setLiveAIAdvice("Classroom engagement indices balanced across visual and acoustic proxies.");
            }
          });
        }

        return nextSec;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionStatus, activeSession, inputMode, cameraActive]);

  const roundDec = (val: number, dec: number) => {
    const factor = Math.pow(10, dec);
    return Math.round(val * factor) / factor;
  };

  // Session Control Actions
  const handleStartSession = async () => {
    if (!activeSession) return;
    try {
      await api.startSession(activeSession.id);
      setSessionStatus('live');
    } catch (e) {
      alert('Failed to start session');
    }
  };

  const handlePauseSession = async () => {
    if (!activeSession) return;
    try {
      await api.pauseSession(activeSession.id);
      setSessionStatus('paused');
    } catch (e) {
      alert('Failed to pause session');
    }
  };

  const handleResumeSession = async () => {
    if (!activeSession) return;
    try {
      await api.resumeSession(activeSession.id);
      setSessionStatus('live');
    } catch (e) {
      alert('Failed to resume session');
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    if (!confirm('Complete this session and finalize attendance & AI recommendation analysis?')) return;
    try {
      await api.endSession(activeSession.id);
      setSessionStatus('completed');
      alert('Session completed! Sustained attendance and AI teaching suggestions calculated.');
      fetchSessions();
      onNavigateTab('attendance', activeSession.id);
    } catch (e) {
      alert('Failed to end session');
    }
  };

  const handleCreateNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createSession({
        ...newSessionForm,
        session_code: `SES-2026-${Math.floor(100 + Math.random() * 900)}`,
        mode: inputMode === 'webcam' ? 'camera' : inputMode,
        is_simulated: inputMode === 'simulation'
      });
      setShowNewSessionModal(false);
      await fetchSessions();
      setActiveSession(created);
      setSessionStatus('idle');
      setSessionElapsedSeconds(0);
      setMetricHistory([]);
    } catch (e) {
      alert('Failed to create session');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Session Header Card & Live Controller */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                sessionStatus === 'live'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : sessionStatus === 'paused'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : sessionStatus === 'completed'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {sessionStatus === 'live' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              )}
              {sessionStatus === 'idle' ? 'Ready to Start' : sessionStatus}
            </span>

            <span className="text-xs text-slate-400 font-mono">
              {activeSession?.session_code}
            </span>
            <span className="text-xs text-indigo-400 font-medium">
              • {activeSession?.class_name}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            {activeSession?.title || 'No Session Selected'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Subject: {activeSession?.subject} • Room: {activeSession?.room} • Target: {activeSession?.duration_minutes} Mins
          </p>
        </div>

        {/* Live Controls & Timer */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Elapsed Timer Display */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl">
            <Clock className="w-4 h-4 text-indigo-400" />
            <div className="font-mono text-base font-bold text-white">
              {formatTime(sessionElapsedSeconds)}
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Elapsed</span>
          </div>

          {/* Action Buttons */}
          {sessionStatus === 'idle' || sessionStatus === 'completed' ? (
            <button
              onClick={handleStartSession}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Session</span>
            </button>
          ) : sessionStatus === 'live' ? (
            <>
              <button
                onClick={handlePauseSession}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow transition cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow transition cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>End & Compile</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleResumeSession}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow transition cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>End Session</span>
              </button>
            </>
          )}

          {/* Select Session Dropdown or Create New */}
          <select
            value={activeSession?.id || ''}
            onChange={(e) => {
              const ses = sessions.find((s) => s.id === Number(e.target.value));
              if (ses) {
                setActiveSession(ses);
                setSessionStatus(ses.status as any);
                setSessionElapsedSeconds(0);
              }
            }}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.session_code}: {s.subject}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewSessionModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition"
          >
            + Create Session
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs (Webcam vs Video Upload vs Simulation Demo) */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 px-2 font-medium">Input Source:</span>
          <button
            onClick={() => setInputMode('simulation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              inputMode === 'simulation'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Intelligent Simulation Engine (Offline Demo)
          </button>

          <button
            onClick={() => setInputMode('webcam')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              inputMode === 'webcam'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Live Camera Feed</span>
          </button>

          <button
            onClick={() => setInputMode('video_upload')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              inputMode === 'video_upload'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Recorded Video Upload</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pr-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local OpenCV Frame Analysis</span>
        </div>
      </div>

      {/* Main View Grid: Video/Schematic Stage + Live HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Video / Interactive Classroom Stage */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="relative aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            {inputMode === 'webcam' || inputMode === 'video_upload' ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} width={640} height={480} className="hidden" />

                {/* Overlaid OpenCV HUD Bounding Boxes */}
                {cvTrackedOverlays.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${(p.bbox[0] / 640) * 100}%`,
                      top: `${(p.bbox[1] / 480) * 100}%`,
                      width: `${(p.bbox[2] / 640) * 100}%`,
                      height: `${(p.bbox[3] / 480) * 100}%`
                    }}
                    className="absolute border-2 border-emerald-400 bg-emerald-400/10 pointer-events-none rounded transition-all"
                  >
                    <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                      {p.participant_id} • Frontal {p.frontality_score}%
                    </div>
                  </div>
                ))}
              </>
            ) : (
              /* Simulation Animated Classroom schematic */
              <div className="relative w-full h-full p-6 flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950/20">
                {/* Podium / Whiteboard Zone */}
                <div className="w-full flex items-center justify-between border-b border-indigo-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Instructor Podium & Whiteboard Zone
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Camera FOV: 92° Wide
                  </div>
                </div>

                {/* Simulated Student Seats Grid */}
                <div className="grid grid-cols-4 gap-4 my-auto">
                  {attendanceRecords.slice(0, 8).map((rec, i) => {
                    const isFocus = rec.status === 'present';
                    return (
                      <div
                        key={rec.id}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isFocus
                            ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                            : 'bg-slate-900/60 border-slate-800'
                        }`}
                      >
                        <div className="relative inline-block mb-1">
                          <img
                            src={rec.student?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={rec.student?.name}
                            className="w-10 h-10 rounded-xl object-cover mx-auto border border-slate-700"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                              isFocus ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                        </div>
                        <div className="text-[11px] font-semibold text-slate-200 truncate">
                          {rec.student?.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {rec.sustained_presence_duration}m • {rec.status}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Simulation Watermark */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                  <span>Simulation Mode: Stochastic Classroom Behavioral Dynamics</span>
                  <span>FPS: 30 • Local CPU Tracking</span>
                </div>
              </div>
            )}

            {/* Video Upload Input Overlay if in video upload mode */}
            {inputMode === 'video_upload' && !uploadedVideoUrl && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Upload className="w-10 h-10 text-indigo-400 animate-bounce" />
                <h4 className="text-sm font-bold text-white">Upload Classroom Video Recording</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Select an MP4, WebM or MOV video file of your classroom lecture to run participant tracking and sustained presence analysis.
                </p>
                <input
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Choose Video File
                </button>
              </div>
            )}
          </div>

          {/* Live AI Teaching Assistant Notification Ribbon */}
          <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-indigo-300 mr-1.5">AI Assistive Copilot:</span>
              <span className="text-slate-200">{liveAIAdvice}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Live Multimodal Telemetry Gauges */}
        <div className="space-y-4">
          {/* Gauge 1: Composite Engagement Score */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Composite Engagement
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono font-bold">
                {liveMetrics.composite_engagement}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${liveMetrics.composite_engagement}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>Passive</span>
              <span>Balanced</span>
              <span>Highly Interactive</span>
            </div>
          </div>

          {/* Gauge 2: Head-Pose Frontality (Board/Slide Focus) */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                Head-Pose Frontality
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                {liveMetrics.head_pose_frontality}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${liveMetrics.head_pose_frontality}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Observable proxy for front-facing lecture orientation (±25° yaw).
            </p>
          </div>

          {/* Gauge 3: Visual Motion & Activity Level */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Visual Activity Energy
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold">
                {liveMetrics.visual_activity}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${liveMetrics.visual_activity}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>Inactivity: {liveMetrics.visual_inactivity}%</span>
              <span>Optimal Gesture Range</span>
            </div>
          </div>

          {/* Gauge 4: Acoustic Energy & Speech Intervals */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                Classroom Audio & Speech
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold">
                {liveMetrics.audio_level_db} dB
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${liveMetrics.speech_activity}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>Speech: {liveMetrics.speech_activity}%</span>
              <span>Silence: {liveMetrics.silence_ratio}%</span>
              <span>Turns: {liveMetrics.turns}</span>
            </div>
          </div>

          {/* Live Attendance Tally Status */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-bold text-white mb-2 flex items-center justify-between">
              <span>Sustained Attendance Tally</span>
              <span className="text-[10px] text-slate-400">Threshold: ≥70%</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="font-bold text-emerald-400">{liveMetrics.present_count}</div>
                <div className="text-[9px] text-emerald-300 uppercase">Present</div>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="font-bold text-amber-400">{liveMetrics.late_count}</div>
                <div className="text-[9px] text-amber-300 uppercase">Late</div>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="font-bold text-rose-400">{liveMetrics.absent_count}</div>
                <div className="text-[9px] text-rose-300 uppercase">Absent</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Streaming Line Chart (Rolling 60 Seconds) */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Live Signal Progression (Rolling Window)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuously updating engagement, frontality, and speech signals streamed from the local edge worker.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Engagement
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Frontality
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Speech Activity
            </span>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metricHistory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="second" stroke="#64748b" fontSize={10} tickFormatter={(s) => `${s}s`} />
              <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="frontality" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="speech" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Create New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewSession}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create New Classroom Session</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set up subject and class parameters to begin tracking.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={newSessionForm.title}
                  onChange={(e) => setNewSessionForm({ ...newSessionForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Class / Section</label>
                <select
                  value={newSessionForm.class_name}
                  onChange={(e) => setNewSessionForm({ ...newSessionForm, class_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newSessionForm.subject}
                  onChange={(e) => setNewSessionForm({ ...newSessionForm, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Classroom / Hall</label>
                  <input
                    type="text"
                    value={newSessionForm.room}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, room: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={newSessionForm.duration_minutes}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, duration_minutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewSessionModal(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30"
              >
                Create Session
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
