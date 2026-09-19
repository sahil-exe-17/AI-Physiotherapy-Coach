import { PoseLandmark } from '../types/pose';
import { CalculatedAngles } from '../cv/angleCalculator';
import { MovementState, PostureIssue, RepRecord, ExerciseDefinition, IntensityLevel } from '../types/exercise';

export interface AnalysisFrameResult {
  movementState: MovementState;
  repCompleted: boolean;
  repRecord?: RepRecord;
  activeIssues: PostureIssue[];
  feedbackMessage: string;
  feedbackType: 'GOOD' | 'WARNING' | 'ERROR' | 'INSTRUCTION';
  progressPercentage: number;
  isHoldingLastRep?: boolean;
  holdCountdownSeconds?: number;
  setFinished?: boolean;
}

export interface IExerciseAnalyzer {
  definition: ExerciseDefinition;
  setIntensity?(intensity: IntensityLevel): void;
  processFrame(landmarks: PoseLandmark[], angles: CalculatedAngles): AnalysisFrameResult;
  reset(): void;
  getMetrics(): {
    totalAttempts: number;
    correctReps: number;
    incorrectReps: number;
    incompleteReps: number;
    accuracy: number;
    repHistory: RepRecord[];
  };
}
