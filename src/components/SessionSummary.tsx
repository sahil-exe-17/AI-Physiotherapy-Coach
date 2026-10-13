import React, { useEffect } from 'react';
import { SessionMetrics } from '../types/session';
import { Trophy, CheckCircle2, XCircle, AlertTriangle, RotateCcw, ArrowLeft, Award, Flame, BarChart2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SessionSummaryProps {
  summary: SessionMetrics;
  onTryAgain: () => void;
  onBackToExercise: () => void;
  userName?: string;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  summary,
  onTryAgain,
  onBackToExercise,
  userName,
}) => {
  useEffect(() => {
    if (summary.accuracy >= 70) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [summary]);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-800 flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-10 space-y-7 border border-stone-200/90 shadow-lg">
        {/* Top Header */}
        <div className="text-center space-y-2.5">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                Session Complete
              </span>
              {userName && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                  Patient: {userName}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-heading mt-2">
              {summary.exerciseName} Performance
            </h2>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-50 border border-stone-200/70 p-3.5 rounded-2xl text-center space-y-0.5">
            <div className="text-[10px] text-stone-500 uppercase font-semibold">Target</div>
            <div className="text-2xl font-bold font-mono text-stone-900">{summary.targetReps}</div>
          </div>

          <div className="bg-stone-50 border border-stone-200/70 p-3.5 rounded-2xl text-center space-y-0.5">
            <div className="text-[10px] text-emerald-700 uppercase font-semibold">Correct</div>
            <div className="text-2xl font-bold font-mono text-emerald-700">{summary.correctReps}</div>
          </div>

          <div className="bg-stone-50 border border-stone-200/70 p-3.5 rounded-2xl text-center space-y-0.5">
            <div className="text-[10px] text-rose-700 uppercase font-semibold">Form Error</div>
            <div className="text-2xl font-bold font-mono text-rose-600">{summary.incorrectReps}</div>
          </div>

          <div className="bg-stone-50 border border-stone-200/70 p-3.5 rounded-2xl text-center space-y-0.5">
            <div className="text-[10px] text-amber-700 uppercase font-semibold">Incomplete</div>
            <div className="text-2xl font-bold font-mono text-amber-700">{summary.incompleteReps}</div>
          </div>
        </div>

        {/* Quality Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-stone-50 border border-stone-200/70 p-4.5 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] text-stone-500 font-medium uppercase">Form Accuracy</div>
              <div className="text-3xl font-extrabold text-stone-900 font-mono">{summary.accuracy}%</div>
            </div>
            <Flame className="h-7 w-7 text-amber-600" />
          </div>

          <div className="bg-stone-50 border border-stone-200/70 p-4.5 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] text-stone-500 font-medium uppercase">Quality Score</div>
              <div className="text-3xl font-extrabold text-emerald-700 font-mono">
                {summary.movementQualityScore}%
              </div>
            </div>
            <Award className="h-7 w-7 text-emerald-600" />
          </div>
        </div>

        {/* Most Frequent Issue Identified */}
        {summary.mostFrequentIssue && (
          <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-950">Posture Focus Area</span>
              <span className="text-amber-800">{summary.mostFrequentIssue}</span>
            </div>
          </div>
        )}

        {/* Rep Breakdown Table */}
        {summary.repHistory.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <BarChart2 className="h-4 w-4 text-stone-600" />
              <span>Repetition Log</span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-stone-200/80 rounded-2xl bg-stone-50/50 p-2 space-y-1 font-mono text-xs">
              {summary.repHistory.map((rep, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/60 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    {rep.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    )}
                    <span className="font-semibold text-stone-800">Rep #{rep.repNumber}</span>
                  </div>

                  <div className="flex items-center gap-4 text-stone-500 text-xs">
                    <span>Depth: {Math.round(rep.maxKneeDepthAngle)}°</span>
                    <span>{(rep.durationMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onTryAgain}
            className="py-3 px-6 rounded-xl font-semibold text-sm bg-stone-900 hover:bg-stone-800 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={onBackToExercise}
            className="py-3 px-6 rounded-xl font-medium text-sm bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Recalibrate & Restart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
