import React from 'react';
import { CalculatedAngles } from '../cv/angleCalculator';
import { Compass } from 'lucide-react';

interface AngleDisplayProps {
  angles: CalculatedAngles | null;
}

export const AngleDisplay: React.FC<AngleDisplayProps> = ({ angles }) => {
  if (!angles) return null;

  const currentElbow = Math.round(angles.elbowAngle.angleDegrees);
  const currentKnee = Math.round(angles.kneeAngle.angleDegrees);
  const currentShoulder = Math.round(angles.shoulderAngle.angleDegrees);

  return (
    <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-2xs space-y-3 w-full sm:w-64 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
        <span>Joint Kinematics</span>
        <Compass className="h-4 w-4 text-stone-400" />
      </div>

      {/* Primary Arm Telemetry Card */}
      <div className="p-3 rounded-xl border border-stone-200/80 bg-stone-50/70 flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-stone-600">Flexion Angle</span>
          <span className="font-bold text-stone-900 text-lg">{currentElbow}°</span>
        </div>

        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-stone-500">Shoulder Drift</span>
          <span
            className={`font-semibold ${
              currentShoulder > 30 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {currentShoulder}°
          </span>
        </div>
      </div>

      {/* Additional Telemetry List */}
      <div className="space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/60">
          <span className="text-stone-500">Knee Angle</span>
          <span className="font-semibold text-stone-800 text-sm">{currentKnee}°</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/60">
          <span className="text-stone-500">Torso Lean</span>
          <span
            className={`font-semibold text-sm ${
              angles.torsoLean > 35 ? 'text-rose-600' : 'text-stone-800'
            }`}
          >
            {Math.round(angles.torsoLean)}°
          </span>
        </div>
      </div>
    </div>
  );
};
