import { PoseLandmark, LANDMARK_INDEX } from '../types/pose';
import { CalibrationStatus } from '../types/session';

/**
 * Validates whether essential upper body / torso landmarks are visible.
 * Flexible: Does NOT require full ankles/feet so users near webcams can participate.
 */
export function checkBodyVisibility(
  landmarks: PoseLandmark[],
  minConfidence: number = 0.35
): { isVisible: boolean; missingLandmarks: string[] } {
  if (!landmarks || landmarks.length < 33) {
    return { isVisible: false, missingLandmarks: ['No Pose Detected'] };
  }

  // Core essential upper body landmarks
  const corePoints = [
    { index: LANDMARK_INDEX.LEFT_SHOULDER, name: 'Left Shoulder' },
    { index: LANDMARK_INDEX.RIGHT_SHOULDER, name: 'Right Shoulder' },
    { index: LANDMARK_INDEX.LEFT_HIP, name: 'Left Hip' },
    { index: LANDMARK_INDEX.RIGHT_HIP, name: 'Right Hip' },
  ];

  const missing: string[] = [];
  for (const p of corePoints) {
    const lm = landmarks[p.index];
    if (!lm || lm.visibility < minConfidence) {
      missing.push(p.name);
    }
  }

  return {
    isVisible: missing.length <= 1, // Allow 1 missing point if partially occluded
    missingLandmarks: missing,
  };
}

/**
 * Performs adaptive pre-exercise calibration assessment.
 * User-friendly: Allows starting even with partial visibility.
 */
export function assessCalibration(
  landmarks: PoseLandmark[] | null,
  cameraActive: boolean
): CalibrationStatus {
  if (!cameraActive) {
    return {
      cameraActive: false,
      personDetected: false,
      fullBodyVisible: false,
      confidenceGood: false,
      centered: false,
      readyToStart: false,
      warnings: ['Camera stream inactive. Please allow camera access.'],
    };
  }

  if (!landmarks || landmarks.length < 33) {
    return {
      cameraActive: true,
      personDetected: false,
      fullBodyVisible: false,
      confidenceGood: false,
      centered: false,
      readyToStart: false,
      warnings: ['Position yourself in front of the camera.'],
    };
  }

  const { isVisible, missingLandmarks } = checkBodyVisibility(landmarks, 0.35);

  // Confidence check on visible joints
  const keyIndices = [11, 12, 13, 14, 23, 24, 25, 26];
  const validVis = keyIndices
    .map((idx) => landmarks[idx]?.visibility || 0)
    .filter((v) => v > 0);
  const avgConf = validVis.length > 0 ? validVis.reduce((a, b) => a + b, 0) / validVis.length : 0;

  const confidenceGood = avgConf >= 0.35 || isVisible;

  // Hips or Shoulders centered check
  const leftShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];
  const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
  const centered = shoulderX >= 0.15 && shoulderX <= 0.85;

  const warnings: string[] = [];

  if (!isVisible) {
    warnings.push(`Partial view detected. Missing: ${missingLandmarks.join(', ')}`);
  } else if (!centered) {
    warnings.push('Center yourself in camera view for best tracking.');
  }

  // Always enable readyToStart if a person is detected and core upper body is visible
  const readyToStart = isVisible || confidenceGood || (landmarks && landmarks.length > 0);

  return {
    cameraActive: true,
    personDetected: true,
    fullBodyVisible: isVisible,
    confidenceGood,
    centered,
    readyToStart,
    warnings,
  };
}
