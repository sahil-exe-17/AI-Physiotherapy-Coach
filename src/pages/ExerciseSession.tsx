import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { CameraView } from '../components/CameraView';
import { SessionHUD } from '../components/SessionHUD';
import { CalibrationScreen } from '../components/CalibrationScreen';
import { PermissionModal } from '../components/PermissionModal';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { AngleDisplay } from '../components/AngleDisplay';
import { SessionControls } from '../components/SessionControls';
import { DebugPanel } from '../components/DebugPanel';
import { SessionSummary } from '../components/SessionSummary';

import { useCamera } from '../hooks/useCamera';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useExerciseSession } from '../hooks/useExerciseSession';
import { ExerciseRegistry } from '../exercises/exerciseRegistry';
import { IntensityLevel } from '../types/exercise';
import { DatasetService } from '../services/datasetService';

import { RecommendedExercisePlan } from '../types/intake';

interface ExerciseSessionProps {
  plan?: RecommendedExercisePlan | null;
  initialExerciseId?: string;
  onOpenAssessment?: () => void;
}

export const ExerciseSession: React.FC<ExerciseSessionProps> = ({
  plan,
  initialExerciseId,
  onOpenAssessment,
}) => {
  const [activeExerciseId, setActiveExerciseId] = useState<string>(
    initialExerciseId || (plan?.exercises.find((e) => e.enabled)?.id ?? 'squat')
  );
  const [intensityLevel, setIntensityLevel] = useState<IntensityLevel>(
    plan?.intensity ?? 'MEDIUM'
  );
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync initial settings if plan or initialExerciseId updates
  useEffect(() => {
    if (initialExerciseId) {
      setActiveExerciseId(initialExerciseId);
    } else if (plan?.exercises.length) {
      const firstEnabled = plan.exercises.find((e) => e.enabled);
      if (firstEnabled) setActiveExerciseId(firstEnabled.id);
    }
    if (plan?.intensity) {
      setIntensityLevel(plan.intensity);
    }
  }, [plan, initialExerciseId]);

  // Initialize background dataset recorder
  useEffect(() => {
    DatasetService.getInstance();
  }, []);

  const activeDefinition = ExerciseRegistry.getDefinition(activeExerciseId);

  // 1. Camera Management Hook
  const {
    videoRef,
    stream,
    cameras,
    activeDeviceId,
    permissionState,
    errorMessage,
    initCamera,
    switchCamera,
  } = useCamera();

  const isCameraActive = permissionState === 'granted' && stream !== null;

  useEffect(() => {
    initCamera();
  }, [initCamera]);

  // 2. Direct-Canvas Continuous Unfreezing Pose Detection Hook
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const {
    landmarks,
    angles,
    multiplePeopleDetected,
    poseConfidence,
    mismatchResult,
    debugInfo,
  } = usePoseDetection(videoRef, canvasRef, isCameraActive, isPaused, false, activeExerciseId);

  // 3. Exercise Session Logic Hook
  const {
    sessionStatus,
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
  } = useExerciseSession(activeExerciseId, intensityLevel, landmarks, angles, isCameraActive);

  const handlePause = () => {
    setIsPaused(true);
    pauseSession();
  };

  const handleResume = () => {
    setIsPaused(false);
    resumeSession();
  };

  const handleRestart = () => {
    setIsPaused(false);
    restartSession();
  };

  const hasFormError =
    activeFeedback.type === 'ERROR' ||
    mismatchResult.isMismatch ||
    activeIssues.some((issue) => issue.severity === 'error');

  // Render post-session summary page if finished
  if (sessionStatus === 'SUMMARY' && summaryMetrics) {
    return (
      <SessionSummary
        summary={summaryMetrics}
        userName={plan?.userName}
        onTryAgain={handleRestart}
        onBackToExercise={handleRestart}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-800 flex flex-col font-sans selection:bg-stone-200 selection:text-stone-900">
      {/* Header with Exercise & Intensity Switchers */}
      <Header
        activeExerciseId={activeExerciseId}
        onSelectExercise={(id) => {
          setActiveExerciseId(id);
          handleRestart();
        }}
        intensityLevel={intensityLevel}
        onSelectIntensity={(level) => {
          setIntensityLevel(level);
          handleRestart();
        }}
        sessionNumber="01"
        isCameraActive={isCameraActive}
        isDevMode={isDevMode}
        onToggleDevMode={() => setIsDevMode(!isDevMode)}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onRestart={handleRestart}
        onOpenPlan={onOpenAssessment}
        userName={plan?.userName}
      />

      {/* Permission Onboarding Modal */}
      <PermissionModal
        permissionState={permissionState}
        errorMessage={errorMessage}
        onAllowCamera={() => initCamera()}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Left / Center: Camera Area */}
        <div className="flex-1 w-full space-y-4">
          <div className="relative w-full rounded-3xl overflow-hidden shadow-sm border border-stone-200/80 bg-stone-950">
            <CameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              isCameraActive={isCameraActive}
              landmarks={landmarks}
              angles={angles}
              poseStatus={hasFormError ? 'ERROR' : angles ? angles.kneeAngle.status : 'UNKNOWN'}
              isPaused={isPaused}
              cameras={cameras}
              activeDeviceId={activeDeviceId}
              onSwitchCamera={switchCamera}
              multiplePeopleDetected={multiplePeopleDetected}
              poseConfidence={poseConfidence}
              hasFormError={hasFormError}
              mismatchResult={mismatchResult}
            />

            {/* Calibration Screen Overlay */}
            {sessionStatus === 'CALIBRATION' && (
              <CalibrationScreen
                calibration={calibration}
                onStartExercise={startSession}
                userName={plan?.userName}
              />
            )}

            {/* Session HUD (Active workout overlay) */}
            {sessionStatus === 'ACTIVE' && (
              <SessionHUD
                exerciseName={activeDefinition.name}
                targetReps={targetReps}
                completedReps={completedReps}
                correctReps={correctReps}
                incorrectReps={incorrectReps}
                incompleteReps={incompleteReps}
                accuracy={accuracy}
                movementState={movementState}
                repProgress={repProgress}
                durationSeconds={durationSeconds}
                poseStatus={hasFormError ? 'ERROR' : angles ? angles.kneeAngle.status : 'UNKNOWN'}
                angles={angles}
                isHoldingLastRep={isHoldingLastRep}
                holdCountdownSeconds={holdCountdownSeconds}
                onCalibrateStanding={handleRestart}
              />
            )}
          </div>

          {/* Real-time Feedback Banner */}
          {sessionStatus === 'ACTIVE' && (
            <FeedbackBanner
              feedback={
                mismatchResult.isMismatch && mismatchResult.warningMessage
                  ? {
                      id: `mismatch_${Date.now()}`,
                      type: 'ERROR',
                      text: mismatchResult.warningMessage,
                      timestamp: Date.now(),
                    }
                  : activeFeedback
              }
            />
          )}

          {/* Session Control Buttons */}
          {(sessionStatus === 'ACTIVE' || sessionStatus === 'PAUSED') && (
            <SessionControls
              isPaused={isPaused}
              onPause={handlePause}
              onResume={handleResume}
              onRestart={handleRestart}
              onEndSession={endSession}
            />
          )}
        </div>

        {/* Right Sidebar: Telemetry & Info */}
        <div className="w-full lg:w-72 space-y-4">
          <AngleDisplay angles={angles} />

          {/* Prescribed Clinical Plan Widget */}
          {plan && (
            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs space-y-2.5 text-xs text-stone-600">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 uppercase tracking-wide text-[11px]">
                  Clinical Plan
                </span>
                {onOpenAssessment && (
                  <button
                    onClick={onOpenAssessment}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline"
                  >
                    Edit Plan
                  </button>
                )}
              </div>
              <p className="font-semibold text-stone-800 text-xs">{plan.title}</p>
              <div className="space-y-1.5 pt-1">
                {plan.exercises
                  .filter((ex) => ex.enabled)
                  .map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        setActiveExerciseId(ex.id);
                        handleRestart();
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        activeExerciseId === ex.id
                          ? 'bg-stone-900 text-white border-stone-900 font-bold shadow-2xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      <span className="truncate">{ex.name}</span>
                      <span className="font-mono text-[10px] opacity-80 shrink-0">
                        {ex.targetReps}r × {ex.sets}s
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-2xs space-y-2.5 text-xs text-stone-600">
            <h3 className="font-semibold text-stone-900 font-heading text-sm">
              {activeDefinition.name} ({intensityLevel} Pace)
            </h3>
            <p className="text-stone-500 leading-relaxed">{activeDefinition.description}</p>
            <ul className="list-disc pl-4 space-y-1.5 text-stone-600">
              {intensityLevel === 'LOW' && (
                <li className="text-emerald-700 font-medium">
                  Gentle pace: comfortable range counts as completed reps.
                </li>
              )}
              {intensityLevel === 'MEDIUM' && (
                <li className="text-amber-800 font-medium">
                  Standard pace: controlled, standard range required.
                </li>
              )}
              {intensityLevel === 'HIGH' && (
                <li className="text-rose-700 font-medium">
                  Deep pace: full athletic range required.
                </li>
              )}
              <li className="text-stone-700 font-medium">
                Final rep: 5-second isometric hold before completion.
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Developer Debug Panel */}
      <DebugPanel
        debugInfo={debugInfo}
        landmarks={landmarks}
        isOpen={isDevMode}
        onClose={() => setIsDevMode(false)}
      />
    </div>
  );
};
