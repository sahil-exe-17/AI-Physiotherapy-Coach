import { useState, useEffect, useRef, useCallback } from 'react';
import { PoseDetectorService } from '../cv/poseDetector';
import { LandmarkProcessor } from '../cv/landmarkProcessor';
import { AngleCalculator, CalculatedAngles } from '../cv/angleCalculator';
import { ExerciseClassifier, ExerciseMismatchResult } from '../cv/exerciseClassifier';
import { PoseLandmark, SKELETON_CONNECTIONS, PoseStatus } from '../types/pose';
import { DevDebugInfo } from '../types/session';

export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  isCameraActive: boolean,
  isPaused: boolean = false,
  hasFormError: boolean = false,
  activeExerciseId: string = 'squat'
) {
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([]);
  const [angles, setAngles] = useState<CalculatedAngles | null>(null);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [multiplePeopleDetected, setMultiplePeopleDetected] = useState<boolean>(false);
  const [poseConfidence, setPoseConfidence] = useState<number>(0);
  const [mismatchResult, setMismatchResult] = useState<ExerciseMismatchResult>({
    isMismatch: false,
    detectedExercise: 'unknown',
    warningMessage: null,
  });

  const [debugInfo, setDebugInfo] = useState<DevDebugInfo>({
    fps: 0,
    inferenceTimeMs: 0,
    poseConfidence: 0,
    landmarksCount: 0,
    currentKneeAngle: 180,
    currentHipAngle: 180,
    currentTorsoAngle: 0,
    movementState: 'IDLE',
    activeIssues: [],
    resolution: { width: 1280, height: 720 },
  });

  const detectorServiceRef = useRef<PoseDetectorService>(PoseDetectorService.getInstance());
  const processorRef = useRef<LandmarkProcessor>(new LandmarkProcessor(0.8));
  const angleCalculatorRef = useRef<AngleCalculator>(new AngleCalculator());
  const classifierRef = useRef<ExerciseClassifier>(new ExerciseClassifier());

  const animFrameIdRef = useRef<number | null>(null);
  const lastStateSyncTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());
  const fpsRef = useRef<number>(0);
  const lastTimestampMsRef = useRef<number>(0);

  // Initialize MediaPipe Pose Model
  useEffect(() => {
    let isMounted = true;
    detectorServiceRef.current
      .initialize()
      .then(() => {
        if (isMounted) {
          setIsModelReady(true);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setModelError(err.message || 'Failed to initialize MediaPipe Pose model');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset exercise classifier on exercise switch
  useEffect(() => {
    classifierRef.current.reset();
  }, [activeExerciseId]);

  // Synchronous Direct-to-Canvas Fast Renderer (60 FPS Native ZERO LAG)
  const drawDirectCanvas = (
    ctx: CanvasRenderingContext2D,
    lms: PoseLandmark[],
    computedAngles: CalculatedAngles | null,
    w: number,
    h: number
  ) => {
    ctx.clearRect(0, 0, w, h);
    if (!lms || lms.length < 33) return;

    let boneColor = hasFormError ? '#ef4444' : '#10b981';
    let jointColor = hasFormError ? '#f87171' : '#34d399';
    let headColor = hasFormError ? '#fca5a5' : '#22d3ee';

    ctx.lineCap = 'round';

    // Draw Skeleton Lines
    SKELETON_CONNECTIONS.forEach((conn) => {
      const fromLm = lms[conn.from];
      const toLm = lms[conn.to];

      if (fromLm && toLm && fromLm.visibility > 0.15 && toLm.visibility > 0.15) {
        ctx.lineWidth = conn.group === 'head' ? 1.0 : 1.8;
        ctx.strokeStyle = conn.group === 'head' ? headColor : boneColor;
        ctx.beginPath();
        ctx.moveTo(fromLm.x * w, fromLm.y * h);
        ctx.lineTo(toLm.x * w, toLm.y * h);
        ctx.stroke();
      }
    });

    // Draw Joint Dots
    lms.forEach((lm) => {
      if (lm.visibility > 0.15) {
        const x = lm.x * w;
        const y = lm.y * h;
        const isHead = lm.id <= 10;

        ctx.beginPath();
        ctx.arc(x, y, isHead ? 2.0 : 3.0, 0, 2 * Math.PI);
        ctx.fillStyle = isHead ? headColor : jointColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, isHead ? 1.0 : 1.2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });

    // Draw Angle Tags
    if (computedAngles) {
      const drawAngleTag = (pt: { x: number; y: number }, label: string, deg: number) => {
        if (!pt) return;
        const px = pt.x * w;
        const py = pt.y * h;

        ctx.save();
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        const text = `${label}: ${Math.round(deg)}°`;
        const tw = ctx.measureText(text).width;
        const bx = Math.max(10, Math.min(w - tw - 20, px + 10));
        const by = Math.max(10, Math.min(h - 28, py - 10));

        ctx.fillStyle = hasFormError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = hasFormError ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.roundRect(bx, by, tw + 10, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, bx + 5, by + 13);
        ctx.restore();
      };

      if (activeExerciseId === 'squat' && computedAngles.kneeAngle && computedAngles.kneeAngle.confidence > 0.2) {
        drawAngleTag(computedAngles.kneeAngle.points.b, 'Knee', computedAngles.kneeAngle.angleDegrees);
      }
      if (computedAngles.elbowAngle && computedAngles.elbowAngle.confidence > 0.2) {
        drawAngleTag(computedAngles.elbowAngle.points.b, 'Elbow', computedAngles.elbowAngle.angleDegrees);
      }
    }
  };

  // Continuous Unfreezing 60 FPS CV Processing Loop
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    if (
      !isCameraActive ||
      isPaused ||
      !video ||
      video.readyState < 2 ||
      video.paused ||
      video.ended ||
      !detectorServiceRef.current.isReady()
    ) {
      if (isCameraActive && !isPaused) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    const now = performance.now();
    let timestampMs = Math.round(now);
    if (timestampMs <= lastTimestampMsRef.current) {
      timestampMs = lastTimestampMsRef.current + 1; // Strict monotonic increase prevents MediaPipe freezing
    }
    lastTimestampMsRef.current = timestampMs;

    const startTime = performance.now();

    try {
      const results = detectorServiceRef.current.detectForVideo(video, timestampMs);
      const inferenceTimeMs = Math.round(performance.now() - startTime);

      const numPoses = results.landmarks ? results.landmarks.length : 0;

      if (results.landmarks && results.landmarks.length > 0) {
        const rawLms = results.landmarks[0];
        const processedLms = processorRef.current.processRawLandmarks(rawLms);
        const computedAngles = angleCalculatorRef.current.calculateAll(processedLms);

        // 1. Direct Synchronous Canvas Drawing (60 FPS Native ZERO LAG)
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawDirectCanvas(
              ctx,
              processedLms,
              computedAngles,
              canvas.width || video.clientWidth,
              canvas.height || video.clientHeight
            );
          }
        }

        // 2. Cross-Exercise Mismatch Detection
        const mismatch = classifierRef.current.checkMismatch(activeExerciseId, computedAngles);

        // 3. Throttle React State Sync to 10 FPS (every 100ms)
        if (now - lastStateSyncTimeRef.current >= 100) {
          lastStateSyncTimeRef.current = now;
          setMultiplePeopleDetected(numPoses > 1);
          setMismatchResult(mismatch);

          const keyIndices = [11, 12, 23, 24, 25, 26];
          const avgVis =
            keyIndices.reduce((acc, idx) => acc + (processedLms[idx]?.visibility || 0), 0) /
            keyIndices.length;

          setPoseConfidence(avgVis);
          setLandmarks(processedLms);
          setAngles(computedAngles);

          if (computedAngles) {
            setDebugInfo({
              fps: fpsRef.current,
              inferenceTimeMs,
              poseConfidence: Math.round(avgVis * 100) / 100,
              landmarksCount: processedLms.length,
              currentKneeAngle: computedAngles.kneeAngle.angleDegrees,
              currentHipAngle: computedAngles.hipAngle.angleDegrees,
              currentTorsoAngle: computedAngles.torsoAngle.angleDegrees,
              movementState: 'IDLE',
              activeIssues: [],
              resolution: { width: video.videoWidth || 1280, height: video.videoHeight || 720 },
            });
          }
        }

        // FPS calculation
        frameCountRef.current++;
        if (now - lastFpsUpdateRef.current >= 1000) {
          fpsRef.current = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));
          frameCountRef.current = 0;
          lastFpsUpdateRef.current = now;
        }
      }
    } catch (err) {
      console.warn('Frame detection skipped cleanly:', err);
    }

    animFrameIdRef.current = requestAnimationFrame(processFrame);
  }, [isCameraActive, isPaused, videoRef, canvasRef, hasFormError, activeExerciseId]);

  useEffect(() => {
    if (isCameraActive && isModelReady && !isPaused) {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraActive, isModelReady, isPaused, processFrame]);

  return {
    landmarks,
    angles,
    isModelReady,
    modelError,
    multiplePeopleDetected,
    poseConfidence,
    mismatchResult,
    debugInfo,
  };
}
