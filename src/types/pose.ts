export interface PoseLandmark {
  id: number;
  name: string;
  x: number; // Normalized [0, 1]
  y: number; // Normalized [0, 1]
  z: number; // World depth relative to hip midpoint
  visibility: number; // [0, 1]
  presence?: number; // [0, 1]
}

export type PoseStatus = 'GOOD' | 'WARNING' | 'ERROR' | 'UNKNOWN';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface JointAngleResult {
  jointName: string;
  angleDegrees: number;
  label: string;
  status: PoseStatus;
  points: {
    a: Point2D;
    b: Point2D;
    c: Point2D;
  };
  confidence: number;
}

export interface SkeletonConnection {
  from: number;
  to: number;
  name: string;
  group: 'torso' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg' | 'head';
}

// MediaPipe 33 Landmark Indices
export const LANDMARK_INDEX = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export const LANDMARK_NAMES: { [key: number]: string } = {
  0: 'Nose',
  2: 'Left Eye',
  5: 'Right Eye',
  7: 'Left Ear',
  8: 'Right Ear',
  9: 'Mouth Left',
  10: 'Mouth Right',
  11: 'Left Shoulder',
  12: 'Right Shoulder',
  13: 'Left Elbow',
  14: 'Right Elbow',
  15: 'Left Wrist',
  16: 'Right Wrist',
  23: 'Left Hip',
  24: 'Right Hip',
  25: 'Left Knee',
  26: 'Right Knee',
  27: 'Left Ankle',
  28: 'Right Ankle',
  29: 'Left Heel',
  30: 'Right Heel',
  31: 'Left Toe',
  32: 'Right Toe',
};

// Skeleton connections for canvas rendering
export const SKELETON_CONNECTIONS: SkeletonConnection[] = [
  // Face Contour & Connections
  { from: 0, to: 1, name: 'nose_left_eye_inner', group: 'head' },
  { from: 1, to: 2, name: 'left_eye_inner_eye', group: 'head' },
  { from: 2, to: 3, name: 'left_eye_eye_outer', group: 'head' },
  { from: 3, to: 7, name: 'left_eye_outer_ear', group: 'head' },

  { from: 0, to: 4, name: 'nose_right_eye_inner', group: 'head' },
  { from: 4, to: 5, name: 'right_eye_inner_eye', group: 'head' },
  { from: 5, to: 6, name: 'right_eye_eye_outer', group: 'head' },
  { from: 6, to: 8, name: 'right_eye_outer_ear', group: 'head' },

  { from: 9, to: 10, name: 'mouth', group: 'head' },

  // Torso
  { from: 11, to: 12, name: 'shoulders', group: 'torso' },
  { from: 11, to: 23, name: 'left_torso', group: 'torso' },
  { from: 12, to: 24, name: 'right_torso', group: 'torso' },
  { from: 23, to: 24, name: 'hips', group: 'torso' },

  // Left Arm
  { from: 11, to: 13, name: 'left_upper_arm', group: 'left_arm' },
  { from: 13, to: 15, name: 'left_lower_arm', group: 'left_arm' },

  // Right Arm
  { from: 12, to: 14, name: 'right_upper_arm', group: 'right_arm' },
  { from: 14, to: 16, name: 'right_lower_arm', group: 'right_arm' },

  // Left Leg
  { from: 23, to: 25, name: 'left_thigh', group: 'left_leg' },
  { from: 25, to: 27, name: 'left_shin', group: 'left_leg' },
  { from: 27, to: 29, name: 'left_heel', group: 'left_leg' },
  { from: 29, to: 31, name: 'left_foot', group: 'left_leg' },

  // Right Leg
  { from: 24, to: 26, name: 'right_thigh', group: 'right_leg' },
  { from: 26, to: 28, name: 'right_shin', group: 'right_leg' },
  { from: 28, to: 30, name: 'right_heel', group: 'right_leg' },
  { from: 30, to: 32, name: 'right_foot', group: 'right_leg' },
];
