import React, { useState } from 'react';
import { Pause, Play, RotateCcw, StopCircle, AlertTriangle } from 'lucide-react';

interface SessionControlsProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onEndSession: () => void;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  isPaused,
  onPause,
  onResume,
  onRestart,
  onEndSession,
}) => {
  const [showConfirmEnd, setShowConfirmEnd] = useState<boolean>(false);

  return (
    <>
      <div className="flex items-center justify-center gap-2.5 pt-1">
        {/* Pause / Resume */}
        <button
          onClick={isPaused ? onResume : onPause}
          className={`px-4.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-2xs cursor-pointer border ${
            isPaused
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50'
          }`}
        >
          {isPaused ? <Play className="h-4 w-4 fill-current text-emerald-700" /> : <Pause className="h-4 w-4 text-stone-600" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {/* Restart */}
        <button
          onClick={onRestart}
          className="px-4.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-white text-stone-700 border border-stone-200/90 hover:bg-stone-50 transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 text-stone-500" />
          <span>Restart</span>
        </button>

        {/* End Session */}
        <button
          onClick={() => setShowConfirmEnd(true)}
          className="px-4.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-white text-stone-600 border border-stone-200/90 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
        >
          <StopCircle className="h-4 w-4 text-stone-500" />
          <span>Finish</span>
        </button>
      </div>

      {/* Confirmation Modal before ending session */}
      {showConfirmEnd && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white rounded-3xl p-6 text-center space-y-4 border border-stone-200/90 shadow-xl">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900 font-heading">Finish Workout Session?</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Are you sure you want to finish now? Your completed repetitions will be summarized.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmEnd(false)}
                className="py-2.5 rounded-xl text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 cursor-pointer transition-colors"
              >
                Keep Going
              </button>
              <button
                onClick={() => {
                  setShowConfirmEnd(false);
                  onEndSession();
                }}
                className="py-2.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 shadow-xs cursor-pointer transition-colors"
              >
                Finish & Review
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
