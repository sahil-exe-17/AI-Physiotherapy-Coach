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

  // Clean, High-Tech Minimalist Canvas Renderer with polished Angle Tags
  const drawDirectCanvas = (
    ctx: CanvasRenderingContext2D,
    lms: PoseLandmark[],
    computedAngles: CalculatedAngles | null,
    w: number,
    h: number
  ) => {
    ctx.clearRect(0, 0, w, h);
    if (!lms || lms.length < 33) return;

    const strokeColor = hasFormError ? 'rgba(244, 63, 94, 0.85)' : 'rgba(16, 185, 129, 0.75)';
    const jointDotColor = hasFormError ? '#fb7185' : '#34d399';

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw Only Body & Limb Connections (Keep face completely clear and clean)
    SKELETON_CONNECTIONS.forEach((conn) => {
      if (conn.group === 'head') return; // Skip head clutter

      const fromLm = lms[conn.from];
      const toLm = lms[conn.to];

      if (fromLm && toLm && fromLm.visibility > 0.3 && toLm.visibility > 0.3) {
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(fromLm.x * w, fromLm.y * h);
        ctx.lineTo(toLm.x * w, toLm.y * h);
        ctx.stroke();
      }
    });

    // Draw Subtle Joint Dots
    const trackedJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    trackedJoints.forEach((idx) => {
      const lm = lms[idx];
      if (lm && lm.visibility > 0.35) {
        const x = lm.x * w;
        const y = lm.y * h;

        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = jointDotColor;
        ctx.fill();

        // Subtle inner dot
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });

    // Render Minimal, Polished Angle Tags for Active Biomechanical Joints
    if (computedAngles) {
      const drawMinimalAngleTag = (
        pt: { x: number; y: number },
        label: string,
        deg: number,
        isWarningOrError: boolean
      ) => {
        if (!pt) return;
        const px = pt.x * w;
        const py = pt.y * h;

        // Subtle Joint Arc
        ctx.beginPath();
        ctx.arc(px, py, 16, 0, Math.PI * 0.75);
        ctx.strokeStyle = isWarningOrError ? 'rgba(244, 63, 94, 0.7)' : 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.save();
        ctx.font = '600 11px system-ui, -apple-system, sans-serif';
        const text = `${label} ${Math.round(deg)}°`;
        const tw = ctx.measureText(text).width;
        const pillWidth = tw + 16;
        const pillHeight = 22;

        const bx = Math.max(10, Math.min(w - pillWidth - 10, px + 12));
        const by = Math.max(10, Math.min(h - pillHeight - 10, py - 11));

        // Glassmorphic Minimal Pill
        ctx.fillStyle = isWarningOrError ? 'rgba(225, 29, 72, 0.85)' : 'rgba(15, 23, 42, 0.8)';
        ctx.strokeStyle = isWarningOrError ? '#f43f5e' : 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.roundRect(bx, by, pillWidth, pillHeight, 6);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, bx + 8, by + 15);
        ctx.restore();
      };

      // Knee Angle Tag (for Squats)
      if (
        activeExerciseId === 'squat' &&
        computedAngles.kneeAngle &&
        computedAngles.kneeAngle.confidence >= 0.35
      ) {
        drawMinimalAngleTag(
          computedAngles.kneeAngle.points.b,
          'Knee',
          computedAngles.kneeAngle.angleDegrees,
          hasFormError || computedAngles.kneeAngle.status === 'ERROR'
        );
      }

      // Elbow Angle Tag (for Bicep Curls)
      if (
        activeExerciseId === 'arm_curl' &&
        computedAngles.elbowAngle &&
        computedAngles.elbowAngle.confidence >= 0.35
      ) {
        drawMinimalAngleTag(
          computedAngles.elbowAngle.points.b,
          'Elbow',
          computedAngles.elbowAngle.angleDegrees,
          hasFormError
        );
      }

      // Torso Lean Warning Tag if posture breaks
      if (computedAngles.torsoLean > 30) {
        drawMinimalAngleTag(
          computedAngles.torsoAngle.points.a,
          'Lean',
          computedAngles.torsoLean,
          true
        );
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
