import { useState, useEffect, useRef, useCallback } from 'react';
import { PoseLandmark } from '../types/pose';
import { CalculatedAngles } from '../cv/angleCalculator';
import { SessionStatus, CalibrationStatus, SessionMetrics, FeedbackMessage } from '../types/session';
import { MovementState, PostureIssue, RepRecord, IntensityLevel } from '../types/exercise';
import { ExerciseRegistry } from '../exercises/exerciseRegistry';
import { IExerciseAnalyzer } from '../exercises/exerciseTypes';
import { VoiceService } from '../services/voiceService';
import { SessionService } from '../services/sessionService';
import { DatasetService } from '../services/datasetService';
import { assessCalibration } from '../utils/validation';

export function useExerciseSession(
  exerciseId: string = 'squat',
  intensityLevel: IntensityLevel = 'MEDIUM',
  landmarks: PoseLandmark[],
  angles: CalculatedAngles | null,
  isCameraActive: boolean
) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('CALIBRATION');
  const [calibration, setCalibration] = useState<CalibrationStatus>({
    cameraActive: false,
    personDetected: false,
    fullBodyVisible: false,
    confidenceGood: false,
    centered: false,
    readyToStart: false,
    warnings: [],
  });

  const [movementState, setMovementState] = useState<MovementState>('IDLE');
  const [completedReps, setCompletedReps] = useState<number>(0);
  const [correctReps, setCorrectReps] = useState<number>(0);
  const [incorrectReps, setIncorrectReps] = useState<number>(0);
  const [incompleteReps, setIncompleteReps] = useState<number>(0);
  const [targetReps, setTargetReps] = useState<number>(10);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [repProgress, setRepProgress] = useState<number>(0);
  const [isHoldingLastRep, setIsHoldingLastRep] = useState<boolean>(false);
  const [holdCountdownSeconds, setHoldCountdownSeconds] = useState<number>(5);

  const [activeFeedback, setActiveFeedback] = useState<FeedbackMessage>({
    id: 'init',
    type: 'INSTRUCTION',
    text: 'Stand in frame and complete calibration to start.',
    timestamp: Date.now(),
  });

  const [activeIssues, setActiveIssues] = useState<PostureIssue[]>([]);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [summaryMetrics, setSummaryMetrics] = useState<SessionMetrics | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  const analyzerRef = useRef<IExerciseAnalyzer>(ExerciseRegistry.createAnalyzer(exerciseId));
  const voiceServiceRef = useRef<VoiceService>(VoiceService.getInstance());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync exercise analyzer when exerciseId or intensityLevel changes
  useEffect(() => {
    analyzerRef.current = ExerciseRegistry.createAnalyzer(exerciseId);
    if (analyzerRef.current.setIntensity) {
      analyzerRef.current.setIntensity(intensityLevel);
    }
  }, [exerciseId, intensityLevel]);

  // Sync voice service settings
  useEffect(() => {
    voiceServiceRef.current.setEnabled(voiceEnabled);
  }, [voiceEnabled]);

  // Session Duration Timer
  useEffect(() => {
    if (sessionStatus === 'ACTIVE') {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStatus]);

  // Calibration Assessment
  useEffect(() => {
    if (sessionStatus === 'CALIBRATION') {
      const cal = assessCalibration(landmarks, isCameraActive);
      setCalibration(cal);
    }
  }, [sessionStatus, landmarks, isCameraActive]);

  // Real-time Exercise Frame Processing during ACTIVE phase
  useEffect(() => {
    if (sessionStatus !== 'ACTIVE' || !landmarks || landmarks.length < 33 || !angles) {
      return;
    }

    const result = analyzerRef.current.processFrame(landmarks, angles);

    setMovementState(result.movementState);
    setRepProgress(result.progressPercentage);
    setActiveIssues(result.activeIssues);
    setIsHoldingLastRep(!!result.isHoldingLastRep);
    if (result.holdCountdownSeconds !== undefined) {
      setHoldCountdownSeconds(result.holdCountdownSeconds);
    }

    DatasetService.getInstance().sampleTelemetry(
      analyzerRef.current.definition.id,
      result.movementState,
      angles,
      landmarks[0]?.visibility ?? 1.0
    );

    // Update Rep Metrics
    const metrics = analyzerRef.current.getMetrics();
    setCorrectReps(metrics.correctReps);
    setIncorrectReps(metrics.incorrectReps);
    setIncompleteReps(metrics.incompleteReps);
    setCompletedReps(metrics.correctReps + metrics.incorrectReps);
    setAccuracy(metrics.accuracy);

    // Handle Rep Completion Trigger
    if (result.repCompleted && result.repRecord) {
      DatasetService.getInstance().recordRep(
        analyzerRef.current.definition.id,
        analyzerRef.current.definition.name,
        intensityLevel,
        result.repRecord
      );

      if (result.repRecord.isCorrect) {
        voiceServiceRef.current.speak('Good rep!', true);
      } else {
        voiceServiceRef.current.speak('Incorrect rep. Form error detected.', true);
      }
    } else if (result.feedbackMessage) {
      if (result.feedbackType === 'WARNING' || result.feedbackType === 'ERROR') {
        voiceServiceRef.current.speak(result.feedbackMessage);
      }
    }

    // Update active feedback banner
    setActiveFeedback({
      id: `fb_${Date.now()}`,
      type: result.feedbackType,
      text: result.feedbackMessage,
      timestamp: Date.now(),
    });

    // AUTO STOP: Trigger end session automatically after 1 set is finished!
    if (result.setFinished) {
      setTimeout(() => {
        const finalMetrics = analyzerRef.current.getMetrics();
        const summary = SessionService.calculateSummaryMetrics(
          analyzerRef.current.definition.id,
          analyzerRef.current.definition.name,
          targetReps,
          finalMetrics.totalAttempts,
          finalMetrics.correctReps,
          finalMetrics.incorrectReps,
          finalMetrics.incompleteReps,
          finalMetrics.repHistory,
          durationSeconds
        );

        DatasetService.getInstance().recordSession(summary, intensityLevel);
        setSummaryMetrics(summary);
        setSessionStatus('SUMMARY');
        voiceServiceRef.current.speak('Set complete! Outstanding workout.', true);
      }, 1000);
    }
  }, [sessionStatus, landmarks, angles, durationSeconds, targetReps, intensityLevel]);

  const startSession = useCallback(() => {
    DatasetService.getInstance().startNewSession();
    analyzerRef.current.reset();
    if (analyzerRef.current.setIntensity) {
      analyzerRef.current.setIntensity(intensityLevel);
    }
    setSessionStatus('ACTIVE');
    setDurationSeconds(0);
    voiceServiceRef.current.speak(`Session started. Set target is ${targetReps} reps.`, true);
  }, [intensityLevel, targetReps]);

  const pauseSession = useCallback(() => {
    setSessionStatus('PAUSED');
    voiceServiceRef.current.speak('Session paused.');
  }, []);

  const resumeSession = useCallback(() => {
    setSessionStatus('ACTIVE');
    voiceServiceRef.current.speak('Session resumed.');
  }, []);

  const restartSession = useCallback(() => {
    analyzerRef.current.reset();
    if (analyzerRef.current.setIntensity) {
      analyzerRef.current.setIntensity(intensityLevel);
    }
    setDurationSeconds(0);
    setCompletedReps(0);
    setCorrectReps(0);
    setIncorrectReps(0);
    setIncompleteReps(0);
    setAccuracy(100);
    setIsHoldingLastRep(false);
    setSessionStatus('CALIBRATION');
    voiceServiceRef.current.speak('Session restarted. Please calibrate.');
  }, [intensityLevel]);

  const endSession = useCallback(() => {
    const metrics = analyzerRef.current.getMetrics();
    const summary = SessionService.calculateSummaryMetrics(
      analyzerRef.current.definition.id,
      analyzerRef.current.definition.name,
      targetReps,
      metrics.totalAttempts,
      metrics.correctReps,
      metrics.incorrectReps,
      metrics.incompleteReps,
      metrics.repHistory,
      durationSeconds
    );

    DatasetService.getInstance().recordSession(summary, intensityLevel);
    setSummaryMetrics(summary);
    setSessionStatus('SUMMARY');
    voiceServiceRef.current.speak('Session finished!', true);
  }, [targetReps, durationSeconds, intensityLevel]);

  return {
    sessionStatus,
    setSessionStatus,
    calibration,
    movementState,
    completedReps,
    correctReps,
    incorrectReps,
    incompleteReps,
    targetReps,
    accuracy,
    repProgress,
    activeFeedback,
    activeIssues,
    durationSeconds,
    summaryMetrics,
    voiceEnabled,
    setVoiceEnabled,
    isHoldingLastRep,
    holdCountdownSeconds,
    startSession,
    pauseSession,
    resumeSession,
    restartSession,
    endSession,
  };
}
