import { MovementState, PostureIssue, RepRecord } from './exercise';

export type SessionStatus = 
  | 'PERMISSIONS_PROMPT'
  | 'PERMISSIONS_DENIED'
  | 'CALIBRATION'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SUMMARY';

export type FeedbackType = 'GOOD' | 'WARNING' | 'ERROR' | 'INSTRUCTION';

export interface FeedbackMessage {
  id: string;
  type: FeedbackType;
  text: string;
  timestamp: number;
  spoken?: boolean;
}

export interface CalibrationStatus {
  cameraActive: boolean;
  personDetected: boolean;
  fullBodyVisible: boolean;
  confidenceGood: boolean;
  centered: boolean;
  readyToStart: boolean;
  warnings: string[];
}

export interface SessionMetrics {
  exerciseId: string;
  exerciseName: string;
  targetReps: number;
  totalAttempts: number;
  completedReps: number;
  correctReps: number;
  incorrectReps: number;
  incompleteReps: number;
  accuracy: number; // percentage 0-100
  movementQualityScore: number; // percentage 0-100
  durationSeconds: number;
  mostFrequentIssue: string | null;
  repHistory: RepRecord[];
}

export interface DevDebugInfo {
  fps: number;
  inferenceTimeMs: number;
  poseConfidence: number;
  landmarksCount: number;
  currentKneeAngle: number;
  currentHipAngle: number;
  currentTorsoAngle: number;
  movementState: MovementState;
  activeIssues: PostureIssue[];
  resolution: { width: number; height: number };
}
