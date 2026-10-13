import React from 'react';
import { MovementState } from '../types/exercise';
import { PoseStatus } from '../types/pose';
import { CalculatedAngles } from '../cv/angleCalculator';
import { Clock } from 'lucide-react';

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
  angles?: CalculatedAngles | null;
  isHoldingLastRep?: boolean;
  holdCountdownSeconds?: number;
  onCalibrateStanding?: () => void;
}

export const SessionHUD: React.FC<SessionHUDProps> = ({
  targetReps,
  correctReps,
  movementState,
  repProgress,
  durationSeconds,
  angles,
  isHoldingLastRep,
  holdCountdownSeconds = 5,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getMovementLabel = (state: MovementState) => {
    switch (state) {
      case 'DESCENDING':
        return 'Descending';
      case 'BOTTOM':
        return 'At Depth';
      case 'ASCENDING':
        return 'Rising';
      case 'REP_COMPLETE':
        return 'Rep Complete';
      case 'READY':
        return 'Ready';
      default:
        return 'Get Ready';
    }
  };

  // Determine active joint angle to display
  const primaryAngle = angles
    ? angles.kneeAngle && angles.kneeAngle.confidence >= 0.35
      ? { label: 'Knee', val: Math.round(angles.kneeAngle.angleDegrees) }
      : angles.elbowAngle && angles.elbowAngle.confidence >= 0.35
      ? { label: 'Elbow', val: Math.round(angles.elbowAngle.angleDegrees) }
      : null
    : null;

  return (
    <div className="absolute inset-0 pointer-events-none p-3.5 sm:p-4 flex flex-col justify-between z-20">
      {/* Sleek, Minimal Floating Top Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Compact Rep Pill with Live Angle & Progress */}
        <div className="bg-stone-900/85 text-white backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 shadow-sm flex items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs uppercase text-stone-400 font-semibold tracking-wider">Reps</span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
              {correctReps}
            </span>
            <span className="text-xs text-stone-400">/ {targetReps}</span>
          </div>

          {/* Live Joint Angle Telemetry */}
          {primaryAngle && (
            <>
              <span className="w-px h-3.5 bg-stone-700" />
              <div className="flex items-baseline gap-1 text-xs font-mono">
                <span className="text-stone-400">{primaryAngle.label}:</span>
                <span className="font-bold text-sky-400">{primaryAngle.val}°</span>
              </div>
            </>
          )}

          {/* Depth / Extension Progress */}
          {repProgress > 0 && (
            <>
              <span className="w-px h-3.5 bg-stone-700 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
                <span className="text-stone-400">Depth:</span>
                <span className={`font-semibold ${repProgress >= 100 ? 'text-emerald-400' : 'text-stone-200'}`}>
                  {repProgress}%
                </span>
              </div>
            </>
          )}

          <span className="w-px h-3.5 bg-stone-700" />

          {/* Clean Movement State */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-300">
            <span
              className={`w-2 h-2 rounded-full ${
                movementState === 'REP_COMPLETE'
                  ? 'bg-emerald-400 animate-ping'
                  : movementState === 'BOTTOM'
                  ? 'bg-emerald-400'
                  : movementState === 'DESCENDING'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-stone-400'
              }`}
            />
            <span>{getMovementLabel(movementState)}</span>
          </div>

          <span className="w-px h-3.5 bg-stone-700 hidden md:block" />

          {/* Clean Timer */}
          <div className="text-xs font-mono text-stone-300 hidden md:block">
            {formatTime(durationSeconds)}
          </div>
        </div>
      </div>

      {/* Clean Isometric Hold Banner (Only on final rep) */}
      {isHoldingLastRep && (
        <div className="w-full max-w-xs mx-auto pointer-events-auto bg-stone-900/90 text-white border border-emerald-500/50 rounded-2xl p-3.5 shadow-xl backdrop-blur-md text-center space-y-1 mb-4">
          <div className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wide">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            <span>Final Rep Hold</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {holdCountdownSeconds}s
          </div>
        </div>
      )}
    </div>
  );
};

