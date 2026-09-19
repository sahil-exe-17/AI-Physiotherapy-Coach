import React, { useRef, useState, useEffect } from 'react';
import { PoseOverlay } from './PoseOverlay';
import { PoseLandmark, PoseStatus } from '../types/pose';
import { CalculatedAngles } from '../cv/angleCalculator';
import { ExerciseMismatchResult } from '../cv/exerciseClassifier';
import { CameraDeviceInfo } from '../services/cameraService';
import { Maximize2, Minimize2, SwitchCamera, AlertTriangle, Users, AlertOctagon } from 'lucide-react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  landmarks: PoseLandmark[];
  angles: CalculatedAngles | null;
  poseStatus: PoseStatus;
  isPaused: boolean;
  cameras: CameraDeviceInfo[];
  activeDeviceId: string;
  onSwitchCamera: (deviceId: string) => void;
  multiplePeopleDetected: boolean;
  poseConfidence: number;
  hasFormError: boolean;
  mismatchResult?: ExerciseMismatchResult;
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  landmarks,
  angles,
  poseStatus,
  isPaused,
  cameras,
  activeDeviceId,
  onSwitchCamera,
  multiplePeopleDetected,
  poseConfidence,
  hasFormError,
  mismatchResult,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeCanvasRef = canvasRef || internalCanvasRef;

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 720,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (videoRef.current) {
        const w = videoRef.current.clientWidth || 1280;
        const h = videoRef.current.clientHeight || 720;
        setDimensions({ width: w, height: h });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [videoRef, isCameraActive]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const isMismatch = mismatchResult?.isMismatch;

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video max-h-[75vh] bg-stone-950 rounded-3xl overflow-hidden border transition-colors duration-300 shadow-sm flex items-center justify-center group ${
        isMismatch || hasFormError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-stone-200/90'
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="w-full h-full object-contain bg-black"
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDimensions({
              width: videoRef.current.clientWidth,
              height: videoRef.current.clientHeight,
            });
          }
        }}
      />

      {/* Canvas Skeleton Overlay */}
      {isCameraActive && (
        <PoseOverlay
          canvasRef={activeCanvasRef}
          landmarks={landmarks}
          angles={angles}
          width={dimensions.width}
          height={dimensions.height}
          status={poseStatus}
          isPaused={isPaused}
          hasFormError={hasFormError || !!isMismatch}
        />
      )}

      {/* Camera Controls Floating Bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
        {cameras.length > 1 && (
          <div className="relative">
            <select
              value={activeDeviceId}
              onChange={(e) => onSwitchCamera(e.target.value)}
              className="bg-white/90 text-stone-800 text-xs rounded-xl px-3 py-1.5 border border-stone-200 shadow-xs focus:outline-none cursor-pointer appearance-none pr-8"
            >
              {cameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId} className="bg-white text-stone-800">
                  {cam.label}
                </option>
              ))}
            </select>
            <SwitchCamera className="h-3.5 w-3.5 text-stone-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        )}

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-white/90 text-stone-700 border border-stone-200 hover:bg-white transition-all shadow-xs cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Real-time Wrong Exercise Alert Banner Overlay */}
      {isMismatch && mismatchResult?.warningMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-2xl bg-rose-50 text-rose-900 font-semibold text-xs sm:text-sm flex items-center gap-2.5 shadow-lg backdrop-blur-xl border border-rose-300 animate-bounce max-w-lg text-center">
          <AlertOctagon className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{mismatchResult.warningMessage}</span>
        </div>
      )}

      {/* Session Paused Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <div className="px-4 py-1.5 rounded-full bg-white text-stone-800 text-xs font-semibold uppercase tracking-wider border border-stone-200 shadow-sm">
            Session Paused
          </div>
          <p className="text-xs text-white drop-shadow-sm font-medium">Pose tracking is temporarily paused.</p>
        </div>
      )}

      {/* Edge Case Warnings */}
      {!isPaused && isCameraActive && !isMismatch && (
        <>
          {multiplePeopleDetected && (
            <div className="absolute top-4 left-4 z-30 px-3.5 py-2 rounded-xl bg-amber-500/90 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg backdrop-blur-md animate-bounce">
              <Users className="h-4 w-4" />
              <span>Please ensure only one person is visible in frame.</span>
            </div>
          )}

          {poseConfidence > 0 && poseConfidence < 0.35 && !multiplePeopleDetected && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-amber-500/90 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg backdrop-blur-md">
              <AlertTriangle className="h-4 w-4" />
              <span>Pose clarity low. Step clearly into camera view.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
