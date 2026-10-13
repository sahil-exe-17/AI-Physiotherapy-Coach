import React, { useState } from 'react';
import {
  Home,
  Search,
  LayoutGrid,
  ClipboardList,
  Bell,
  Settings,
  Moon,
  Sun,
  ChevronDown,
  ArrowUpRight,
  Heart,
  Bookmark,
  Share2,
  Activity,
  CheckCircle2,
  Sparkles,
  Target,
  Zap,
  Play,
  RotateCcw,
} from 'lucide-react';

interface LandingPageProps {
  onStartIntake: () => void;
  onOpenAuth: (mode?: 'signup' | 'login') => void;
  onDirectStartWorkout?: (exerciseId: string) => void;
  userName?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartIntake,
  onOpenAuth,
  onDirectStartWorkout,
  userName = 'Alex Johnson',
}) => {
  // Interactive state
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'grid' | 'protocol'>('home');
  const [selectedJoint, setSelectedJoint] = useState<string>('Knee');
  const [selectedGoal, setSelectedGoal] = useState<string>('Recovery');
  const [selectedPain, setSelectedPain] = useState<string>('Pain: 3/10');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(4428);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Subtle 3D tilt tracking on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
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
    <div className="relative min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-stone-100 overflow-hidden font-sans select-none">
      {/* ================= ATMOSPHERIC MISTY MOUNTAINS BACKDROP ================= */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-65 pointer-events-none scale-105 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: "url('/misty_mountains.jpg')",
          filter: 'sepia(0.12) contrast(1.05) brightness(0.96)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-200/40 via-stone-100/30 to-stone-200/60 pointer-events-none backdrop-blur-[1px]" />

      {/* ================= EDITORIAL TOP LABELS ================= */}
      <header className="relative z-20 w-full flex items-center justify-between text-stone-700 text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase">
        <div className="flex items-center gap-2 cursor-pointer group">
          <span className="font-bold tracking-[0.3em] group-hover:text-stone-950 transition-colors">
            KINETIQ AI COACH
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="flex items-center gap-6">
          <span className="tracking-[0.25em] text-stone-600 hidden sm:inline">
            CLINICAL BIOMECHANICS
          </span>
          <button
            onClick={() => onOpenAuth('signup')}
            className="tracking-[0.2em] text-stone-900 font-bold hover:opacity-80 transition-opacity cursor-pointer border-b border-stone-800 pb-0.5"
          >
            PATIENT PORTAL
          </button>
        </div>
      </header>

      {/* ================= CENTRAL FLOATING SHOWCASE CANVAS ================= */}
      <main className="relative z-20 my-auto py-4 flex items-center justify-center w-full">
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${mousePos.y * -4}deg) rotateY(${mousePos.x * 4}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
          className="relative w-full max-w-6xl aspect-[16/10] min-h-[580px] sm:min-h-[640px] rounded-[36px] sm:rounded-[48px] bg-white shadow-[0_30px_90px_rgba(28,25,23,0.22)] border-[5px] sm:border-[7px] border-white overflow-hidden flex flex-col justify-between transition-all duration-300"
        >
          {/* Central Architecture Hero Background */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-100 transition-transform duration-700 ease-out"
            style={{
              backgroundImage: "url('/hero_pavilion.jpg')",
            }}
          >
            {/* Subtle cinematic gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-900/35" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/40 via-transparent to-transparent" />
          </div>

          {/* ================= TOP FLOATING SEARCH / FILTER BAR ================= */}
          <div className="relative z-30 pt-4 sm:pt-6 px-4 sm:px-8 w-full flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-full py-1.5 px-2 sm:px-3 shadow-[0_10px_35px_rgba(0,0,0,0.12)] flex items-center gap-1 sm:gap-3 max-w-3xl w-full justify-between transition-all hover:shadow-[0_14px_45px_rgba(0,0,0,0.16)]">
              {/* Left Buy/Protocol Button */}
              <button
                type="button"
                onClick={onStartIntake}
                className="px-4 sm:px-6 py-2 rounded-full bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold tracking-wide shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Protocol</span>
              </button>

              {/* Filter 1: Target Joint */}
              <div className="relative group hidden sm:block">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full hover:bg-stone-100/70 text-left transition-colors flex flex-col cursor-pointer"
                >
                  <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <Target className="h-2.5 w-2.5 text-stone-500" />
                    Target Joint
                  </span>
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                    {selectedJoint} <ChevronDown className="h-3 w-3 text-stone-400" />
                  </span>
                </button>
                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 mt-1.5 hidden group-hover:flex flex-col bg-white rounded-2xl shadow-xl border border-stone-200/90 py-1.5 min-w-[120px] z-50 animate-scale-up">
                  {['Knee', 'Shoulder', 'Hip', 'Back', 'Arms'].map((j) => (
                    <button
                      key={j}
                      onClick={() => setSelectedJoint(j)}
                      className="px-3 py-1.5 text-left text-xs font-semibold hover:bg-stone-100 text-stone-700 hover:text-stone-950 transition-colors"
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter 2: Clinical Goal */}
              <div className="relative group hidden sm:block">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full hover:bg-stone-100/70 text-left transition-colors flex flex-col cursor-pointer"
                >
                  <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <Activity className="h-2.5 w-2.5 text-stone-500" />
                    Clinical Goal
                  </span>
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                    {selectedGoal} <ChevronDown className="h-3 w-3 text-stone-400" />
                  </span>
                </button>
                <div className="absolute top-full left-0 mt-1.5 hidden group-hover:flex flex-col bg-white rounded-2xl shadow-xl border border-stone-200/90 py-1.5 min-w-[140px] z-50 animate-scale-up">
                  {['Recovery', 'Pain relief', 'Mobility', 'Flexibility'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGoal(g)}
                      className="px-3 py-1.5 text-left text-xs font-semibold hover:bg-stone-100 text-stone-700 hover:text-stone-950 transition-colors"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter 3: Pain / Pace */}
              <div className="relative group hidden sm:block">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full hover:bg-stone-100/70 text-left transition-colors flex flex-col cursor-pointer"
                >
                  <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 text-stone-500" />
                    Current Level
                  </span>
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                    {selectedPain} <ChevronDown className="h-3 w-3 text-stone-400" />
                  </span>
                </button>
                <div className="absolute top-full left-0 mt-1.5 hidden group-hover:flex flex-col bg-white rounded-2xl shadow-xl border border-stone-200/90 py-1.5 min-w-[130px] z-50 animate-scale-up">
                  {['Pain: 1/10 (Low)', 'Pain: 3/10 (Med)', 'Pain: 6/10 (High)'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPain(p)}
                      className="px-3 py-1.5 text-left text-xs font-semibold hover:bg-stone-100 text-stone-700 hover:text-stone-950 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Start Session ↗ CTA Button */}
              <button
                type="button"
                onClick={() => {
                  if (onDirectStartWorkout) {
                    onDirectStartWorkout(selectedJoint.toLowerCase() === 'knee' ? 'squat' : 'arm_curl');
                  } else {
                    onStartIntake();
                  }
                }}
                className="px-4 sm:px-6 py-2 rounded-full bg-white hover:bg-stone-900 hover:text-white text-stone-900 text-xs font-bold tracking-wide shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 group"
              >
                <span>Start Session</span>
                <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* ================= MIDDLE HERO CONTENT & INTEGRATED TYPOGRAPHY ================= */}
          <div className="relative z-20 flex-1 pl-20 sm:pl-28 pr-6 sm:pr-12 flex flex-col justify-center my-2 sm:my-0">
            {/* Integrated Huge Editorial Typography in Scene */}
            <div className="max-w-2xl text-left pointer-events-none select-none">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white/95 font-heading tracking-tight leading-[0.92] drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)] animate-slide-up">
                New Era Of
                <br />
                <span className="text-white/80">Recovery</span>
              </h1>
              <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-stone-200/90 font-medium max-w-sm sm:max-w-md leading-relaxed drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-slide-up">
                Experience precision bio-mechanics calibrated for human joints. Whether recovering from surgery or restoring pain-free mobility, our browser computer vision delivers clinical accuracy.
              </p>
            </div>
          </div>

          {/* ================= LEFT VERTICAL FLOATING DOCK ================= */}
          <aside className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2.5 p-2 rounded-full bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_10px_35px_rgba(0,0,0,0.15)] animate-fade-in">
            {/* Home Pill */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title="Home"
            >
              <Home className="h-4 w-4" />
            </button>

            {/* Target Joint */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('search');
                setSelectedJoint(selectedJoint === 'Knee' ? 'Shoulder' : 'Knee');
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title="Target Joint"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Exercise Registry Grid */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('grid');
                onStartIntake();
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title="Prescription Grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>

            {/* Clinical Intake Notes */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('protocol');
                onStartIntake();
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'protocol'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title="Intake Assessment"
            >
              <ClipboardList className="h-4 w-4" />
            </button>

            {/* User Avatar Circle */}
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="w-9 h-9 rounded-full ring-2 ring-emerald-500/80 p-0.5 overflow-hidden transition-all hover:scale-105 cursor-pointer relative"
              title={`Logged in as ${userName}`}
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Patient Profile"
                className="w-full h-full object-cover rounded-full"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer relative"
              title="Safety Alerts"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>

            {/* Divider */}
            <div className="w-5 h-px bg-stone-200 my-0.5" />

            {/* Settings Cog */}
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer"
              title="Patient Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Theme Toggle Pill */}
            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer"
              title="Toggle Theme"
            >
              <Sun className="h-4 w-4" />
            </button>
          </aside>

          {/* ================= BOTTOM REGION: WIDGETS & PROPERTY CARD ================= */}
          <div className="relative z-30 p-4 sm:p-6 flex flex-col sm:flex-row items-end justify-between gap-4 w-full">
            {/* BOTTOM-LEFT WHITE CUTOUT WIDGET ("Find The Perfect Place") */}
            <div className="w-full sm:w-80 bg-white/95 backdrop-blur-xl rounded-[28px] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/80 space-y-3.5 text-left transform transition-all hover:-translate-y-1">
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-heading">
                  Find The Right Alignment
                </h3>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  Our computer vision engine connects you with orthopedic grade tracking. Zero sensors. Zero false reps.
                </p>
              </div>

              {/* Big Stat Row with Avatars and Arrow Button */}
              <div className="pt-1 flex items-center justify-between border-t border-stone-100">
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
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 flex items-center justify-center transition-all cursor-pointer group shadow-2xs"
                >
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* BOTTOM-RIGHT FROSTED GLASS PROPERTY CARD ("Lunar Oasis Villa") */}
            <div className="w-full sm:w-96 bg-white/75 backdrop-blur-2xl rounded-[32px] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-white/80 space-y-3.5 text-left transform transition-all hover:-translate-y-1">
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-stone-900 font-heading">
                    {selectedJoint} Rehabilitation Protocol
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Real-Time MediaPipe • 30 FPS</span>
                  </div>
                </div>

                {/* Circular Top Right Arrow Button */}
                <button
                  type="button"
                  onClick={onStartIntake}
                  className="w-8 h-8 rounded-full bg-white hover:bg-stone-900 hover:text-white text-stone-800 flex items-center justify-center shadow-xs transition-all cursor-pointer group"
                >
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

              {/* Card Description */}
              <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-2">
                This adaptive routine blends controlled joint range of motion with eccentric loading to rebuild resilience without compressive stress.
              </p>

              {/* Telemetry / Joint Specs Row */}
              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-mono font-bold text-stone-800">
                <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  📐 104° Knee Flexion
                </span>
                <span className="flex items-center gap-1 text-sky-800 bg-sky-50/80 px-2 py-0.5 rounded-md border border-sky-200/60">
                  🎯 168° Hip Angle
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>🔁 10 Target Reps</span>
                <span>⏱ 2 Sets (Low Pace)</span>
              </div>

              {/* Bottom Brand Badge & Social Row */}
              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                {/* Purple/Dark Brand Icon Pill ("U" / "K") */}
                <div className="w-9 h-9 rounded-2xl bg-indigo-950 text-white flex items-center justify-center shadow-xs font-heading font-black text-base tracking-tighter">
                  K
                </div>

                {/* Likes, Bookmark, Share */}
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
          </div>
        </div>
      </main>

      {/* ================= EDITORIAL BOTTOM FOOTER ================= */}
      <footer className="relative z-20 w-full flex items-center justify-between text-stone-700 text-xs font-semibold">
        <button
          type="button"
          onClick={handleToggleLike}
          className="flex items-center gap-1.5 tracking-wider hover:text-stone-950 transition-colors cursor-pointer"
        >
          <span>Like & Follow</span>
          <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
        </button>

        {/* Swipe » Oval Pill Button */}
        <button
          type="button"
          onClick={onStartIntake}
          className="px-6 py-2 rounded-full border border-stone-800/80 bg-white/70 hover:bg-stone-900 hover:text-white backdrop-blur-md text-stone-900 text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-xs cursor-pointer active:scale-95 flex items-center gap-2 group"
        >
          <span>Start Assessment</span>
          <span className="group-hover:translate-x-1 transition-transform">»</span>
        </button>
      </footer>
    </div>
  );
};
