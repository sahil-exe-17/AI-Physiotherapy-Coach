import React, { useState } from 'react';
import {
  Home,
  Search,
  LayoutGrid,
  ClipboardList,
  Bell,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  ArrowUpRight,
  Heart,
  Bookmark,
  Share2,
  Activity,
  Sparkles,
  Target,
  Zap,
  Play,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  User,
  Sliders,
} from 'lucide-react';

interface LandingPageProps {
  onStartIntake: () => void;
  onOpenAuth: (mode?: 'signup' | 'login') => void;
  onDirectStartWorkout?: (exerciseId: string) => void;
  userName?: string;
}

interface ProtocolPreset {
  title: string;
  tag: string;
  desc: string;
  spec1: string;
  spec2: string;
  reps: string;
  sets: string;
  exerciseId: string;
}

const JOINT_PRESETS: Record<string, ProtocolPreset> = {
  Knee: {
    title: 'Knee Rehabilitation Protocol',
    tag: 'Real-Time MediaPipe • 30 FPS',
    desc: 'Adaptive eccentric loading calibrated for minimal patellofemoral compression based on clinical ROM baselines.',
    spec1: '📐 104° Knee Flexion',
    spec2: '🎯 168° Hip Alignment',
    reps: '10 Target Reps',
    sets: '2 Sets (Low Pace)',
    exerciseId: 'squat',
  },
  Shoulder: {
    title: 'Rotator Cuff & Scapular Rhythm',
    tag: 'Deltoid & Glenohumeral Tracking',
    desc: 'Controlled abduction and external rotation preventing subacromial impingement during elevation.',
    spec1: '📐 155° Abduction Arc',
    spec2: '🎯 90° Elbow Pivot',
    reps: '12 Target Reps',
    sets: '2 Sets (Controlled)',
    exerciseId: 'shoulder_raise',
  },
  Hip: {
    title: 'Pelvic & Hip Flexor Mobility',
    tag: 'Acetabulofemoral Kinematics',
    desc: 'Low-impact active range restoration rebuilding functional gait mechanics without anterior shear.',
    spec1: '📐 115° Hip Flexion',
    spec2: '🎯 170° Extension Gate',
    reps: '10 Target Reps',
    sets: '2 Sets (Gentle)',
    exerciseId: 'straight_leg_raise',
  },
  Back: {
    title: 'Lumbar Stabilization & Core Brace',
    tag: 'Neutral Spine Biomechanics',
    desc: 'Decompressed spinal stabilizer engagement with zero axial spine loading for acute lower back relief.',
    spec1: '📐 180° Neutral Lumbar',
    spec2: '🎯 95° Supported Hinge',
    reps: '8 Target Reps',
    sets: '3 Sets (Core Hold)',
    exerciseId: 'straight_leg_raise',
  },
  Arms: {
    title: 'Biomechanical Arm & Elbow Protocol',
    tag: 'Bicep & Tricep Force Vector',
    desc: 'Full functional elbow extension and eccentric curl tracking with strict false-rep compensation guards.',
    spec1: '📐 55° Peak Flexion',
    spec2: '🎯 145° Full Extension',
    reps: '10 Target Reps',
    sets: '2 Sets (Standard)',
    exerciseId: 'arm_curl',
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartIntake,
  onOpenAuth,
  onDirectStartWorkout,
  userName = 'Alex Johnson',
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'grid' | 'protocol'>('home');
  const [selectedJoint, setSelectedJoint] = useState<string>('Knee');
  const [selectedGoal, setSelectedGoal] = useState<string>('Recovery');
  const [selectedPain, setSelectedPain] = useState<string>('Pain: 3/10');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(4428);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const currentProtocol = JOINT_PRESETS[selectedJoint] || JOINT_PRESETS.Knee;

  // Gentle 3D parallax tracking across floating elements
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleToggleLike = () => {
    if (isLiked) {
      setLikeCount((c) => c - 1);
      setIsLiked(false);
    } else {
      setLikeCount((c) => c + 1);
      setIsLiked(true);
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-screen flex flex-col justify-between overflow-x-hidden select-none bg-stone-900 text-stone-900 font-sans"
    >
      {/* ================= PEACEFUL WHOLE-SCREEN CLINICAL STUDIO BACKGROUND ================= */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out z-0 scale-100"
        style={{
          backgroundImage: "url('/peaceful_physio_studio.jpg')",
          transform: `scale(1.03) translate(${mousePos.x * -6}px, ${mousePos.y * -6}px)`,
        }}
      >
        {/* Peaceful ambient lighting gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/70 via-stone-950/20 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[0.5px]" />
      </div>

      {/* ================= TOP GLOBAL NAVBAR & FLOATING FILTER BAR ================= */}
      <header className="relative z-30 w-full px-4 sm:px-8 pt-5 pb-3 flex items-center justify-between">
        {/* Left Brand Identifier */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/90 backdrop-blur-md text-stone-900 flex items-center justify-center shadow-lg border border-white/80">
            <Activity className="h-5 w-5 text-stone-900" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-heading drop-shadow-md">
                KinetiQ
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                AI Physio
              </span>
            </div>
            <p className="text-[11px] font-medium text-stone-300 drop-shadow-sm">
              Clinical Bio-Kinematics Engine
            </p>
          </div>
        </div>

        {/* Center: The Floating Filter / Protocol Pill Bar */}
        <div className="hidden lg:flex items-center bg-white/85 backdrop-blur-2xl border border-white/70 rounded-full py-1.5 px-3 shadow-[0_12px_40px_rgba(0,0,0,0.22)] gap-2 transition-all hover:shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
          {/* Protocol Button */}
          <button
            type="button"
            onClick={onStartIntake}
            className="px-5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold tracking-wide shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Protocol</span>
          </button>

          {/* Filter 1: Target Joint Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full hover:bg-stone-100/80 text-left transition-colors flex flex-col cursor-pointer"
            >
              <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                <Target className="h-2.5 w-2.5 text-stone-500" />
                Target Joint
              </span>
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                {selectedJoint} <ChevronDown className="h-3 w-3 text-stone-400" />
              </span>
            </button>
            <div className="absolute top-full left-0 mt-2 hidden group-hover:flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200/90 py-1.5 min-w-[130px] z-50 animate-scale-up">
              {['Knee', 'Shoulder', 'Hip', 'Back', 'Arms'].map((j) => (
                <button
                  key={j}
                  onClick={() => setSelectedJoint(j)}
                  className={`px-3.5 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between ${
                    selectedJoint === j
                      ? 'bg-stone-900 text-white'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span>{j}</span>
                  {selectedJoint === j && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-stone-200/80" />

          {/* Filter 2: Clinical Goal */}
          <div className="relative group">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full hover:bg-stone-100/80 text-left transition-colors flex flex-col cursor-pointer"
            >
              <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                <Activity className="h-2.5 w-2.5 text-stone-500" />
                Clinical Goal
              </span>
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                {selectedGoal} <ChevronDown className="h-3 w-3 text-stone-400" />
              </span>
            </button>
            <div className="absolute top-full left-0 mt-2 hidden group-hover:flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200/90 py-1.5 min-w-[150px] z-50 animate-scale-up">
              {['Recovery', 'Pain relief', 'Mobility', 'Flexibility'].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGoal(g)}
                  className={`px-3.5 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between ${
                    selectedGoal === g
                      ? 'bg-stone-900 text-white'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span>{g}</span>
                  {selectedGoal === g && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-stone-200/80" />

          {/* Filter 3: Current Pain Level */}
          <div className="relative group">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full hover:bg-stone-100/80 text-left transition-colors flex flex-col cursor-pointer"
            >
              <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 text-stone-500" />
                Current Level
              </span>
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                {selectedPain} <ChevronDown className="h-3 w-3 text-stone-400" />
              </span>
            </button>
            <div className="absolute top-full left-0 mt-2 hidden group-hover:flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200/90 py-1.5 min-w-[140px] z-50 animate-scale-up">
              {['Pain: 1/10 (Low)', 'Pain: 3/10 (Med)', 'Pain: 6/10 (High)'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPain(p)}
                  className={`px-3.5 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between ${
                    selectedPain === p
                      ? 'bg-stone-900 text-white'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span>{p}</span>
                  {selectedPain === p && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Launch Workout ↗ CTA Button */}
          <button
            type="button"
            onClick={() => {
              if (onDirectStartWorkout) {
                onDirectStartWorkout(currentProtocol.exerciseId);
              } else {
                onStartIntake();
              }
            }}
            className="px-5 py-2 rounded-full bg-white hover:bg-stone-900 hover:text-white text-stone-900 text-xs font-bold tracking-wide shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 group border border-stone-200/80"
          >
            <span>Start Session</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Right Header Navigation Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('signup')}
            className="hidden sm:flex text-xs font-bold tracking-wider uppercase text-white/90 hover:text-white transition-colors cursor-pointer px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20"
          >
            Patient Portal
          </button>
          <button
            onClick={onStartIntake}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold tracking-wide shadow-xl transition-all cursor-pointer active:scale-95 flex items-center gap-2 group"
          >
            <span>Start Assessment</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* ================= LEFT VERTICAL FLOATING DOCK ================= */}
      <aside className="fixed left-5 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center gap-3 p-2.5 rounded-full bg-white/85 backdrop-blur-2xl border border-white/80 shadow-[0_15px_45px_rgba(0,0,0,0.22)] animate-fade-in">
        {/* Home Pill */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-stone-900 text-white shadow-md'
              : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/80'
          }`}
          title="Home"
        >
          <Home className="h-4.5 w-4.5" />
        </button>

        {/* Target Joint Quick Toggle */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('search');
            setSelectedJoint(selectedJoint === 'Knee' ? 'Shoulder' : 'Knee');
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'bg-stone-900 text-white shadow-md'
              : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/80'
          }`}
          title="Target Joint Switcher"
        >
          <Search className="h-4.5 w-4.5" />
        </button>

        {/* Prescription Grid */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('grid');
            onStartIntake();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'grid'
              ? 'bg-stone-900 text-white shadow-md'
              : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/80'
          }`}
          title="Prescribed Exercises"
        >
          <LayoutGrid className="h-4.5 w-4.5" />
        </button>

        {/* Clinical Intake Notes */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('protocol');
            onStartIntake();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'protocol'
              ? 'bg-stone-900 text-white shadow-md'
              : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/80'
          }`}
          title="Intake Assessment Form"
        >
          <ClipboardList className="h-4.5 w-4.5" />
        </button>

        {/* Patient Profile Avatar */}
        <button
          type="button"
          onClick={() => onOpenAuth('login')}
          className="w-10 h-10 rounded-full ring-2 ring-emerald-400 p-0.5 overflow-hidden transition-all hover:scale-105 cursor-pointer relative"
          title={`Patient: ${userName}`}
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
            alt="Patient Profile"
            className="w-full h-full object-cover rounded-full"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        {/* Notifications Bell */}
        <button
          type="button"
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-100/80 transition-all cursor-pointer relative"
          title="Clinical Safety Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500" />
        </button>

        <div className="w-5 h-px bg-stone-200 my-1" />

        {/* Settings */}
        <button
          type="button"
          onClick={() => onOpenAuth('signup')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-950 hover:bg-stone-100/80 transition-all cursor-pointer"
          title="Settings"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>

        {/* Theme Pill */}
        <button
          type="button"
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-950 hover:bg-stone-100/80 transition-all cursor-pointer"
          title="Toggle Theme"
        >
          <Sun className="h-4.5 w-4.5" />
        </button>
      </aside>

      {/* ================= MAIN WHOLE-SCREEN HERO CONTENT ================= */}
      <main className="relative z-20 flex-1 px-6 sm:px-12 md:pl-28 lg:pl-32 flex flex-col justify-center max-w-4xl py-12 sm:py-20 text-left">
        {/* Shimmering Clinical Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold w-fit mb-4 animate-fade-in shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-Time Biomechanics & Computer Vision Therapy</span>
        </div>

        {/* Integrated Huge Editorial Typography */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white font-heading tracking-tight leading-[0.92] drop-shadow-[0_12px_35px_rgba(0,0,0,0.5)] animate-slide-up">
          New Era Of
          <br />
          <span className="text-white/85">Recovery</span>
        </h1>

        <p className="mt-5 sm:mt-7 text-sm sm:text-base text-stone-100 font-medium max-w-lg leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] animate-slide-up">
          Experience precision bio-mechanics calibrated for human joints. Whether recovering from surgery, healing an injury, or restoring pain-free mobility, our browser vision engine tracks every degree of joint flexion with clinical accuracy.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3.5 animate-slide-up">
          <button
            onClick={onStartIntake}
            className="py-3.5 px-7 rounded-2xl bg-white hover:bg-stone-100 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xl transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Start Free Intake Assessment</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (onDirectStartWorkout) {
                onDirectStartWorkout(currentProtocol.exerciseId);
              } else {
                onStartIntake();
              }
            }}
            className="py-3.5 px-6 rounded-2xl bg-stone-900/80 hover:bg-stone-900 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all cursor-pointer active:scale-95 shadow-xl"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Try Live Joint Tracker</span>
          </button>
        </div>
      </main>

      {/* ================= BOTTOM REGION: WIDGETS & PROTOCOL CARDS ================= */}
      <section className="relative z-20 w-full px-4 sm:px-8 md:pl-28 lg:pl-32 pb-6 flex flex-col lg:flex-row items-end justify-between gap-5">
        {/* BOTTOM-LEFT WHITE CUTOUT WIDGET ("Find The Right Alignment") */}
        <div
          style={{
            transform: `translate(${mousePos.x * 4}px, ${mousePos.y * 4}px)`,
            transition: 'transform 0.2s ease-out',
          }}
          className="w-full sm:w-84 bg-white/95 backdrop-blur-2xl rounded-[32px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/80 space-y-3.5 text-left transition-all hover:-translate-y-1"
        >
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              <span>Evidence-Based</span>
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-heading mt-1.5">
              Find The Right Alignment
            </h3>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              Our computer vision engine connects you with orthopedic-grade form tracking. Zero sensors. Zero false reps.
            </p>
          </div>

          {/* Big Stat Row with Avatars and Arrow Button */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            <div className="space-y-0.5">
              <div className="text-2xl font-black font-mono tracking-tight text-stone-900 flex items-center gap-1.5">
                <span>10K+</span>
              </div>
              <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                Corrected Reps
              </div>
            </div>

            {/* Overlapping Patient Avatars */}
            <div className="flex -space-x-2">
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Patient"
              />
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                alt="Patient"
              />
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                alt="Patient"
              />
            </div>

            {/* Circular Arrow Button */}
            <button
              type="button"
              onClick={onStartIntake}
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 flex items-center justify-center transition-all cursor-pointer group shadow-2xs"
            >
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* BOTTOM-RIGHT FROSTED GLASS PROTOCOL CARD */}
        <div
          style={{
            transform: `translate(${mousePos.x * -4}px, ${mousePos.y * -4}px)`,
            transition: 'transform 0.2s ease-out',
          }}
          className="w-full sm:w-96 bg-white/80 backdrop-blur-3xl rounded-[32px] p-5 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-white/90 space-y-3.5 text-left transition-all hover:-translate-y-1"
        >
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-bold text-stone-900 font-heading">
                {currentProtocol.title}
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>{currentProtocol.tag}</span>
              </div>
            </div>

            {/* Circular Arrow Button (Starts Workout) */}
            <button
              type="button"
              onClick={() => {
                if (onDirectStartWorkout) {
                  onDirectStartWorkout(currentProtocol.exerciseId);
                } else {
                  onStartIntake();
                }
              }}
              className="w-9 h-9 rounded-full bg-white hover:bg-stone-900 hover:text-white text-stone-800 flex items-center justify-center shadow-sm transition-all cursor-pointer group border border-stone-200/80"
              title="Launch this protocol"
            >
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Description */}
          <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-2">
            {currentProtocol.desc}
          </p>

          {/* Telemetry / Joint Specs Row */}
          <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-mono font-bold text-stone-800">
            <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded-lg border border-emerald-200">
              {currentProtocol.spec1}
            </span>
            <span className="flex items-center gap-1 text-sky-800 bg-sky-50/90 px-2 py-0.5 rounded-lg border border-sky-200">
              {currentProtocol.spec2}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
            <span>🔁 {currentProtocol.reps}</span>
            <span>⏱ {currentProtocol.sets}</span>
          </div>

          {/* Bottom Brand Badge & Social Row */}
          <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
            <div className="w-9 h-9 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-xs font-heading font-black text-base tracking-tighter">
              K
            </div>

            <div className="flex items-center gap-3 text-stone-500 text-xs font-semibold">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex items-center gap-1 transition-colors cursor-pointer ${
                  isLiked ? 'text-rose-600' : 'hover:text-stone-900'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-600' : ''}`} />
                <span className="text-[11px] font-mono">{likeCount.toLocaleString()}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`transition-colors cursor-pointer ${
                  isBookmarked ? 'text-stone-900' : 'hover:text-stone-900'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-stone-900' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onStartIntake}
                className="hover:text-stone-900 transition-colors cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= EDITORIAL BOTTOM FOOTER ================= */}
      <footer className="relative z-30 w-full px-4 sm:px-8 md:pl-28 lg:pl-32 py-3 flex items-center justify-between text-white/90 text-xs font-semibold">
        <button
          type="button"
          onClick={handleToggleLike}
          className="flex items-center gap-1.5 tracking-wider hover:text-white transition-colors cursor-pointer drop-shadow-md"
        >
          <span>Like & Follow</span>
          <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Swipe » Oval Pill Button */}
        <button
          type="button"
          onClick={onStartIntake}
          className="px-6 py-2 rounded-full border border-white/60 bg-white/20 hover:bg-white hover:text-stone-900 backdrop-blur-md text-white text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-xl cursor-pointer active:scale-95 flex items-center gap-2 group"
        >
          <span>Start Assessment</span>
          <span className="group-hover:translate-x-1 transition-transform">»</span>
        </button>
      </footer>
    </div>
  );
};
