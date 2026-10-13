import { PoseLandmark } from '../types/pose';
import { CalculatedAngles } from '../cv/angleCalculator';
import { MovementState, PostureIssue, RepRecord, ExerciseDefinition, IntensityLevel } from '../types/exercise';
import { IExerciseAnalyzer, AnalysisFrameResult } from './exerciseTypes';

export class GenericRehabAnalyzer implements IExerciseAnalyzer {
  public definition: ExerciseDefinition;
  private currentState: MovementState = 'IDLE';
  private intensity: IntensityLevel = 'MEDIUM';

  private totalAttempts: number = 0;
  private correctReps: number = 0;
  private incorrectReps: number = 0;
  private incompleteReps: number = 0;
  private repHistory: RepRecord[] = [];

  private repStartTime: number = 0;
  private repCooldownUntil: number = 0;
  private peakFlexionAngle: number = 180;
  private startingAngle: number = 0;
  private depthAchieved: boolean = false;

  constructor(definition: ExerciseDefinition) {
    this.definition = definition;
  }

  public setIntensity(intensity: IntensityLevel): void {
    this.intensity = intensity;
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

    const now = Date.now();
    const isLastRep = this.correctReps === this.definition.targetReps - 1;

    if (now < this.repCooldownUntil) {
      return {
        movementState: 'REP_COMPLETE',
        repCompleted: false,
        activeIssues: [],
        feedbackMessage: `EXCELLENT ${this.definition.name.toUpperCase()} REP!`,
        feedbackType: 'GOOD',
        progressPercentage: 100,
      };
    }

    let currentAngle = 0;
    let targetAngle = 90;
    let baselineAngle = 30;
    let isMovingTowardsTarget = false;
    let isBackAtBaseline = false;

    // Adapt to specific exercise kinematics
    if (this.definition.id === 'shoulder_raise') {
      currentAngle = angles.shoulderAngle.angleDegrees;
      baselineAngle = 30;
      targetAngle = this.intensity === 'LOW' ? 70 : this.intensity === 'HIGH' ? 100 : 85;
      isMovingTowardsTarget = currentAngle >= targetAngle - 5;
      isBackAtBaseline = currentAngle <= baselineAngle + 15;
    } else if (this.definition.id === 'knee_extension') {
      currentAngle = angles.kneeAngle.angleDegrees;
      baselineAngle = 95; // Seated bent knee
      targetAngle = this.intensity === 'LOW' ? 145 : this.intensity === 'HIGH' ? 170 : 160; // Straight leg
      isMovingTowardsTarget = currentAngle >= targetAngle - 8;
      isBackAtBaseline = currentAngle <= baselineAngle + 12;
    } else if (this.definition.id === 'straight_leg_raise') {
      currentAngle = angles.hipAngle.angleDegrees;
      baselineAngle = 170; // Flat leg
      targetAngle = this.intensity === 'LOW' ? 140 : this.intensity === 'HIGH' ? 115 : 130; // Leg raised
      isMovingTowardsTarget = currentAngle <= targetAngle + 10;
      isBackAtBaseline = currentAngle >= baselineAngle - 15;
    } else {
      // bicycle_exercise or generic
      currentAngle = angles.hipAngle.angleDegrees;
      baselineAngle = 160;
      targetAngle = 110;
      isMovingTowardsTarget = currentAngle <= targetAngle + 10;
      isBackAtBaseline = currentAngle >= baselineAngle - 15;
    }

    let repCompleted = false;
    let setFinished = false;
    let completedRecord: RepRecord | undefined = undefined;
    let feedbackMessage = `Ready for ${this.definition.name}`;
    let feedbackType: 'GOOD' | 'WARNING' | 'ERROR' | 'INSTRUCTION' = 'INSTRUCTION';

    // Calculate progress %
    const totalSpan = Math.abs(targetAngle - baselineAngle) || 1;
    const progressFromBase = Math.abs(currentAngle - baselineAngle);
    const progressPercentage = Math.min(100, Math.max(0, Math.round((progressFromBase / totalSpan) * 100)));

    switch (this.currentState) {
      case 'IDLE':
      case 'READY':
        if (isBackAtBaseline) {
          this.currentState = 'READY';
          feedbackMessage = `READY. Begin ${this.definition.name}`;
          feedbackType = 'INSTRUCTION';
        } else {
          this.currentState = 'DESCENDING';
          this.repStartTime = now;
          this.startingAngle = currentAngle;
          this.peakFlexionAngle = currentAngle;
          this.depthAchieved = false;
          feedbackMessage = `Performing ${this.definition.name}...`;
          feedbackType = 'INSTRUCTION';
        }
        break;

      case 'DESCENDING': // Active contraction toward target
        this.peakFlexionAngle = currentAngle;
        if (isMovingTowardsTarget) {
          this.currentState = 'BOTTOM';
          this.depthAchieved = true;
          feedbackMessage = `Target range reached! Return smoothly to start`;
          feedbackType = 'GOOD';
        } else {
          feedbackMessage = `Reach toward target angle (${targetAngle}°)`;
          feedbackType = 'INSTRUCTION';
        }
        break;

      case 'BOTTOM': // Peak contraction
        if (!isMovingTowardsTarget) {
          this.currentState = 'ASCENDING';
          feedbackMessage = `Return to starting baseline position`;
          feedbackType = 'INSTRUCTION';
        }
        break;

      case 'ASCENDING': // Returning to start
        if (isBackAtBaseline) {
          const durationMs = now - this.repStartTime;
          if (durationMs < 700) {
            this.currentState = 'READY';
            break;
          }

          this.currentState = 'REP_COMPLETE';
          repCompleted = true;
          this.repCooldownUntil = now + 1000;

          if (this.depthAchieved) {
            this.correctReps++;
            this.totalAttempts++;
            feedbackMessage = isLastRep ? 'FINAL REP COMPLETED!' : `GOOD ${this.definition.name.toUpperCase()} REP!`;
            feedbackType = 'GOOD';

            if (this.correctReps >= this.definition.targetReps) {
              setFinished = true;
            }
          } else {
            this.incorrectReps++;
            feedbackMessage = 'Incomplete range — try full movement!';
            feedbackType = 'ERROR';
          }

          completedRecord = {
            repNumber: this.correctReps,
            isCorrect: this.depthAchieved,
            maxKneeDepthAngle: Math.round(this.peakFlexionAngle),
            minTorsoAngle: 0,
            durationMs,
            issues: [],
            timestamp: now,
          };
          this.repHistory.push(completedRecord);
        }
        break;

      case 'REP_COMPLETE':
        if (isBackAtBaseline) {
          this.currentState = 'READY';
          feedbackMessage = 'Ready for next rep.';
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
    this.repCooldownUntil = 0;
    this.depthAchieved = false;
  }

  public getMetrics() {
    const total = this.correctReps + this.incorrectReps;
    return {
      totalAttempts: this.totalAttempts,
      correctReps: this.correctReps,
      incorrectReps: this.incorrectReps,
      incompleteReps: this.incompleteReps,
      accuracy: total > 0 ? Math.round((this.correctReps / total) * 100) : 100,
      repHistory: this.repHistory,
    };
  }
}
