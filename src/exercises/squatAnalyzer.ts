import { PoseLandmark, LANDMARK_INDEX } from '../types/pose';
import { CalculatedAngles } from '../cv/angleCalculator';
import { MovementState, PostureIssue, RepRecord, ExerciseDefinition, IntensityLevel } from '../types/exercise';
import { IExerciseAnalyzer, AnalysisFrameResult } from './exerciseTypes';

export const DEFAULT_SQUAT_DEFINITION: ExerciseDefinition = {
  id: 'squat',
  name: 'Squat',
  description: 'Strict bodyweight squat requiring combined knee and hip joint flexion.',
  targetReps: 10,
  requiredLandmarks: [11, 12, 23, 24, 25, 26],
  relevantAngles: ['Knee Angle', 'Hip Angle', 'Torso Inclination'],
  thresholds: {
    standingKneeAngleMin: 140,
    squatDepthKneeAngleMax: 105,
    shallowSquatAngleMax: 125,
    maxTorsoLeanAngle: 35,
    kneeValgusThreshold: 0.7,
    minConfidenceScore: 0.3,
  },
};

export class SquatAnalyzer implements IExerciseAnalyzer {
  public definition: ExerciseDefinition;
  private currentState: MovementState = 'IDLE';
  private intensity: IntensityLevel = 'MEDIUM';
  private targetAngle: number = 105;

  private totalAttempts: number = 0;
  private correctReps: number = 0;
  private incorrectReps: number = 0;
  private incompleteReps: number = 0;
  private repHistory: RepRecord[] = [];

  private repStartTime: number = 0;
  private bottomTimestamp: number = 0;
  private startingKneeAngle: number = 160;
  private minKneeAngleInRep: number = 180;
  private minLeftKneeInRep: number = 180;
  private minRightKneeInRep: number = 180;
  private minLeftHipInRep: number = 180;
  private minRightHipInRep: number = 180;
  private maxTorsoLeanInRep: number = 0;

  private activeRepIssues: Map<string, PostureIssue> = new Map();
  private depthAchieved: boolean = false;
  private repCooldownUntil: number = 0;

  // Last Rep Isometric 5s Hold State
  private isHoldingLastRep: boolean = false;
  private holdStartTimestamp: number = 0;
  private holdDurationMs: number = 5000;
  private holdCompleted: boolean = false;

  constructor(definition: ExerciseDefinition = DEFAULT_SQUAT_DEFINITION) {
    this.definition = definition;
    this.setIntensity('MEDIUM');
  }

  public setIntensity(level: IntensityLevel): void {
    this.intensity = level;
    switch (level) {
      case 'LOW':
        this.targetAngle = 125; // Gentle squat threshold
        break;
      case 'HIGH':
        this.targetAngle = 90; // Deep athletic parallel squat
        break;
      case 'MEDIUM':
      default:
        this.targetAngle = 105; // Standard squat
        break;
    }
  }

  public processFrame(landmarks: PoseLandmark[], angles: CalculatedAngles): AnalysisFrameResult {
    if (!landmarks || landmarks.length < 33 || !angles) {
      return {
        movementState: this.currentState,
        repCompleted: false,
        activeIssues: [],
        feedbackMessage: 'Step into camera view to begin.',
        feedbackType: 'INSTRUCTION',
        progressPercentage: 0,
      };
    }

    const kneeAngle = angles.kneeAngle.angleDegrees;
    const hipAngle = angles.hipAngle.angleDegrees;
    const torsoLean = angles.torsoLean;
    const now = Date.now();
    const isLastRep = this.correctReps === this.definition.targetReps - 1;

    // Cooldown window post rep completion
    if (now < this.repCooldownUntil) {
      return {
        movementState: 'REP_COMPLETE',
        repCompleted: false,
        activeIssues: Array.from(this.activeRepIssues.values()),
        feedbackMessage: this.depthAchieved && this.activeRepIssues.size === 0
          ? `EXCELLENT ${this.intensity} SQUAT REP!`
          : 'REP REJECTED — PLEASE REDO WITH CORRECT FORM!',
        feedbackType: this.depthAchieved && this.activeRepIssues.size === 0 ? 'GOOD' : 'ERROR',
        progressPercentage: 100,
      };
    }

    // Check posture error: Torso Lean > 35 degrees
    const hasLeanError = torsoLean > 35;
    const activeIssuesList: PostureIssue[] = [];

    if (hasLeanError) {
      const issue: PostureIssue = {
        id: `lean_${now}`,
        category: 'TORSO_LEAN',
        message: 'KEEP BACK STRAIGHT!',
        severity: 'error',
        timestamp: now,
      };
      this.activeRepIssues.set('TORSO_LEAN', issue);
      activeIssuesList.push(issue);
    }

    let repCompleted = false;
    let setFinished = false;
    let completedRecord: RepRecord | undefined = undefined;
    let feedbackMessage = `STAND TALL. READY FOR SQUAT (${this.intensity} MODE)`;
    let feedbackType: 'GOOD' | 'WARNING' | 'ERROR' | 'INSTRUCTION' = 'INSTRUCTION';

    // Calculate progress: 0% at standing 140° knee bend, 100% at targetAngle (125° Low, 105° Med, 90° High)
    const progressPercentage = Math.min(
      100,
      Math.max(0, Math.round(((140 - kneeAngle) / (140 - this.targetAngle)) * 100))
    );

    // STRICT LEG JOINT RULES (No false triggers from moving shoulders!):
    // Requires actual knee flexion (kneeAngle < 130°) AND hip flexion (hipAngle < 140°)
    const isStandingPosition = kneeAngle >= 138;
    const isRealSquatDown = kneeAngle < 130 && hipAngle < 140; // STRICT DUAL JOINT FLEXION GATE!
    const isTrueTargetAngleReached = kneeAngle <= this.targetAngle;

    let holdCountdownSecs = 5;

    switch (this.currentState) {
      case 'IDLE':
      case 'READY':
        if (isStandingPosition) {
          this.currentState = 'READY';
          feedbackMessage = isLastRep
            ? `LAST REP! SQUAT AND HOLD FOR 5 SECONDS!`
            : `READY. SQUAT DOWN TO <= ${this.targetAngle}°`;
          feedbackType = 'INSTRUCTION';
        } else if (isRealSquatDown) {
          // Triggers ONLY when knees AND hips flex together! Moving shoulders does NOTHING.
          this.currentState = 'DESCENDING';
          this.repStartTime = now;
          this.bottomTimestamp = now;
          this.startingKneeAngle = kneeAngle;
          this.minKneeAngleInRep = kneeAngle;
          this.minLeftKneeInRep = angles.leftKneeAngle;
          this.minRightKneeInRep = angles.rightKneeAngle;
          this.minLeftHipInRep = angles.leftHipAngle;
          this.minRightHipInRep = angles.rightHipAngle;
          this.maxTorsoLeanInRep = torsoLean;
          this.activeRepIssues.clear();
          this.depthAchieved = false;
          this.isHoldingLastRep = false;
          this.holdCompleted = false;
          feedbackMessage = `SQUATTING DOWN... BEND TO <= ${this.targetAngle}°`;
          feedbackType = 'INSTRUCTION';
        }
        break;

      case 'DESCENDING':
        this.minKneeAngleInRep = Math.min(this.minKneeAngleInRep, kneeAngle);
        this.minLeftKneeInRep = Math.min(this.minLeftKneeInRep, angles.leftKneeAngle);
        this.minRightKneeInRep = Math.min(this.minRightKneeInRep, angles.rightKneeAngle);
        this.minLeftHipInRep = Math.min(this.minLeftHipInRep, angles.leftHipAngle);
        this.minRightHipInRep = Math.min(this.minRightHipInRep, angles.rightHipAngle);
        this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);

        if (isTrueTargetAngleReached) {
          this.currentState = 'BOTTOM';
          this.bottomTimestamp = now;
          this.depthAchieved = true;

          if (isLastRep) {
            this.isHoldingLastRep = true;
            this.holdStartTimestamp = now;
            feedbackMessage = 'LAST REP! HOLD FOR 5 SECONDS!';
            feedbackType = 'GOOD';
          } else {
            feedbackMessage = `TARGET DEPTH REACHED! PUSH UP NOW`;
            feedbackType = 'GOOD';
          }
        } else if (kneeAngle > this.minKneeAngleInRep + 8) {
          this.currentState = 'ASCENDING';
          this.depthAchieved = false;
          feedbackMessage = `SHALLOW SQUAT! NEED TO GO LOWER`;
          feedbackType = 'ERROR';
        } else {
          feedbackMessage = `GO LOWER... TARGET: <= ${this.targetAngle}°`;
          feedbackType = 'INSTRUCTION';
        }
        break;

      case 'BOTTOM':
        this.minKneeAngleInRep = Math.min(this.minKneeAngleInRep, kneeAngle);
        this.minLeftKneeInRep = Math.min(this.minLeftKneeInRep, angles.leftKneeAngle);
        this.minRightKneeInRep = Math.min(this.minRightKneeInRep, angles.rightKneeAngle);
        this.minLeftHipInRep = Math.min(this.minLeftHipInRep, angles.leftHipAngle);
        this.minRightHipInRep = Math.min(this.minRightHipInRep, angles.rightHipAngle);
        this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);
        this.bottomTimestamp = now;

        if (isLastRep) {
          const elapsed = now - this.holdStartTimestamp;
          const remainingSecs = Math.max(0, Math.ceil((this.holdDurationMs - elapsed) / 1000));
          holdCountdownSecs = remainingSecs;

          if (elapsed >= this.holdDurationMs) {
            this.holdCompleted = true;
            this.isHoldingLastRep = false;
            if (kneeAngle > this.targetAngle + 8) {
              this.currentState = 'ASCENDING';
              feedbackMessage = 'HOLD COMPLETE! PUSH UP TO FINISH SET!';
              feedbackType = 'GOOD';
            } else {
              feedbackMessage = 'HOLD COMPLETE! NOW PUSH UP TO STANDING!';
              feedbackType = 'GOOD';
            }
          } else {
            this.isHoldingLastRep = true;
            feedbackMessage = `HOLD FOR 5 SECONDS! (${remainingSecs}s REMAINING)`;
            feedbackType = 'GOOD';
          }
        } else {
          if (kneeAngle > this.targetAngle + 8) {
            this.currentState = 'ASCENDING';
            feedbackMessage = 'PUSH UP TO STANDING!';
            feedbackType = 'INSTRUCTION';
          } else {
            feedbackMessage = `TARGET DEPTH REACHED! PUSH UP`;
            feedbackType = 'GOOD';
          }
        }
        break;

      case 'ASCENDING':
        this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);

        if (isStandingPosition) {
          this.currentState = 'REP_COMPLETE';
          repCompleted = true;
          this.repCooldownUntil = now + 1200;

          const issuesList = Array.from(this.activeRepIssues.values());
          const hasError = issuesList.some((i) => i.severity === 'error') || hasLeanError;
          const isCorrect = this.depthAchieved && !hasError;

          if (isCorrect) {
            // ONLY INCREMENT CORRECT REPS WHEN FORM IS 100% PERFECT!
            this.correctReps++;
            this.totalAttempts++;
            feedbackMessage = isLastRep ? 'FINAL REP COMPLETED! SET FINISHED!' : 'PERFECT SQUAT REP!';
            feedbackType = 'GOOD';

            if (this.correctReps >= this.definition.targetReps) {
              setFinished = true;
            }
          } else {
            // STRICT REDO RULE: DO NOT COUNT WRONG REPS!
            this.incorrectReps++;
            feedbackMessage = !this.depthAchieved
              ? `SHALLOW SQUAT REJECTED — REDO THIS REP!`
              : `FORM ERROR (LEANING FORWARD) — REDO THIS REP!`;
            feedbackType = 'ERROR';
          }

          const durationMs = now - this.repStartTime;
          const eccentricMs = Math.max(0, this.bottomTimestamp - this.repStartTime);
          const concentricMs = Math.max(0, now - this.bottomTimestamp);
          const asymmetry = Math.abs(this.minLeftKneeInRep - this.minRightKneeInRep);
          const rom = Math.max(0, this.startingKneeAngle - this.minKneeAngleInRep);
          const margin = this.targetAngle - this.minKneeAngleInRep;

          completedRecord = {
            repNumber: this.correctReps,
            isCorrect,
            maxKneeDepthAngle: Math.round(this.minKneeAngleInRep * 10) / 10,
            minTorsoAngle: Math.round(this.maxTorsoLeanInRep * 10) / 10,
            durationMs,
            issues: issuesList,
            timestamp: now,
            leftKneeAngle: Math.round(this.minLeftKneeInRep * 10) / 10,
            rightKneeAngle: Math.round(this.minRightKneeInRep * 10) / 10,
            leftHipAngle: Math.round(this.minLeftHipInRep * 10) / 10,
            rightHipAngle: Math.round(this.minRightHipInRep * 10) / 10,
            startingAngle: Math.round(this.startingKneeAngle * 10) / 10,
            peakFlexionAngle: Math.round(this.minKneeAngleInRep * 10) / 10,
            endingAngle: Math.round(kneeAngle * 10) / 10,
            rangeOfMotion: Math.round(rom * 10) / 10,
            targetThresholdAngle: this.targetAngle,
            angleMargin: Math.round(margin * 10) / 10,
            eccentricDurationMs: eccentricMs,
            concentricDurationMs: concentricMs,
            isometricDurationMs: isLastRep ? (now - this.holdStartTimestamp) : 0,
            asymmetryDegrees: Math.round(asymmetry * 10) / 10,
          };

          this.repHistory.push(completedRecord);
        } else {
          feedbackMessage = this.depthAchieved
            ? 'PUSH UP TO STANDING!'
            : `FORM ERROR! REDO THIS REP`;
          feedbackType = this.depthAchieved ? 'INSTRUCTION' : 'ERROR';
        }
        break;

      case 'REP_COMPLETE':
        if (isStandingPosition) {
          this.currentState = 'READY';
          feedbackMessage = `Ready for next rep. (${this.intensity} MODE)`;
          feedbackType = 'GOOD';
        }
        break;
    }

    if (hasLeanError) {
      feedbackMessage = 'KEEP BACK STRAIGHT! FORM ERROR';
      feedbackType = 'ERROR';
    }

    return {
      movementState: this.currentState,
      repCompleted,
      repRecord: completedRecord,
      activeIssues: activeIssuesList,
      feedbackMessage,
      feedbackType,
      progressPercentage,
      isHoldingLastRep: this.isHoldingLastRep,
      holdCountdownSeconds: holdCountdownSecs,
      setFinished,
    };
  }

  public reset(): void {
    this.currentState = 'IDLE';
    this.totalAttempts = 0;
    this.correctReps = 0;
    this.incorrectReps = 0;
    this.incompleteReps = 0;
    this.repHistory = [];
    this.activeRepIssues.clear();
    this.repCooldownUntil = 0;
    this.isHoldingLastRep = false;
    this.holdStartTimestamp = 0;
    this.holdCompleted = false;
  }

  public getMetrics() {
    const totalCompleted = this.correctReps + this.incorrectReps;
    const accuracy = totalCompleted > 0 ? Math.round((this.correctReps / totalCompleted) * 100) : 100;

    return {
      totalAttempts: this.totalAttempts,
      correctReps: this.correctReps,
      incorrectReps: this.incorrectReps,
      incompleteReps: this.incompleteReps,
      accuracy,
      repHistory: this.repHistory,
    };
  }
}
