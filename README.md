# Multimodal Attendance & Engagement Agent
### Privacy-Preserving Intelligent Classroom Analytics Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20+%20TypeScript-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![OpenCV](https://img.shields.io/badge/CV-OpenCV%205.0-5C3EE8.svg?logo=opencv&logoColor=white)](https://opencv.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20Offline-003B57.svg?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline%20Edge-10B981.svg)](https://github.com)

---

## 1. Executive Summary & Objective

The **Multimodal Attendance & Engagement Agent** is a full-stack, edge-computing classroom intelligence platform designed to move beyond traditional manual roll calls and intrusive facial surveillance.

By fusing **Computer Vision**, **Acoustic Signal Processing**, and **Agent-Based Pedagogical Reasoning**, the system provides:
1. **Automated Attendance via Sustained Presence**: Evaluates continuous physical presence across classroom video frames rather than single-snapshot facial recognition, eliminating false positives from passersby.
2. **Multimodal Engagement Analysis**: Combines observable proxies (head orientation frontality, motion energy, acoustic dB levels, speech-to-silence ratios, and conversational turns) into an explainable, time-series classroom index.
3. **AI Teaching Recommendations**: An assistive rule and pattern detection agent that analyzes lecture segments (beginning, middle slump, Q&A peak) to generate actionable instructional interventions.
4. **Privacy-Preserving Offline Operation**: 100% on-device local computation using SQLite and local models. Zero cloud dependency, zero external biometric data transmission, and immediate frame-buffer purging.

---

## 2. Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons | Responsive SaaS dark-navy dashboard, HUD telemetry, and responsive views |
| **Data Visualization** | Recharts | Multi-signal area charts, segment comparison bar charts, and rolling gauges |
| **Backend** | Python 3.14 / 3.11+, FastAPI, Uvicorn, Pydantic v2 | High-performance asynchronous REST API and session state machine |
| **Computer Vision** | OpenCV 5.0 (Headless & Contrib), NumPy | Centroid tracking, motion differencing optical flow, head-pose frontality proxy |
| **Audio Processing** | Librosa, Sounddevice, SciPy | RMS energy (dB), voice activity detection (VAD), conversational shift estimation |
| **Database** | SQLite, SQLAlchemy 2.0 | Local embedded database storing students, sessions, attendance, and metrics |
| **AI Reasoning** | Heuristic Multi-Factor Recommendation Agent | Evidence-backed pedagogical suggestions with uncertainty and confidence metrics |

---

## 3. Architecture & Data Flow

```
   ┌────────────────────────────────────────────────────────┐
   │                  CLASSROOM ENVIRONMENT                 │
   │      Webcam Feed / Recorded Video / Simulated Audio    │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  FASTAPI LOCAL BACKEND                      │
 │                                                             │
 │   ┌───────────────────────┐   ┌─────────────────────────┐   │
 │   │ Computer Vision Pipe  │   │  Audio Signal Processor │   │
 │   │ • Euclidean Tracker   │   │ • RMS Energy (dB)       │   │
 │   │ • Motion Differencing │   │ • Speech vs. Silence    │   │
 │   │ • Head-Pose Frontality│   │ • Conversational Turns  │   │
 │   └───────────┬───────────┘   └────────────┬────────────┘   │
 │               │                            │                │
 │               └─────────────┬──────────────┘                │
 │                             ▼                               │
 │             ┌──────────────────────────────┐                │
 │             │   Multimodal Signal Fusion   │                │
 │             │  (Composite Engagement &     │                │
 │             │   Sustained Duration Calc)   │                │
 │             └──────────────┬───────────────┘                │
 │                            ▼                                │
 │             ┌──────────────────────────────┐                │
 │             │ AI Teaching Recommendation   │                │
 │             │            Agent             │                │
 │             └──────────────┬───────────────┘                │
 │                            ▼                                │
 │             ┌──────────────────────────────┐                │
 │             │ Local SQLite Database Engine │                │
 │             └──────────────────────────────┘                │
 └─────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │               REACT 19 + TYPESCRIPT FRONTEND                │
 │  • Dashboard Summary & Rolling Timelines                    │
 │  • Student Management & Individual Profile History          │
 │  • Automated Live Session & Telemetry Gauges                │
 │  • Attendance Ledger with Manual Instructor Overrides       │
 │  • Curriculum Segment Comparison (Start / Mid / End)        │
 │  • Pedagogical Recommendations & Audit Report Exports       │
 └─────────────────────────────────────────────────────────────┘
```

---

## 4. Key Application Features

### A. Executive Dashboard
- **Aggregate Key Performance Indicators**: Enrolled students, completed sessions, average sustained attendance percentage, and composite engagement score.
- **Multimodal Timeline**: Area chart depicting the lecture's temporal engagement curve.
- **Session Attendance Breakdown**: Visual distribution of Present, Late, and Absent students.
- **Recent Activity Roster**: Interactive classroom session log with quick drill-down.

### B. Student Management Module
- **CRUD Operations**: Register, edit, and remove student profiles.
- **Privacy Consent Protocol**: Opt-in toggle generating pseudonymous local face tokens.
- **Individual Attendance History**: Deep inspection drawer showing session-by-session presence durations, arrival times, and manual instructor verification notes.

### C. Automated Attendance & Live Session Runner
- **3 Flexible Operational Modes**:
  1. **Live Camera Feed**: Connects to the local webcam via WebRTC/Canvas, executes OpenCV participant face tracking, and overlays live bounding boxes and frontality estimates.
  2. **Recorded Video Upload**: Ingests uploaded MP4/WebM videos to run automated offline participant tracking.
  3. **Intelligent Demonstration Simulator**: A simulated live classroom session with an animated floor schematic, real-time telemetry gauges, and rolling signal charts.
- **Sustained Presence Thresholding**:
  - `Present`: Sustained presence $\ge 70\%$ of session duration.
  - `Late`: Sustained presence between $40\%$ and $69\%$.
  - `Absent`: Sustained presence $< 40\%$.

### D. Multimodal Engagement Analysis
- **Observable Proxies**:
  - *Head-Pose Frontality*: Face symmetry and aspect ratio analyzing board/slide focus.
  - *Visual Activity*: Normalized frame differencing measuring physical movement and gesture energy.
  - *Acoustic Levels & Speech Ratio*: RMS dB levels tracking lecture voice vs. silence intervals.
  - *Conversational Turns*: Verbal shift counters detecting interactive Q&A exchanges.
- **Curriculum Segment Decomposition**: Compares the Beginning (0–33%), Middle Lecture (33–66%), and Concluding Synthesis (66–100%) to isolate fatigue slumps.

### E. AI Teaching Recommendation Agent
- **Intervention Categories**: Pacing, Student Interaction, Fatigue & Attention Resets, Quality Flags, and Positive Discussion Highlights.
- **Structured Explanations**:
  1. *Observed Pattern*
  2. *Supporting Metric & Timestamp Window*
  3. *Suggested Instructional Action*
  4. *Pedagogical Rationale* (grounded in cognitive load and active recall principles)
  5. *Confidence & Evidence Rigor Indicator*
- **Instructor Workflow**: Mark suggestions as *Acknowledged*, *Implemented*, or *Dismissed*.

### F. Reports & Compliance Export
- **Audit-Ready Printable Summaries**: Formatted certification report with course metadata, student presence ledgers, and instructor/dean signature blocks.
- **One-Click CSV Export**: Downloads complete timestamped attendance records with sustained durations, ratios, and override audit notes.

### G. Privacy & System Settings
- **Edge Node Status**: Live verification of 100% offline local processing.
- **Ephemeral Video Buffer**: Immediate memory purging of raw camera frames.
- **Data Retention Windows**: Configurable 7, 14, 30, 60, or 90-day purging of granular time-series metrics.
- **One-Click Reset**: Reseeds the database with 24 synthetic student records and calibrated curriculum sessions.

---

## 5. Getting Started & Installation

### Prerequisites
- **Python 3.11+** (Tested and verified on Python 3.14)
- **Node.js v18+** & **npm**

### Quick Launch (Windows)

Simply double-click:
```cmd
run_app.bat
```
This orchestrates both the FastAPI backend and Vite frontend automatically in separate processes.

Alternatively, you can launch each service manually:

#### 1. Start the Backend:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Swagger Documentation will be accessible at: `http://127.0.0.1:8000/docs`*

#### 2. Start the Frontend:
```bash
cd frontend
npm install
npm run dev
```
*Frontend Application will be accessible at: `http://localhost:5173`*

---

## 6. API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/analytics/dashboard` | `GET` | High-level system statistics and class distribution |
| `/api/students` | `GET`, `POST` | List and create student profiles with filters |
| `/api/students/{id}` | `GET`, `PUT`, `DELETE` | Retrieve student attendance history, update, or delete |
| `/api/sessions` | `GET`, `POST` | Retrieve and create classroom sessions |
| `/api/sessions/{id}/start` | `POST` | Begin live classroom session tracking |
| `/api/sessions/{id}/end` | `POST` | Finalize session, calculate sustained presence & AI recommendations |
| `/api/attendance/session/{id}` | `GET` | List session attendance records |
| `/api/attendance/{record_id}` | `PUT` | Manual instructor attendance override with audit note |
| `/api/cv/process-frame` | `POST` | Ingest base64 frame for OpenCV participant tracking |
| `/api/cv/live-tick` | `POST` | Advance live session simulation tick |
| `/api/recommendations` | `GET` | List AI teaching recommendations with category filters |
| `/api/recommendations/{id}/status` | `PUT` | Update recommendation state (active/acknowledged/dismissed) |
| `/api/reports/attendance/csv` | `GET` | Stream attendance report as CSV |
| `/api/privacy` | `GET`, `PUT` | Read and update local privacy settings |
| `/api/privacy/reset-database` | `POST` | Reset database with calibrated demo data |

---

## 7. Ethical AI & Privacy Statement

This application strictly adheres to the following principles:
- **Observable Proxies, Not Inward Thoughts**: Facial orientation, silence, and physical movement are observable external proxies. They do not claim to measure a student's internal cognitive comprehension, emotional state, or inherent academic potential.
- **Non-Punitive Decision Support**: AI recommendations serve exclusively as reflective feedback for the instructor's instructional pacing and cannot be used to automatically penalize students.
- **Privacy by Design**: No biometric facial embeddings are stored permanently. Identifiers are stored locally as pseudonymous tokens, with full support for manual verification and consent management.

---

## 8. License & Academic Attribution
Developed for college capstone project demonstration, hackathon evaluation, and academic assessment. Distributed under the MIT License.
