import React from 'react';
import { CalibrationStatus } from '../types/session';
import { CheckCircle2, AlertTriangle, UserCheck, Play, Sparkles, FastForward } from 'lucide-react';

interface CalibrationScreenProps {
  calibration: CalibrationStatus;
  onStartExercise: () => void;
  userName?: string;
}

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({
  calibration,
  onStartExercise,
  userName,
}) => {
  const { cameraActive, personDetected, warnings } = calibration;

  return (
    <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-md z-20 flex flex-col items-center justify-between p-6 sm:p-8 text-center animate-fade-in">
      {/* Top Header Prompt */}
      <div className="max-w-md space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-stone-200/90 text-stone-700 text-xs font-medium uppercase tracking-wide shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-stone-500" />
          <span>Quick Alignment</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading drop-shadow-sm">
          {userName ? `Ready, ${userName}? Step into View` : 'Step into Camera View'}
        </h2>
        <p className="text-xs sm:text-sm text-stone-200">
          Make sure your upper body or full silhouette is framed clearly.
        </p>
      </div>

      {/* Human Silhouette Target Frame */}
      <div className="relative my-3 w-48 sm:w-56 h-56 sm:h-64 border-2 border-dashed border-white/50 rounded-3xl flex items-center justify-center bg-white/10 shadow-lg overflow-hidden">
        <svg
          className={`w-36 sm:w-44 h-48 sm:h-56 transition-all duration-300 ${
            personDetected ? 'text-emerald-400 drop-shadow-md' : 'text-stone-300/80'
          }`}
          viewBox="0 0 100 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          {/* Head */}
          <circle cx="50" cy="30" r="18" />
          {/* Torso */}
          <path d="M 30 65 Q 50 60 70 65 L 62 120 L 38 120 Z" />
          {/* Arms with Elbows */}
          <path d="M 30 65 L 18 100 L 25 125 M 70 65 L 82 100 L 75 125" strokeLinecap="round" />
          {/* Legs */}
          <path d="M 42 120 L 38 185 M 58 120 L 62 185" strokeLinecap="round" />
        </svg>

        {personDetected && (
          <div className="absolute inset-0 bg-emerald-500/20 border-2 border-emerald-400 rounded-3xl flex items-center justify-center animate-pulse">
            <UserCheck className="h-12 w-12 text-white" />
          </div>
        )}
      </div>

      {/* Live Calibration Checklist Card */}
      <div className="w-full max-w-md bg-white/95 border border-stone-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg text-stone-800">
        <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-left">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${cameraActive ? 'text-emerald-600' : 'text-stone-300'}`}
            />
            <span className={cameraActive ? 'text-stone-800 font-medium' : 'text-stone-400'}>
              Camera Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${personDetected ? 'text-emerald-600' : 'text-stone-300'}`}
            />
            <span className={personDetected ? 'text-stone-800 font-medium' : 'text-stone-400'}>
              Motion Detected
            </span>
          </div>
        </div>

        {/* Warnings if any */}
        {warnings.length > 0 && (
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>{warnings[0]}</span>
          </div>
        )}

        {/* Action Buttons: Instant Start / Skip */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={onStartExercise}
            className="flex-1 py-3 px-5 rounded-xl font-semibold text-sm bg-stone-900 hover:bg-stone-800 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Start Workout</span>
          </button>

          <button
            onClick={onStartExercise}
            className="py-3 px-4 rounded-xl text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Skip calibration check"
          >
            <FastForward className="h-3.5 w-3.5 text-stone-500" />
            <span>Skip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
