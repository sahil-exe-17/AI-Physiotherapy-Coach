import { CalculatedAngles } from './angleCalculator';

export type DetectedExerciseType = 'squat' | 'arm_curl' | 'unknown';

export interface ExerciseMismatchResult {
  isMismatch: boolean;
  detectedExercise: DetectedExerciseType;
  warningMessage: string | null;
}

export class ExerciseClassifier {
  private elbowAngleHistory: number[] = [];
  private kneeAngleHistory: number[] = [];
  private maxHistory: number = 30; // ~1 second history window

  public checkMismatch(
    activeExerciseId: string,
    angles: CalculatedAngles | null
  ): ExerciseMismatchResult {
    if (!angles) {
      return { isMismatch: false, detectedExercise: 'unknown', warningMessage: null };
    }

    const elbowAngle = angles.elbowAngle.angleDegrees;
    const kneeAngle = angles.kneeAngle.angleDegrees;

    this.elbowAngleHistory.push(elbowAngle);
    this.kneeAngleHistory.push(kneeAngle);

    if (this.elbowAngleHistory.length > this.maxHistory) {
      this.elbowAngleHistory.shift();
      this.kneeAngleHistory.shift();
    }

    if (this.elbowAngleHistory.length < 15) {
      return { isMismatch: false, detectedExercise: 'unknown', warningMessage: null };
    }

    // Calculate Movement Ranges over the 1-second window
    const minElbow = Math.min(...this.elbowAngleHistory);
    const maxElbow = Math.max(...this.elbowAngleHistory);
    const elbowRange = maxElbow - minElbow;

    const minKnee = Math.min(...this.kneeAngleHistory);
    const maxKnee = Math.max(...this.kneeAngleHistory);
    const kneeRange = maxKnee - minKnee;

    // Detect if user is performing Bicep Curls (Elbow range > 45° while knee range < 15°)
    const isDoingBicepCurl = elbowRange >= 45 && kneeRange < 20;

    // Detect if user is performing Squats (Knee range > 35° while elbow range < 25°)
    const isDoingSquat = kneeRange >= 35 && elbowRange < 25;

    if (activeExerciseId === 'squat' && isDoingBicepCurl) {
      return {
        isMismatch: true,
        detectedExercise: 'arm_curl',
        warningMessage: '🚨 WRONG EXERCISE! BICEP CURL DETECTED WHILE SQUAT IS SELECTED!',
      };
    }

    if (activeExerciseId === 'arm_curl' && isDoingSquat) {
      return {
        isMismatch: true,
        detectedExercise: 'squat',
        warningMessage: '🚨 WRONG EXERCISE! SQUAT DETECTED WHILE BICEP CURL IS SELECTED!',
      };
    }

    return {
      isMismatch: false,
      detectedExercise: isDoingSquat ? 'squat' : isDoingBicepCurl ? 'arm_curl' : 'unknown',
      warningMessage: null,
    };
  }

  public reset(): void {
    this.elbowAngleHistory = [];
    this.kneeAngleHistory = [];
  }
}
