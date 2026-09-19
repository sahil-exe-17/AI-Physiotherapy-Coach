import React from 'react';
import { MovementState } from '../types/exercise';
import { PoseStatus } from '../types/pose';
import { Timer, CheckCircle2, XCircle, Target, Flame, RefreshCw, Clock } from 'lucide-react';

interface SessionHUDProps {
  exerciseName: string;
  targetReps: number;
  completedReps: number;
  correctReps: number;
  incorrectReps: number;
  incompleteReps: number;
  accuracy: number;
  movementState: MovementState;
  repProgress: number;
  durationSeconds: number;
  poseStatus: PoseStatus;
  isHoldingLastRep?: boolean;
  holdCountdownSeconds?: number;
  onCalibrateStanding?: () => void;
}

export const SessionHUD: React.FC<SessionHUDProps> = ({
  exerciseName,
  targetReps,
  completedReps,
  correctReps,
  incorrectReps,
  incompleteReps,
  accuracy,
  movementState,
  repProgress,
  durationSeconds,
  poseStatus,
  isHoldingLastRep,
  holdCountdownSeconds = 5,
  onCalibrateStanding,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getMovementBadgeStyle = (state: MovementState) => {
    switch (state) {
      case 'DESCENDING':
        return 'bg-amber-50 text-amber-900 border-amber-200 animate-pulse';
      case 'BOTTOM':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 scale-105 shadow-xs font-bold';
      case 'ASCENDING':
        return 'bg-stone-100 text-stone-800 border-stone-300 font-medium';
      case 'REP_COMPLETE':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 scale-105 shadow-xs font-bold';
      case 'READY':
      default:
        return 'bg-white/90 text-stone-700 border-stone-200/90 font-medium';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-20">
      {/* Top Telemetry Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Correct Rep Counter Card */}
        <div className="bg-white/92 backdrop-blur-md rounded-2xl p-4.5 pointer-events-auto border border-stone-200/90 shadow-sm space-y-2.5 max-w-[210px] sm:max-w-[250px]">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold uppercase tracking-wider">
            <span>Completed</span>
            <Target className="h-4 w-4 text-stone-600" />
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl sm:text-5xl font-extrabold font-heading tracking-tight transition-all duration-200 ${
                movementState === 'REP_COMPLETE'
                  ? 'text-emerald-700 scale-105'
                  : 'text-stone-900'
              }`}
            >
              {correctReps.toString().padStart(2, '0')}
            </span>
            <span className="text-sm font-semibold text-stone-400">/ {targetReps} reps</span>
          </div>

          {/* Breakdown Pills: Correct vs Incorrect */}
          <div className="pt-2 flex items-center gap-2 text-xs border-t border-stone-200/80">
            <span className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60" title="Valid Reps">
              <CheckCircle2 className="h-3.5 w-3.5" /> {correctReps} valid
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-medium bg-rose-50/80 px-2 py-0.5 rounded-md border border-rose-200/60" title="Form Error">
              <XCircle className="h-3.5 w-3.5" /> {incorrectReps} retry
            </span>
          </div>

          {/* Progress bar towards target correct reps */}
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/60">
            <div
              className="bg-stone-800 h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, (correctReps / targetReps) * 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Movement State, Accuracy & Calibration Buttons */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div
            className={`px-3.5 py-1.5 rounded-full border text-xs font-mono font-medium tracking-wide uppercase transition-all shadow-2xs backdrop-blur-md ${getMovementBadgeStyle(
              movementState
            )}`}
          >
            {movementState === 'REP_COMPLETE' ? '✓ Rep Completed' : movementState}
          </div>

          <div className="bg-white/92 backdrop-blur-md px-3.5 py-2 rounded-xl border border-stone-200/90 shadow-2xs flex items-center gap-2.5 text-xs text-stone-700">
            <Flame className="h-4 w-4 text-amber-600" />
            <div>
              <div className="text-[10px] text-stone-400 font-medium uppercase">Accuracy</div>
              <div className="font-mono font-bold text-stone-900 text-sm">{accuracy}%</div>
            </div>
          </div>

          {onCalibrateStanding && (
            <button
              onClick={onCalibrateStanding}
              className="px-3 py-1.5 rounded-xl bg-white/92 text-stone-700 border border-stone-200/90 hover:bg-stone-50 text-xs font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
              title="Reset standing baseline position"
            >
              <RefreshCw className="h-3 w-3 text-stone-500" />
              <span>Calibrate Height</span>
            </button>
          )}

          <div className="bg-white/92 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-stone-200/90 shadow-2xs flex items-center gap-2 text-xs font-mono text-stone-600">
            <Timer className="h-3.5 w-3.5 text-stone-500" />
            <span>{formatTime(durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Prominent 5-Second Isometric Hold Timer Overlay Card for Last Rep */}
      {isHoldingLastRep && (
        <div className="w-full max-w-sm mx-auto pointer-events-auto bg-white/95 border-2 border-emerald-600 rounded-3xl p-5 shadow-xl backdrop-blur-xl text-center space-y-2 animate-bounce">
          <div className="inline-flex items-center gap-1.5 text-emerald-800 font-mono text-xs font-semibold uppercase tracking-wide">
            <Clock className="h-4 w-4 animate-spin text-emerald-700" />
            <span>Final Rep Hold</span>
          </div>
          <div className="text-5xl font-extrabold text-stone-900 font-mono tracking-tight">
            {holdCountdownSeconds}s
          </div>
          <p className="text-xs text-stone-600 font-medium">
            Hold depth position. Push up when countdown finishes.
          </p>
        </div>
      )}

      {/* Bottom Row: Depth Progress Bar */}
      <div className="w-full max-w-xs mx-auto pointer-events-auto bg-white/92 backdrop-blur-md rounded-xl p-3 border border-stone-200/80 shadow-xs space-y-1.5">
        <div className="flex justify-between text-xs font-mono text-stone-700">
          <span className="font-medium">Rep Depth</span>
          <span className={`font-semibold ${repProgress >= 100 ? 'text-emerald-700' : 'text-stone-800'}`}>
            {repProgress}%
          </span>
        </div>
        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/60">
          <div
            className={`h-full transition-all duration-150 rounded-full ${
              repProgress >= 100
                ? 'bg-emerald-600'
                : repProgress >= 50
                ? 'bg-stone-700'
                : 'bg-stone-400'
            }`}
            style={{ width: `${Math.min(100, repProgress)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
