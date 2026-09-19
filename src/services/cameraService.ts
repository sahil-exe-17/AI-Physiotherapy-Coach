export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export class CameraService {
  private activeStream: MediaStream | null = null;

  public async getAvailableCameras(): Promise<CameraDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    return videoDevices.map((d, index) => ({
      deviceId: d.deviceId,
      label: d.label || `Camera ${index + 1}`,
    }));
  }

  public async startCamera(deviceId?: string): Promise<MediaStream> {
    this.stopCamera();

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30 },
        facingMode: 'user',
      },
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.activeStream = stream;
      return stream;
    } catch (err: any) {
      console.error('Camera request error:', err);
      throw err;
    }
  }

  public stopCamera(): void {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((track) => track.stop());
      this.activeStream = null;
    }
  }

  public isStreamActive(): boolean {
    return this.activeStream !== null && this.activeStream.active;
  }
}
