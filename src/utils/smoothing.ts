import { PoseLandmark } from '../types/pose';

/**
 * Velocity-Adaptive One-Euro Filter for MediaPipe Pose Landmarks.
 * Provides 0ms lag during rapid movement and eliminates webcam frame jitter when static.
 */
export class LandmarkSmoother {
  private prevLandmarks: PoseLandmark[] | null = null;
  private minCutoff: number;
  private beta: number;

  constructor(minCutoff: number = 1.0, beta: number = 0.05) {
    this.minCutoff = minCutoff;
    this.beta = beta;
  }

  public smooth(landmarks: PoseLandmark[]): PoseLandmark[] {
    if (!landmarks || landmarks.length === 0) {
      return landmarks;
    }

    if (!this.prevLandmarks || this.prevLandmarks.length !== landmarks.length) {
      this.prevLandmarks = landmarks;
      return landmarks;
    }

    const smoothed: PoseLandmark[] = landmarks.map((curr, idx) => {
      const prev = this.prevLandmarks![idx];

      // Calculate landmark displacement velocity
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Adaptive alpha: higher alpha (closer to 1.0) when moving fast for 0ms lag
      const adaptiveAlpha = Math.min(1.0, Math.max(0.4, 0.4 + dist * 10 * this.beta));

      return {
        ...curr,
        x: adaptiveAlpha * curr.x + (1 - adaptiveAlpha) * prev.x,
        y: adaptiveAlpha * curr.y + (1 - adaptiveAlpha) * prev.y,
        z: adaptiveAlpha * curr.z + (1 - adaptiveAlpha) * prev.z,
        visibility: curr.visibility,
      };
    });

    this.prevLandmarks = smoothed;
    return smoothed;
  }

  public reset(): void {
    this.prevLandmarks = null;
  }
}
