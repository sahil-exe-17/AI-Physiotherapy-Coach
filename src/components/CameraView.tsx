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
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {/* Camera Controls Floating Bar */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
        {cameras.length > 1 && (
          <div className="relative">
            <select
              value={activeDeviceId}
              onChange={(e) => onSwitchCamera(e.target.value)}
              className="bg-stone-900/80 text-white text-xs rounded-xl px-2.5 py-1.5 border border-white/20 backdrop-blur-md shadow-xs focus:outline-none cursor-pointer appearance-none pr-7"
            >
              {cameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId} className="bg-stone-900 text-white">
                  {cam.label}
                </option>
              ))}
            </select>
            <SwitchCamera className="h-3.5 w-3.5 text-white/60 absolute right-2 top-2 pointer-events-none" />
          </div>
        )}

        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-xl bg-stone-900/80 text-white/90 border border-white/20 backdrop-blur-md hover:bg-stone-800 transition-all shadow-xs cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Session Paused Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <div className="px-4 py-1.5 rounded-full bg-white text-stone-800 text-xs font-semibold uppercase tracking-wider border border-stone-200 shadow-sm">
            Session Paused
          </div>
          <p className="text-xs text-white/90 font-medium">Pose tracking is paused.</p>
        </div>
      )}
    </div>
  );
};
