import { PoseLandmark, JointAngleResult, LANDMARK_INDEX, PoseStatus } from '../types/pose';
import { calculateJointAngle, calculateAngleWithVertical } from '../utils/geometry';

export interface CalculatedAngles {
  kneeAngle: JointAngleResult;
  hipAngle: JointAngleResult;
  torsoAngle: JointAngleResult;
  elbowAngle: JointAngleResult;
  shoulderAngle: JointAngleResult;
  leftKneeAngle: number;
  rightKneeAngle: number;
  leftHipAngle: number;
  rightHipAngle: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  torsoLean: number;
}

export class AngleCalculator {
  public calculateAll(landmarks: PoseLandmark[]): CalculatedAngles | null {
    if (!landmarks || landmarks.length < 33) return null;

    const leftShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];
    const leftElbow = landmarks[LANDMARK_INDEX.LEFT_ELBOW];
    const rightElbow = landmarks[LANDMARK_INDEX.RIGHT_ELBOW];
    let leftWrist = landmarks[LANDMARK_INDEX.LEFT_WRIST];
    let rightWrist = landmarks[LANDMARK_INDEX.RIGHT_WRIST];
    let leftHip = landmarks[LANDMARK_INDEX.LEFT_HIP];
    let rightHip = landmarks[LANDMARK_INDEX.RIGHT_HIP];
    let leftKnee = landmarks[LANDMARK_INDEX.LEFT_KNEE];
    let rightKnee = landmarks[LANDMARK_INDEX.RIGHT_KNEE];
    let leftAnkle = landmarks[LANDMARK_INDEX.LEFT_ANKLE];
    let rightAnkle = landmarks[LANDMARK_INDEX.RIGHT_ANKLE];

    // Check visibility for arms and legs
    const leftArmVis = Math.min(leftShoulder?.visibility ?? 0, leftElbow?.visibility ?? 0, leftWrist?.visibility ?? 0);
    const rightArmVis = Math.min(rightShoulder?.visibility ?? 0, rightElbow?.visibility ?? 0, rightWrist?.visibility ?? 0);
    const leftLegVis = Math.min(leftHip?.visibility ?? 0, leftKnee?.visibility ?? 0, leftAnkle?.visibility ?? 0);
    const rightLegVis = Math.min(rightHip?.visibility ?? 0, rightKnee?.visibility ?? 0, rightAnkle?.visibility ?? 0);

    // 1. Knee Angles (Hip -> Knee -> Ankle)
    const leftKneeAngle = calculateJointAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle);

    // 2. Hip Angles (Shoulder -> Hip -> Knee)
    const leftHipAngle = calculateJointAngle(leftShoulder, leftHip, leftKnee);
    const rightHipAngle = calculateJointAngle(rightShoulder, rightHip, rightKnee);

    // 3. Elbow Angles (Shoulder -> Elbow -> Wrist)
    const leftElbowAngle = calculateJointAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateJointAngle(rightShoulder, rightElbow, rightWrist);

    // 4. Shoulder Angles (Hip -> Shoulder -> Elbow)
    const leftShoulderAngle = calculateJointAngle(leftHip, leftShoulder, leftElbow);
    const rightShoulderAngle = calculateJointAngle(rightHip, rightShoulder, rightElbow);

    // Torso Lean Angle
    const midHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };
    const midShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    const torsoLean = calculateAngleWithVertical(midHip, midShoulder);

    // Select active arm (pick arm with good visibility and flexion)
    const activeArmVis = Math.max(leftArmVis, rightArmVis);
    const useLeftArm = leftArmVis >= 0.35 && (rightArmVis < 0.35 || leftElbowAngle <= rightElbowAngle);

    const primaryElbowAngle = useLeftArm ? leftElbowAngle : rightElbowAngle;
    const primaryShoulderAngle = useLeftArm ? leftShoulderAngle : rightShoulderAngle;

    const activeLegVis = Math.max(leftLegVis, rightLegVis);
    const useLeftLeg = leftLegVis >= rightLegVis;
    const primaryKneeAngle = useLeftLeg ? leftKneeAngle : rightKneeAngle;
    const primaryHipAngle = useLeftLeg ? leftHipAngle : rightHipAngle;

    const determineKneeStatus = (angle: number): PoseStatus => {
      if (activeLegVis < 0.35) return 'UNKNOWN';
      if (angle <= 105) return 'GOOD';
      if (angle <= 135) return 'WARNING';
      return 'UNKNOWN';
    };

    return {
      kneeAngle: {
        jointName: 'kneeAngle',
        label: 'Knee Angle',
        angleDegrees: primaryKneeAngle,
        status: determineKneeStatus(primaryKneeAngle),
        confidence: activeLegVis,
        points: {
          a: useLeftLeg ? leftHip : rightHip,
          b: useLeftLeg ? leftKnee : rightKnee,
          c: useLeftLeg ? leftAnkle : rightAnkle,
        },
      },
      hipAngle: {
        jointName: 'hipAngle',
        label: 'Hip Angle',
        angleDegrees: primaryHipAngle,
        status: 'UNKNOWN',
        confidence: activeLegVis,
        points: {
          a: useLeftLeg ? leftShoulder : rightShoulder,
          b: useLeftLeg ? leftHip : rightHip,
          c: useLeftLeg ? leftKnee : rightKnee,
        },
      },
      torsoAngle: {
        jointName: 'torsoAngle',
        label: 'Torso Lean',
        angleDegrees: torsoLean,
        status: torsoLean > 35 ? 'ERROR' : 'GOOD',
        confidence: Math.min(leftShoulder?.visibility ?? 0, rightShoulder?.visibility ?? 0),
        points: {
          a: midShoulder,
          b: midHip,
          c: { x: midHip.x, y: midHip.y + 0.5 },
        },
      },
      elbowAngle: {
        jointName: 'elbowAngle',
        label: 'Elbow Angle',
        angleDegrees: primaryElbowAngle,
        status: 'GOOD',
        confidence: activeArmVis,
        points: {
          a: useLeftArm ? leftShoulder : rightShoulder,
          b: useLeftArm ? leftElbow : rightElbow,
          c: useLeftArm ? leftWrist : rightWrist,
        },
      },
      shoulderAngle: {
        jointName: 'shoulderAngle',
        label: 'Shoulder Angle',
        angleDegrees: primaryShoulderAngle,
        status: 'GOOD',
        confidence: activeArmVis,
        points: {
          a: useLeftArm ? leftHip : rightHip,
          b: useLeftArm ? leftShoulder : rightShoulder,
          c: useLeftArm ? leftElbow : rightElbow,
        },
      },
      leftKneeAngle,
      rightKneeAngle,
      leftHipAngle,
      rightHipAngle,
      leftElbowAngle,
      rightElbowAngle,
      torsoLean,
    };
  }
}
