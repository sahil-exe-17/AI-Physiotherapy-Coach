import { SessionMetrics } from '../types/session';
import { RepRecord, PostureIssue } from '../types/exercise';

export class SessionService {
  public static calculateSummaryMetrics(
    exerciseId: string,
    exerciseName: string,
    targetReps: number,
    totalAttempts: number,
    correctReps: number,
    incorrectReps: number,
    incompleteReps: number,
    repHistory: RepRecord[],
    durationSeconds: number
  ): SessionMetrics {
    const totalCompleted = correctReps + incorrectReps;
    const accuracy = totalCompleted > 0 ? Math.round((correctReps / totalCompleted) * 100) : 0;

    // Count frequency of posture issues
    const issueCounts: { [message: string]: number } = {};
    repHistory.forEach((rep) => {
      rep.issues.forEach((issue) => {
        issueCounts[issue.message] = (issueCounts[issue.message] || 0) + 1;
      });
    });

    let mostFrequentIssue: string | null = null;
    let maxCount = 0;
    Object.entries(issueCounts).forEach(([msg, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentIssue = msg;
      }
    });

    // Movement quality score (weighted by accuracy & depth quality)
    const movementQualityScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          accuracy * 0.7 + (totalCompleted / Math.max(1, totalAttempts)) * 30
        )
      )
    );

    return {
      exerciseId,
      exerciseName,
      targetReps,
      totalAttempts,
      completedReps: totalCompleted,
      correctReps,
      incorrectReps,
      incompleteReps,
      accuracy,
      movementQualityScore,
      durationSeconds,
      mostFrequentIssue,
      repHistory,
    };
  }
}
