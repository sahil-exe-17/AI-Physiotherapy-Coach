import { PoseLandmark, LANDMARK_INDEX } from '../types/pose';
import { PostureIssue, ThresholdConfig } from '../types/exercise';
import { CalculatedAngles } from './angleCalculator';
import { distance2D } from '../utils/geometry';

export class PoseValidator {
  public validateSquatForm(
    landmarks: PoseLandmark[],
    angles: CalculatedAngles,
    thresholds: ThresholdConfig,
    currentState: string
  ): PostureIssue[] {
    const issues: PostureIssue[] = [];
    const now = Date.now();

    if (!landmarks || landmarks.length < 33 || !angles) return issues;

    // 1. Excessive Torso Lean Check
    if (angles.torsoLean > thresholds.maxTorsoLeanAngle) {
      issues.push({
        id: `torso_lean_${now}`,
        category: 'TORSO_LEAN',
        message: 'Keep your back straighter. Avoid excessive forward lean.',
        severity: 'warning',
        timestamp: now,
      });
    }

    // 2. Knee Alignment / Valgus Check (Knees caving inward)
    const leftKnee = landmarks[LANDMARK_INDEX.LEFT_KNEE];
    const rightKnee = landmarks[LANDMARK_INDEX.RIGHT_KNEE];
    const leftAnkle = landmarks[LANDMARK_INDEX.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARK_INDEX.RIGHT_ANKLE];

    if (leftKnee && rightKnee && leftAnkle && rightAnkle) {
      const kneeDist = distance2D(leftKnee, rightKnee);
      const ankleDist = distance2D(leftAnkle, rightAnkle);

      // If knees are significantly closer than ankles during deep bend, flag knee valgus
      if (angles.kneeAngle.angleDegrees < 130 && kneeDist < ankleDist * 0.7) {
        issues.push({
          id: `knee_valgus_${now}`,
          category: 'KNEE_VALGUS',
          message: 'Keep knees aligned with your toes. Avoid knees caving inward.',
          severity: 'error',
          timestamp: now,
        });
      }
    }

    // 3. Insufficient Depth Check during bottom transition
    if (currentState === 'BOTTOM' && angles.kneeAngle.angleDegrees > thresholds.shallowSquatAngleMax) {
      issues.push({
        id: `depth_${now}`,
        category: 'INSUFFICIENT_DEPTH',
        message: 'Go slightly lower to achieve full rep depth.',
        severity: 'warning',
        timestamp: now,
      });
    }

    return issues;
  }
}
