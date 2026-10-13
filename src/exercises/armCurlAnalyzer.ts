import { PoseLandmark } from '../types/pose';
import { CalculatedAngles } from '../cv/angleCalculator';
import { MovementState, PostureIssue, RepRecord, ExerciseDefinition, IntensityLevel } from '../types/exercise';
import { IExerciseAnalyzer, AnalysisFrameResult } from './exerciseTypes';

export const DEFAULT_ARM_CURL_DEFINITION: ExerciseDefinition = {
  id: 'arm_curl',
  name: 'Bicep Curl',
  description: 'Upper-body bicep curl with foolproof peak-valley hysteresis tracking.',
  targetReps: 10,
  requiredLandmarks: [11, 12, 13, 14, 15, 16],
  relevantAngles: ['Elbow Angle', 'Shoulder Angle'],
  thresholds: {
    standingKneeAngleMin: 150,
    squatDepthKneeAngleMax: 60,
    shallowSquatAngleMax: 90,
    maxTorsoLeanAngle: 25,
    kneeValgusThreshold: 0.7,
    minConfidenceScore: 0.3,
  },
};

export class ArmCurlAnalyzer implements IExerciseAnalyzer {
  public definition: ExerciseDefinition;
  private currentState: MovementState = 'IDLE';
  private intensity: IntensityLevel = 'MEDIUM';

  private targetCurlAngle: number = 75; // Squeeze peak target angle
  private extensionThreshold: number = 105; // Extension release threshold

  private totalAttempts: number = 0;
  private correctReps: number = 0;
  private incorrectReps: number = 0;
  private incompleteReps: number = 0;
  private repHistory: RepRecord[] = [];

  private repStartTime: number = 0;
  private bottomTimestamp: number = 0;
  private startingElbowAngle: number = 140;
  private minElbowAngleInRep: number = 180;
  private minLeftElbowInRep: number = 180;
  private minRightElbowInRep: number = 180;
  private maxElbowAngleInRep: number = 0;

  private activeRepIssues: Map<string, PostureIssue> = new Map();
  private depthAchieved: boolean = false;
  private repCooldownUntil: number = 0;

  // Last Rep Isometric 5s Hold State
  private isHoldingLastRep: boolean = false;
  private holdStartTimestamp: number = 0;
  private holdDurationMs: number = 5000;

  constructor(definition: ExerciseDefinition = DEFAULT_ARM_CURL_DEFINITION) {
    this.definition = definition;
    this.setIntensity('MEDIUM');
  }

  public setIntensity(level: IntensityLevel): void {
    this.intensity = level;
    switch (level) {
      case 'LOW':
        this.targetCurlAngle = 85; // Low Mode: Squeeze <= 85°
        this.extensionThreshold = 125; // Extension threshold
        break;
      case 'HIGH':
        this.targetCurlAngle = 60; // High Mode: Squeeze <= 60°
        this.extensionThreshold = 135;
        break;
      case 'MEDIUM':
      default:
        this.targetCurlAngle = 75; // Med Mode: Squeeze <= 75°
        this.extensionThreshold = 130;
        break;
    }
  }

  public processFrame(landmarks: PoseLandmark[], angles: CalculatedAngles): AnalysisFrameResult {
    if (!landmarks || landmarks.length < 33 || !angles) {
      return {
        movementState: this.currentState,
        repCompleted: false,
        activeIssues: [],
        feedbackMessage: 'Position arms in camera view.',
        feedbackType: 'INSTRUCTION',
        progressPercentage: 0,
      };
    }

    // STRICT ARM VISIBILITY GATE
    if (angles.elbowAngle.confidence < 0.35) {
      this.currentState = 'IDLE';
      return {
        movementState: 'IDLE',
        repCompleted: false,
        activeIssues: [],
        feedbackMessage: 'Keep your arm, elbow, and wrist clearly visible.',
        feedbackType: 'INSTRUCTION',
        progressPercentage: 0,
      };
    }

    const elbowAngle = angles.elbowAngle.angleDegrees;
    const now = Date.now();
    const isLastRep = this.correctReps === this.definition.targetReps - 1;

    // Cooldown window post rep completion
    if (now < this.repCooldownUntil) {
      return {
        movementState: 'REP_COMPLETE',
        repCompleted: false,
        activeIssues: [],
        feedbackMessage: `EXCELLENT ${this.intensity} BICEP CURL!`,
        feedbackType: 'GOOD',
        progressPercentage: 100,
      };
    }

    let repCompleted = false;
    let setFinished = false;
    let completedRecord: RepRecord | undefined = undefined;
    let feedbackMessage = `EXTEND ARM DOWN. READY FOR CURL (${this.intensity} MODE)`;
    let feedbackType: 'GOOD' | 'WARNING' | 'ERROR' | 'INSTRUCTION' = 'INSTRUCTION';

    // Calculate progress (0% at extension, 100% at target)
    const progressPercentage = Math.min(
      100,
      Math.max(0, Math.round(((this.extensionThreshold - elbowAngle) / (this.extensionThreshold - this.targetCurlAngle)) * 100))
    );

    // Biomechanical gates:
    const isExtended = elbowAngle >= this.extensionThreshold;
    const isFlexingUp = elbowAngle < this.extensionThreshold - 15; // Must genuinely bend past extension
    const isPeakSqueezeReached = elbowAngle <= this.targetCurlAngle;

    let holdCountdownSecs = 5;

    switch (this.currentState) {
      case 'IDLE':
        if (isExtended) {
          this.currentState = 'READY';
          feedbackMessage = `READY. CURL HAND UP TOWARD SHOULDER`;
          feedbackType = 'INSTRUCTION';
        } else {
          feedbackMessage = `LOWER & STRAIGHTEN ARM TO START (>= ${this.extensionThreshold}°)`;
          feedbackType = 'INSTRUCTION';
        }
        break;

      case 'READY':
        if (isExtended) {
          feedbackMessage = isLastRep
            ? `LAST REP! CURL UP AND HOLD BICEP SQUEEZE FOR 5 SECONDS!`
            : `READY. CURL UP TO <= ${this.targetCurlAngle}° (${this.intensity} MODE)`;
          feedbackType = 'INSTRUCTION';
        } else if (isFlexingUp) {
          this.currentState = 'DESCENDING';
          this.repStartTime = now;
          this.bottomTimestamp = now;
          this.startingElbowAngle = elbowAngle;
          this.minElbowAngleInRep = elbowAngle;
          this.minLeftElbowInRep = angles.leftElbowAngle;
          this.minRightElbowInRep = angles.rightElbowAngle;
          this.maxElbowAngleInRep = elbowAngle;
          this.activeRepIssues.clear();
          this.depthAchieved = false;
          this.isHoldingLastRep = false;
          feedbackMessage = `CURLING UPWARD... SQUEEZE BICEP!`;
          feedbackType = 'INSTRUCTION';
        }
        break;

      case 'DESCENDING': // Flexing bicep upward
        this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, elbowAngle);
        this.minLeftElbowInRep = Math.min(this.minLeftElbowInRep, angles.leftElbowAngle);
        this.minRightElbowInRep = Math.min(this.minRightElbowInRep, angles.rightElbowAngle);

        if (isPeakSqueezeReached) {
          this.currentState = 'BOTTOM';
          this.bottomTimestamp = now;
          this.depthAchieved = true;

          if (isLastRep) {
            this.isHoldingLastRep = true;
            this.holdStartTimestamp = now;
            feedbackMessage = 'LAST REP! HOLD BICEP SQUEEZE FOR 5 SECONDS!';
            feedbackType = 'GOOD';
          } else {
            feedbackMessage = `PEAK BICEP SQUEEZE REACHED (${Math.round(elbowAngle)}°)! NOW LOWER ARM`;
            feedbackType = 'GOOD';
          }
        } else if (elbowAngle > this.minElbowAngleInRep + 20) {
          // Returned back down before reaching target curl angle
          this.currentState = 'ASCENDING';
          this.depthAchieved = false;
          feedbackMessage = `INCOMPLETE CURL! SQUEEZE HIGHER NEXT TIME`;
          feedbackType = 'ERROR';
        } else {
          feedbackMessage = `CURL HIGHER... TARGET: <= ${this.targetCurlAngle}° (CURRENT: ${Math.round(elbowAngle)}°)`;
          feedbackType = 'INSTRUCTION';
        }
        break;

      case 'BOTTOM': // Top of curl (Peak Squeeze)
        this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, elbowAngle);
        this.minLeftElbowInRep = Math.min(this.minLeftElbowInRep, angles.leftElbowAngle);
        this.minRightElbowInRep = Math.min(this.minRightElbowInRep, angles.rightElbowAngle);
        this.bottomTimestamp = now;

        if (isLastRep) {
          const elapsed = now - this.holdStartTimestamp;
          const remainingSecs = Math.max(0, Math.ceil((this.holdDurationMs - elapsed) / 1000));
          holdCountdownSecs = remainingSecs;

          if (elapsed >= this.holdDurationMs) {
            this.isHoldingLastRep = false;
            if (elbowAngle > this.targetCurlAngle + 15) {
              this.currentState = 'ASCENDING';
              feedbackMessage = 'HOLD COMPLETE! LOWER ARM TO FINISH SET!';
              feedbackType = 'GOOD';
            } else {
              feedbackMessage = 'HOLD COMPLETE! NOW EXTEND ARM DOWN!';
              feedbackType = 'GOOD';
            }
          } else {
            this.isHoldingLastRep = true;
            feedbackMessage = `HOLD BICEP SQUEEZE FOR 5 SECONDS! (${remainingSecs}s REMAINING)`;
            feedbackType = 'GOOD';
          }
        } else {
          if (elbowAngle > this.targetCurlAngle + 15) {
            this.currentState = 'ASCENDING';
            feedbackMessage = 'LOWER ARM UNDER CONTROL!';
            feedbackType = 'INSTRUCTION';
          } else {
            feedbackMessage = `PEAK SQUEEZE REACHED! LOWER ARM`;
            feedbackType = 'GOOD';
          }
        }
        break;

      case 'ASCENDING': // Lowering arm back down
        if (isExtended) {
          const durationMs = now - this.repStartTime;
          if (durationMs < 700) {
            this.currentState = 'READY';
            break;
          }

          this.currentState = 'REP_COMPLETE';
          repCompleted = true;
          this.repCooldownUntil = now + 1200;

          if (this.depthAchieved) {
            this.correctReps++;
            this.totalAttempts++;
            feedbackMessage = isLastRep ? 'FINAL BICEP CURL COMPLETED! SET FINISHED!' : 'PERFECT BICEP CURL!';
            feedbackType = 'GOOD';

            if (this.correctReps >= this.definition.targetReps) {
              setFinished = true;
            }
          } else {
            this.incorrectReps++;
            feedbackMessage = `INCOMPLETE CURL REJECTED — REDO THIS REP!`;
            feedbackType = 'ERROR';
          }

          const eccentricMs = Math.max(0, this.bottomTimestamp - this.repStartTime);
          const concentricMs = Math.max(0, now - this.bottomTimestamp);
          const asymmetry = Math.abs(this.minLeftElbowInRep - this.minRightElbowInRep);
          const rom = Math.max(0, this.startingElbowAngle - this.minElbowAngleInRep);
          const margin = this.targetCurlAngle - this.minElbowAngleInRep;

          completedRecord = {
            repNumber: this.correctReps,
            isCorrect: this.depthAchieved,
            maxKneeDepthAngle: Math.round(this.minElbowAngleInRep * 10) / 10,
            minTorsoAngle: 0,
            durationMs,
            issues: [],
            timestamp: now,
            leftElbowAngle: Math.round(this.minLeftElbowInRep * 10) / 10,
            rightElbowAngle: Math.round(this.minRightElbowInRep * 10) / 10,
            startingAngle: Math.round(this.startingElbowAngle * 10) / 10,
            peakFlexionAngle: Math.round(this.minElbowAngleInRep * 10) / 10,
            endingAngle: Math.round(elbowAngle * 10) / 10,
            rangeOfMotion: Math.round(rom * 10) / 10,
            targetThresholdAngle: this.targetCurlAngle,
            angleMargin: Math.round(margin * 10) / 10,
            eccentricDurationMs: eccentricMs,
            concentricDurationMs: concentricMs,
            isometricDurationMs: isLastRep ? (now - this.holdStartTimestamp) : 0,
            asymmetryDegrees: Math.round(asymmetry * 10) / 10,
          };

          this.repHistory.push(completedRecord);
        } else {
          feedbackMessage = this.depthAchieved
            ? 'EXTEND ARM ALL THE WAY DOWN!'
            : `INCOMPLETE CURL! REDO THIS REP`;
          feedbackType = this.depthAchieved ? 'INSTRUCTION' : 'ERROR';
        }
        break;

      case 'REP_COMPLETE':
        if (isExtended) {
          this.currentState = 'READY';
          feedbackMessage = `Ready for next rep. (${this.intensity} MODE)`;
          feedbackType = 'GOOD';
        }
        break;
    }

    return {
      movementState: this.currentState,
      repCompleted,
      repRecord: completedRecord,
      activeIssues: [],
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
