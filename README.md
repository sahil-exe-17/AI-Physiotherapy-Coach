# KInetiQ — AI Physiotherapy Coach & Movement Kinematics Engine

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks%20Vision-0078D4?logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**KInetiQ** is a real-time, privacy-first computer vision physiotherapy web application. It runs directly inside the browser using Google MediaPipe Pose Landmarker to track 33 3D skeletal landmarks, calculate biomechanical joint angles in real time, enforce strict repetition mechanics via a Finite State Machine (FSM), provide instant audio/visual corrective feedback, and automatically record clinical research datasets into multi-sheet Excel files.

Designed with a **minimalistic, soft aesthetic light theme**, KInetiQ bridges modern sports medicine and on-device machine intelligence.

---

## 🌟 Key Features

### 1. 🎯 Precision Computer Vision & Biomechanics
- **33 3D Landmark Tracking**: Uses `@mediapipe/tasks-vision` for ultra-low latency pose estimation running purely on client hardware.
- **Real-Time Joint Angle Math**:
  - **Squat Mechanics**: Tracks Knee Flexion Angle ($\angle \text{Hip-Knee-Ankle}$), Hip Hinge Angle ($\angle \text{Shoulder-Hip-Knee}$), and Torso Inclination ($\angle \text{Shoulder-Hip}$ relative to vertical).
  - **Bicep Curl Mechanics**: Tracks Elbow Flexion ($\angle \text{Shoulder-Elbow-Wrist}$) and Shoulder Drift ($\angle \text{Torso-Shoulder-Elbow}$).
- **Exercise Classifier & Anti-Cheat**: Detects exercise mismatches (e.g., attempting curls while in squat mode) and filters false positives.

### 2. ⚡ Strict Rep Counting & FSM Movement Engine
- **No Free Reps**: Only genuine, full-range reps that pass strict posture requirements are counted.
- **Finite State Machine (FSM)**:
  $$\text{IDLE} \longrightarrow \text{READY} \longrightarrow \text{DESCENDING} \longrightarrow \text{BOTTOM (Peak Squeeze)} \longrightarrow \text{ASCENDING} \longrightarrow \text{REP\_COMPLETE}$$
- **Instant Fault Rejection**:
  - **Shallow Depth**: Reps not reaching the required depth threshold are rejected with a `"SHALLOW REP REJECTED — REDO"` alert.
  - **Torso Lean / Valgus**: Excessive forward lean ($> 35^\circ$) or knee valgus triggers posture warnings and rep cancellation.
- **5-Second Isometric Hold on Last Rep**: The final rep of every set requires an isometric hold at bottom depth before the set is completed.

### 3. 🎨 Minimalist, Soft Aesthetic Interface
- **Calm Wellness Aesthetic**: Built with warm ivory/porcelain backgrounds (`#fafaf9`), soft white frosted glass cards, and clean typography.
- **Non-Intrusive HUD**: Clear rep counters, pace indicators, depth progress bars, and high-contrast feedback banners.
- **Elegant Skeleton Overlay**: Subtle organic emerald & sage joint overlay on camera view without neon glare.

### 4. 📊 Automated Background Dataset Generator (Excel `.xlsx` & CSV)
- **Silent Logging**: Operates completely in the background without cluttering the user interface.
- **Multi-Sheet Workbook Structure**:
  1. **`Repetitions`**: Timestamp, Session ID, Exercise, Intensity, Rep Number, Form Result (`CORRECT` vs `INCORRECT`), Peak Angles, Duration, and Posture Issues.
  2. **`Sessions`**: Target Reps, Total Attempts, Completed/Correct/Incorrect, Accuracy %, Quality Score, and Primary Posture Focus.
  3. **`Kinematics_Telemetry`**: 10–30 FPS time-series joint angles (knees, hips, torso, left/right elbows) and pose confidence.
- **Local Persistence & Instant Export**:
  - Automatically syncs to [`datasets/KinetiQ_Dataset_Latest.xlsx`](./datasets/KinetiQ_Dataset_Latest.xlsx) on the local filesystem.
  - Keyboard Shortcut: Press **`Ctrl + Shift + E`** anywhere to download the workbook.
  - Developer Telemetry: Accessible via the **Dev Mode** button in the top navigation.

### 5. 🔒 100% Privacy & On-Device Processing
- All computer vision inferences are performed locally on your device using WebAssembly/WebGL.
- No video, camera frames, or personal biometric data are ever sent to an external cloud server.

---

## 📂 Project Architecture

```
KInetiQ/
├── datasets/                     # Auto-generated Excel (.xlsx) research datasets
│   └── KinetiQ_Dataset_Latest.xlsx
├── src/
│   ├── components/               # UI components
│   │   ├── AngleDisplay.tsx      # Real-time joint angle gauges
│   │   ├── CalibrationScreen.tsx # Body positioning checklist overlay
│   │   ├── CameraView.tsx        # Video canvas & controls
│   │   ├── DebugPanel.tsx        # Dev mode & dataset export controls
│   │   ├── FeedbackBanner.tsx    # Dynamic posture feedback banner
│   │   ├── Header.tsx            # Minimalist navigation & intensity toggle
│   │   ├── PermissionModal.tsx   # Camera permissions handler
│   │   ├── PoseOverlay.tsx       # 2D/3D skeleton canvas renderer
│   │   ├── SessionControls.tsx   # Pause / Resume / Reset / Finish buttons
│   │   ├── SessionHUD.tsx        # In-workout telemetry overlay & hold timer
│   │   └── SessionSummary.tsx    # Post-session performance breakdown
│   ├── cv/                       # Computer Vision modules
│   │   ├── angleCalculator.ts    # Biomechanical 3-point angle trigonometry
│   │   ├── exerciseClassifier.ts # Real-time movement classification
│   │   ├── landmarkProcessor.ts  # MediaPipe landmark normalizer
│   │   ├── poseDetector.ts       # Vision Landmarker pipeline
│   │   └── poseValidator.ts      # Multi-person & visibility guards
│   ├── exercises/                # Exercise Analyzers & FSM Logic
│   │   ├── armCurlAnalyzer.ts    # Bicep curl FSM & form validator
│   │   ├── exerciseRegistry.ts   # Dynamic exercise definition registry
│   │   ├── exerciseTypes.ts      # Analyzer interfaces
│   │   └── squatAnalyzer.ts      # Squat depth & posture analyzer
│   ├── hooks/                    # React Custom Hooks
│   │   ├── useCamera.ts          # Device stream & camera switching
│   │   ├── useExerciseSession.ts # Workout lifecycle & dataset integration
│   │   └── usePoseDetection.ts   # Continuous unfreezing pose detection loop
│   ├── pages/
│   │   └── ExerciseSession.tsx   # Primary application layout
│   ├── services/
│   │   ├── cameraService.ts      # MediaDevices discovery
│   │   ├── datasetService.ts     # Silent background logger & Excel generator
│   │   ├── sessionService.ts     # Quality scores & stats aggregator
│   │   └── voiceService.ts       # SpeechSynthesis audio coach
│   ├── types/                    # TypeScript interfaces & types
│   │   ├── exercise.ts
│   │   ├── pose.ts
│   │   └── session.ts
│   ├── utils/
│   │   ├── geometry.ts           # Vector 2D/3D math calculations
│   │   ├── smoothing.ts          # EMA angle filtering
│   │   └── validation.ts         # Calibration checks
│   ├── App.tsx                   # Main entry root
│   ├── index.css                 # Soft minimalist light theme design tokens
│   └── main.tsx                  # React DOM mount point
├── vite.config.ts                # Vite config & dataset file-saving middleware
└── package.json                  # Dependencies & build scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or later recommended)
- **npm** (v9.0.0 or later) or **pnpm** / **yarn**
- Modern Web Browser (Chrome, Edge, Brave, or Safari with WebGL enabled)
- Web Camera

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sahil-exe-17/AI-Physiotherapy-Coach.git
   cd AI-Physiotherapy-Coach
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🏃 Available Scripts

- `npm run dev` — Launches the local Vite development server with hot module replacement (HMR) and dataset file-saving API.
- `npm run build` — Compiles TypeScript (`tsc`) and generates an optimized production bundle in `/dist`.
- `npm run preview` — Previews the production build locally.

---

## 📐 Biomechanical Thresholds & Intensity Modes

| Mode | Squat Target Knee Angle | Bicep Curl Squeeze Angle | Target Reps | Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Gentle (Low)** | $\le 125^\circ$ (Half squat) | $\le 85^\circ$ | 10 | Rehabilitation & Mobility |
| **Standard (Med)** | $\le 105^\circ$ (Parallel) | $\le 65^\circ$ | 10 | General Fitness & Conditioning |
| **Deep (High)** | $\le 90^\circ$ (Deep athletic) | $\le 45^\circ$ | 10 | Strength & Athletic Range |

---

## 📊 Dataset Collection for Machine Learning & Research

As you test or perform exercises, KInetiQ automatically compiles your biomechanical data:

- **Disk Location**: [`datasets/KinetiQ_Dataset_Latest.xlsx`](./datasets/KinetiQ_Dataset_Latest.xlsx)
- **Instant Export**: Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd>
- **Console API**:
  ```javascript
  // Trigger export from DevTools Console
  window.__exportDataset();

  // Inspect stored reps
  console.log(window.__kinetiqDataset.getReps());
  ```

---

## 🛡️ License

This project is open-source under the [MIT License](LICENSE).

---

## 👨‍💻 Author

Developed with care by **[Sahil Lale](https://github.com/sahil-exe-17)**.
Contributions, issues, and feature requests are welcome!
