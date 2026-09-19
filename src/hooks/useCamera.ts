import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraService, CameraDeviceInfo } from '../services/cameraService';

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<CameraDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraServiceRef = useRef<CameraService>(new CameraService());

  const initCamera = useCallback(async (deviceId?: string) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const newStream = await cameraServiceRef.current.startCamera(deviceId);
      setStream(newStream);
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }

      // Enumerate cameras
      const devList = await cameraServiceRef.current.getAvailableCameras();
      setCameras(devList);
      if (devList.length > 0 && !deviceId) {
        const activeTrack = newStream.getVideoTracks()[0];
        const settings = activeTrack.getSettings();
        if (settings.deviceId) {
          setActiveDeviceId(settings.deviceId);
        }
      }
    } catch (err: any) {
      console.error('useCamera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setErrorMessage('Camera access was blocked by user or browser policy.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionState('error');
        setErrorMessage('No camera device detected on your system.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setPermissionState('error');
        setErrorMessage('Camera is currently in use by another application.');
      } else {
        setPermissionState('error');
        setErrorMessage(err.message || 'Failed to start camera.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchCamera = useCallback(
    async (deviceId: string) => {
      setActiveDeviceId(deviceId);
      await initCamera(deviceId);
    },
    [initCamera]
  );

  const stopCamera = useCallback(() => {
    cameraServiceRef.current.stopCamera();
    setStream(null);
  }, []);

  useEffect(() => {
    return () => {
      cameraServiceRef.current.stopCamera();
    };
  }, []);

  return {
    videoRef,
    stream,
    cameras,
    activeDeviceId,
    permissionState,
    errorMessage,
    isLoading,
    initCamera,
    switchCamera,
    stopCamera,
  };
}
