import { PoseLandmark, LANDMARK_NAMES } from '../types/pose';
import { LandmarkSmoother } from '../utils/smoothing';

export class LandmarkProcessor {
  private smoother: LandmarkSmoother;

  constructor(smoothingAlpha: number = 0.65) {
    this.smoother = new LandmarkSmoother(smoothingAlpha);
  }

  public processRawLandmarks(rawLandmarks: any[]): PoseLandmark[] {
    if (!rawLandmarks || rawLandmarks.length === 0) {
      return [];
    }

    const parsed: PoseLandmark[] = rawLandmarks.map((lm: any, idx: number) => ({
      id: idx,
      name: LANDMARK_NAMES[idx] || `Landmark_${idx}`,
      x: lm.x,
      y: lm.y,
      z: lm.z ?? 0,
      visibility: lm.visibility ?? 1.0,
      presence: lm.presence ?? 1.0,
    }));

    return this.smoother.smooth(parsed);
  }

  public reset(): void {
    this.smoother.reset();
  }
}
