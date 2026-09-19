import React, { useRef, useEffect, memo } from 'react';
import { PoseLandmark, SKELETON_CONNECTIONS, PoseStatus } from '../types/pose';
import { CalculatedAngles } from '../cv/angleCalculator';

interface PoseOverlayProps {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  landmarks: PoseLandmark[];
  angles: CalculatedAngles | null;
  width: number;
  height: number;
  status: PoseStatus;
  isPaused: boolean;
  hasFormError: boolean;
}

export const PoseOverlay: React.FC<PoseOverlayProps> = memo(({
  canvasRef: externalCanvasRef,
  landmarks,
  angles,
  width,
  height,
  status,
  isPaused,
  hasFormError,
}) => {
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (isPaused || !landmarks || landmarks.length < 33) {
      return;
    }

    let boneColor = '#10b981';
    let jointColor = '#34d399';
    let headColor = '#6ee7b7';

    if (hasFormError || status === 'ERROR') {
      boneColor = '#f43f5e';
      jointColor = '#fb7185';
      headColor = '#fda4af';
    } else if (status === 'GOOD') {
      boneColor = '#10b981';
      jointColor = '#34d399';
    } else if (status === 'WARNING') {
      boneColor = '#f59e0b';
      jointColor = '#fbbf24';
    }

    ctx.lineCap = 'round';

    SKELETON_CONNECTIONS.forEach((conn) => {
      const fromLm = landmarks[conn.from];
      const toLm = landmarks[conn.to];

      if (fromLm && toLm && fromLm.visibility > 0.15 && toLm.visibility > 0.15) {
        const x1 = fromLm.x * width;
        const y1 = fromLm.y * height;
        const x2 = toLm.x * width;
        const y2 = toLm.y * height;

        ctx.lineWidth = conn.group === 'head' ? 1.0 : 1.8;
        ctx.strokeStyle = conn.group === 'head' ? headColor : boneColor;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    const nose = landmarks[0];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    if (nose && nose.visibility > 0.3) {
      const nx = nose.x * width;
      const ny = nose.y * height;

      let faceRadius = 16;
      if (leftEar && rightEar && leftEar.visibility > 0.3 && rightEar.visibility > 0.3) {
        const earDist = Math.abs(leftEar.x - rightEar.x) * width;
        faceRadius = Math.max(12, earDist * 0.45);
      }

      ctx.beginPath();
      ctx.ellipse(nx, ny, faceRadius * 0.8, faceRadius * 1.0, 0, 0, 2 * Math.PI);
      ctx.strokeStyle = hasFormError ? 'rgba(239, 68, 68, 0.7)' : 'rgba(34, 211, 238, 0.5)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    landmarks.forEach((lm) => {
      if (lm.visibility > 0.15) {
        const x = lm.x * width;
        const y = lm.y * height;
        const isHead = lm.id <= 10;

        ctx.beginPath();
        ctx.arc(x, y, isHead ? 2.0 : 3.0, 0, 2 * Math.PI);
        ctx.fillStyle = isHead ? headColor : jointColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, isHead ? 1.0 : 1.2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });

    if (angles) {
      const drawAngleTag = (
        point: { x: number; y: number },
        angleLabel: string,
        angleDeg: number,
        tagStatus: PoseStatus
      ) => {
        if (!point) return;
        const px = point.x * width;
        const py = point.y * height;

        ctx.save();
        ctx.font = 'bold 10px "JetBrains Mono", monospace';

        const text = `${angleLabel}: ${Math.round(angleDeg)}°`;
        const textWidth = ctx.measureText(text).width;
        const padding = 5;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = 18;

        const boxX = Math.max(10, Math.min(width - boxWidth - 10, px + 10));
        const boxY = Math.max(10, Math.min(height - boxHeight - 10, py - 10));

        ctx.fillStyle =
          hasFormError || tagStatus === 'ERROR'
            ? 'rgba(239, 68, 68, 0.95)'
            : tagStatus === 'WARNING'
            ? 'rgba(245, 158, 11, 0.95)'
            : 'rgba(15, 23, 42, 0.85)';

        ctx.strokeStyle =
          hasFormError || tagStatus === 'ERROR'
            ? '#ef4444'
            : tagStatus === 'WARNING'
            ? '#f59e0b'
            : '#38bdf8';
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, boxX + padding, boxY + 13);
        ctx.restore();
      };

      if (angles.kneeAngle && angles.kneeAngle.confidence > 0.2) {
        drawAngleTag(
          angles.kneeAngle.points.b,
          'Knee',
          angles.kneeAngle.angleDegrees,
          hasFormError ? 'ERROR' : angles.kneeAngle.status
        );
      }

      if (angles.elbowAngle && angles.elbowAngle.confidence > 0.2) {
        drawAngleTag(
          angles.elbowAngle.points.b,
          'Elbow',
          angles.elbowAngle.angleDegrees,
          'GOOD'
        );
      }
    }
  }, [landmarks, angles, width, height, status, isPaused, hasFormError, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full object-contain"
    />
  );
});
