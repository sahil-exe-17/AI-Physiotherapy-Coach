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

    // Synthesize wrists if hidden/cropped under desk or off-screen
    if (!leftWrist || leftWrist.visibility < 0.2) {
      leftWrist = {
        ...leftElbow,
        y: Math.min(1.0, leftElbow.y + 0.25),
        visibility: 0.7,
      };
    }
    if (!rightWrist || rightWrist.visibility < 0.2) {
      rightWrist = {
        ...rightElbow,
        y: Math.min(1.0, rightElbow.y + 0.25),
        visibility: 0.7,
      };
    }

    // Synthesize hips if off-screen
    if (!leftHip || leftHip.visibility < 0.2) {
      leftHip = {
        ...leftShoulder,
        y: Math.min(1.0, leftShoulder.y + 0.35),
        visibility: 0.7,
      };
    }
    if (!rightHip || rightHip.visibility < 0.2) {
      rightHip = {
        ...rightShoulder,
        y: Math.min(1.0, rightShoulder.y + 0.35),
        visibility: 0.7,
      };
    }

    // Synthesize knees if off-screen
    if (!leftKnee || leftKnee.visibility < 0.2) {
      leftKnee = {
        ...leftHip,
        y: Math.min(1.0, leftHip.y + 0.35),
        visibility: 0.7,
      };
    }
    if (!rightKnee || rightKnee.visibility < 0.2) {
      rightKnee = {
        ...rightHip,
        y: Math.min(1.0, rightHip.y + 0.35),
        visibility: 0.7,
      };
    }

    // Synthesize ankles if off-screen
    if (!leftAnkle || leftAnkle.visibility < 0.2) {
      leftAnkle = {
        ...leftKnee,
        y: Math.min(1.0, leftKnee.y + 0.35),
        visibility: 0.7,
      };
    }
    if (!rightAnkle || rightAnkle.visibility < 0.2) {
      rightAnkle = {
        ...rightKnee,
        y: Math.min(1.0, rightKnee.y + 0.35),
        visibility: 0.7,
      };
    }

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

    // Select active arm (pick arm with smaller elbow angle during curl)
    const useLeftArm = leftElbowAngle <= rightElbowAngle;

    const primaryElbowAngle = Math.min(leftElbowAngle, rightElbowAngle);
    const primaryShoulderAngle = useLeftArm ? leftShoulderAngle : rightShoulderAngle;

    const leftLegVis = (leftHip.visibility + leftKnee.visibility) / 2;
    const rightLegVis = (rightHip.visibility + rightKnee.visibility) / 2;
    const useLeftLeg = leftLegVis >= rightLegVis;
    const primaryKneeAngle = useLeftLeg ? leftKneeAngle : rightKneeAngle;
    const primaryHipAngle = useLeftLeg ? leftHipAngle : rightHipAngle;

    const determineKneeStatus = (angle: number): PoseStatus => {
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
        confidence: Math.max(leftLegVis, rightLegVis),
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
        confidence: Math.max(leftLegVis, rightLegVis),
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
        confidence: 0.9,
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
        confidence: 0.9,
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
        confidence: 0.9,
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
