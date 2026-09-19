import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class PoseDetectorService {
  private static instance: PoseDetectorService | null = null;
  private landmarker: PoseLandmarker | null = null;
  private isInitializing: boolean = false;
  private initError: string | null = null;

  private constructor() {}

  public static getInstance(): PoseDetectorService {
    if (!PoseDetectorService.instance) {
      PoseDetectorService.instance = new PoseDetectorService();
    }
    return PoseDetectorService.instance;
  }

  public async initialize(): Promise<PoseLandmarker> {
    if (this.landmarker) {
      return this.landmarker;
    }

    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.landmarker) return this.landmarker;
      throw new Error(this.initError || 'Failed to initialize PoseLandmarker');
    }

    this.isInitializing = true;
    this.initError = null;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Fast, ultra-lightweight PoseLandmarker model for 60 FPS zero-lag tracking
      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.45,
        minPosePresenceConfidence: 0.45,
        minTrackingConfidence: 0.45,
      });

      this.isInitializing = false;
      return this.landmarker;
    } catch (err: any) {
      console.warn('GPU PoseLandmarker failed, trying CPU fallback:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
        this.isInitializing = false;
        return this.landmarker;
      } catch (cpuErr: any) {
        this.isInitializing = false;
        this.initError = cpuErr?.message || 'Failed to load MediaPipe Pose model.';
        throw cpuErr;
      }
    }
  }

  public detectForVideo(video: HTMLVideoElement, timestampMs: number) {
    if (!this.landmarker) {
      throw new Error('PoseLandmarker is not initialized');
    }
    return this.landmarker.detectForVideo(video, timestampMs);
  }

  public isReady(): boolean {
    return this.landmarker !== null;
  }

  public getError(): string | null {
    return this.initError;
  }
}
