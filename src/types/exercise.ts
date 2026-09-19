import { PoseLandmark, JointAngleResult } from './pose';

export type IntensityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type MovementState = 
  | 'IDLE' 
  | 'READY' 
  | 'DESCENDING' 
  | 'BOTTOM' 
  | 'ASCENDING' 
  | 'REP_COMPLETE';

export type PostureSeverity = 'info' | 'warning' | 'error';

export type PostureIssueCategory = 
  | 'INSUFFICIENT_DEPTH' 
  | 'TORSO_LEAN' 
  | 'KNEE_VALGUS' 
  | 'UNSTABLE_SPEED' 
  | 'INCOMPLETE_REP'
  | 'FULL_BODY_NOT_VISIBLE'
  | 'LOW_CONFIDENCE';

export interface PostureIssue {
  id: string;
  category: PostureIssueCategory;
  message: string;
  severity: PostureSeverity;
  timestamp: number;
}

export interface RepRecord {
  repNumber: number;
  isCorrect: boolean;
  maxKneeDepthAngle: number;
  minTorsoAngle: number;
  durationMs: number;
  issues: PostureIssue[];
  timestamp: number;
  // Biomechanical Angle & Symmetry Metrics
  leftKneeAngle?: number;
  rightKneeAngle?: number;
  leftHipAngle?: number;
  rightHipAngle?: number;
  leftElbowAngle?: number;
  rightElbowAngle?: number;
  startingAngle?: number;
  peakFlexionAngle?: number;
  endingAngle?: number;
  rangeOfMotion?: number;
  targetThresholdAngle?: number;
  angleMargin?: number;
  eccentricDurationMs?: number;
  concentricDurationMs?: number;
  isometricDurationMs?: number;
  asymmetryDegrees?: number;
}

export interface ThresholdConfig {
  standingKneeAngleMin: number;
  squatDepthKneeAngleMax: number;
  shallowSquatAngleMax: number;
  maxTorsoLeanAngle: number;
  kneeValgusThreshold: number;
  minConfidenceScore: number;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  description: string;
  targetReps: number;
  requiredLandmarks: number[];
  relevantAngles: string[];
  thresholds: ThresholdConfig;
}
