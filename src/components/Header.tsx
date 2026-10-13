import React from 'react';
import { Activity, Terminal, Volume2, VolumeX, RefreshCw, ChevronDown, Zap, ClipboardList } from 'lucide-react';
import { ExerciseRegistry } from '../exercises/exerciseRegistry';
import { IntensityLevel } from '../types/exercise';

interface HeaderProps {
  activeExerciseId: string;
  onSelectExercise: (id: string) => void;
  intensityLevel: IntensityLevel;
  onSelectIntensity: (level: IntensityLevel) => void;
  sessionNumber: string;
  isCameraActive: boolean;
  isDevMode: boolean;
  onToggleDevMode: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onRestart: () => void;
  onOpenPlan?: () => void;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeExerciseId,
  onSelectExercise,
  intensityLevel,
  onSelectIntensity,
  sessionNumber,
  isCameraActive,
  isDevMode,
  onToggleDevMode,
  voiceEnabled,
  onToggleVoice,
  onRestart,
  onOpenPlan,
  userName,
}) => {
  const exercises = ExerciseRegistry.getAllDefinitions();

  return (
    <header className="w-full bg-white/85 backdrop-blur-md border-b border-stone-200/80 px-4 lg:px-8 py-3 flex items-center justify-between z-30 sticky top-0 transition-colors">
      {/* Brand & Patient */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-stone-900 flex items-center justify-center shadow-xs">
          <Activity className="h-4.5 w-4.5 text-stone-100" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-stone-900 font-heading">KinetiQ</h1>
            {userName ? (
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Patient: {userName}
              </span>
            ) : (
              <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200/80">
                Physio Motion
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-400">Minimal Bio-Kinematics Engine</p>
        </div>
      </div>

      {/* Exercise Selector & Intensity Selector */}
      <div className="flex items-center gap-3 text-sm">
        {/* Exercise Switcher Dropdown */}
        <div className="relative">
          <select
            value={activeExerciseId}
            onChange={(e) => onSelectExercise(e.target.value)}
            className="bg-stone-50 text-stone-800 font-medium text-xs sm:text-sm rounded-xl px-3.5 py-2 border border-stone-200/90 focus:outline-none focus:border-stone-400 cursor-pointer appearance-none pr-8 shadow-2xs hover:bg-stone-100 transition-colors"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-white text-stone-800">
                {ex.name}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Intensity Level Switcher Pills */}
        <div className="flex items-center bg-stone-100/80 p-1 rounded-xl border border-stone-200/70 text-xs">
          <div className="px-2 text-stone-500 flex items-center gap-1 font-medium">
            <Zap className="h-3 w-3 text-amber-500" />
            <span className="hidden sm:inline">Pace:</span>
          </div>
          <button
            onClick={() => onSelectIntensity('LOW')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              intensityLevel === 'LOW'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Low: Gentle range of motion"
          >
            Gentle
          </button>
          <button
            onClick={() => onSelectIntensity('MEDIUM')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              intensityLevel === 'MEDIUM'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Medium: Standard motion"
          >
            Standard
          </button>
          <button
            onClick={() => onSelectIntensity('HIGH')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              intensityLevel === 'HIGH'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="High: Full deep range"
          >
            Deep
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-stone-100/70 px-3 py-1.5 rounded-xl border border-stone-200/60">
          <span className="text-[11px] text-stone-400 uppercase font-medium">Session</span>
          <span className="font-mono text-stone-700 font-semibold text-xs">{sessionNumber}</span>
        </div>
      </div>

      {/* Controls / Toggles */}
      <div className="flex items-center gap-2">
        {onOpenPlan && (
          <button
            onClick={onOpenPlan}
            className="px-3 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-98"
            title="View or edit AI prescribed exercise plan"
          >
            <ClipboardList className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">My Plan</span>
          </button>
        )}
        <button
          onClick={onToggleVoice}
          className={`p-2 rounded-xl transition-all border cursor-pointer ${
            voiceEnabled
              ? 'bg-white text-stone-700 border-stone-200/90 shadow-2xs hover:bg-stone-50'
              : 'bg-stone-100 text-stone-400 border-stone-200/60 hover:bg-stone-200/60'
          }`}
          title={voiceEnabled ? 'Mute Voice Guidance' : 'Enable Voice Guidance'}
        >
          {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        <button
          onClick={onToggleDevMode}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all border cursor-pointer ${
            isDevMode
              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200/90 hover:bg-stone-50 shadow-2xs'
          }`}
          title="Toggle Developer Telemetry"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dev Mode</span>
        </button>

        <button
          onClick={onRestart}
          className="p-2 rounded-xl bg-white text-stone-600 border border-stone-200/90 hover:text-stone-900 hover:bg-stone-50 shadow-2xs transition-all cursor-pointer"
          title="Reset / Recalibrate Session"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
