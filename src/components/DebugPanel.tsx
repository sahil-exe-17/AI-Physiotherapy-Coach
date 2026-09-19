import React, { useState, useEffect } from 'react';
import { DevDebugInfo } from '../types/session';
import { PoseLandmark } from '../types/pose';
import { Terminal, X, FileSpreadsheet, Download, Trash2, Database } from 'lucide-react';
import { DatasetService } from '../services/datasetService';

interface DebugPanelProps {
  debugInfo: DevDebugInfo;
  landmarks: PoseLandmark[];
  isOpen: boolean;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  debugInfo,
  landmarks,
  isOpen,
  onClose,
}) => {
  const [stats, setStats] = useState({ reps: 0, sessions: 0, telemetry: 0 });

  const refreshStats = () => {
    const ds = DatasetService.getInstance();
    setStats({
      reps: ds.getStoredReps().length,
      sessions: ds.getStoredSessions().length,
      telemetry: ds.getTelemetryCount(),
    });
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
      const interval = setInterval(refreshStats, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 z-40 w-84 max-h-[calc(100vh-5rem)] bg-white/95 border border-stone-200/90 rounded-2xl shadow-xl backdrop-blur-xl p-4 overflow-y-auto font-mono text-xs text-stone-700 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 mb-3">
        <div className="flex items-center gap-2 text-stone-800 font-semibold font-sans">
          <Terminal className="h-4 w-4 text-stone-600" />
          <span>Developer Telemetry</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 cursor-pointer transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3.5">
        {/* Background Dataset Collector Section */}
        <div className="space-y-2.5 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-stone-800 font-semibold font-sans text-[11px]">
              <Database className="h-3.5 w-3.5 text-stone-500" />
              <span>Testing Dataset</span>
            </div>
            <span className="text-[10px] text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Auto-logging
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-white p-1.5 rounded-lg border border-stone-200/80 shadow-2xs">
              <div className="text-[9px] text-stone-400 uppercase">Reps</div>
              <div className="text-sm font-bold text-stone-900">{stats.reps}</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-stone-200/80 shadow-2xs">
              <div className="text-[9px] text-stone-400 uppercase">Sets</div>
              <div className="text-sm font-bold text-emerald-700">{stats.sessions}</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-stone-200/80 shadow-2xs">
              <div className="text-[9px] text-stone-400 uppercase">Frames</div>
              <div className="text-sm font-bold text-stone-700">{stats.telemetry}</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <button
              onClick={() => DatasetService.getInstance().exportToExcel()}
              className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export Dataset (.xlsx)</span>
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => DatasetService.getInstance().exportRepsToCsv()}
                className="py-1.5 px-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/80 rounded-lg text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <Download className="h-3 w-3 text-stone-500" />
                <span>Reps CSV</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Clear all stored test dataset entries?')) {
                    DatasetService.getInstance().clearDataset();
                    refreshStats();
                  }
                }}
                className="py-1.5 px-2 bg-white hover:bg-rose-50 text-stone-500 hover:text-rose-700 border border-stone-200/80 hover:border-rose-200 rounded-lg text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <Trash2 className="h-3 w-3" />
                <span>Reset Data</span>
              </button>
            </div>
          </div>

          <p className="text-[10px] text-stone-400 italic">
            Tip: Press <kbd className="px-1 py-0.5 bg-stone-200 rounded text-stone-700 font-semibold text-[10px]">Ctrl+Shift+E</kbd> anywhere to export.
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
          <div className="text-[10px] text-stone-400 font-sans uppercase font-semibold">
            Performance / Model
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">FPS:</span>
            <span className="text-emerald-700 font-bold">{debugInfo.fps} FPS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Inference Latency:</span>
            <span className="text-stone-800 font-semibold">{debugInfo.inferenceTimeMs} ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Confidence:</span>
            <span
              className={debugInfo.poseConfidence > 0.6 ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}
            >
              {Math.round(debugInfo.poseConfidence * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Resolution:</span>
            <span className="text-stone-700">
              {debugInfo.resolution.width} x {debugInfo.resolution.height}
            </span>
          </div>
        </div>

        {/* FSM State Machine Telemetry */}
        <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
          <div className="text-[10px] text-stone-400 font-sans uppercase font-semibold">
            Movement State
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Current State:</span>
            <span className="text-stone-900 font-bold">{debugInfo.movementState}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Knee Angle:</span>
            <span className="text-stone-800 font-semibold">{debugInfo.currentKneeAngle}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Hip Angle:</span>
            <span className="text-stone-800 font-semibold">{debugInfo.currentHipAngle}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Torso Tilt:</span>
            <span className="text-stone-800 font-semibold">{debugInfo.currentTorsoAngle}°</span>
          </div>
        </div>

        {/* Key Landmark Coordinates Preview */}
        <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
          <div className="text-[10px] text-stone-400 font-sans uppercase font-semibold">
            Key Landmarks (X, Y, Vis)
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[11px]">
            {landmarks.slice(11, 29).map((lm) => (
              <div key={lm.id} className="flex justify-between text-stone-500">
                <span className="truncate max-w-[110px]">{lm.name}:</span>
                <span className="text-stone-800 font-medium">
                  {lm.x.toFixed(2)}, {lm.y.toFixed(2)} ({lm.visibility.toFixed(2)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
