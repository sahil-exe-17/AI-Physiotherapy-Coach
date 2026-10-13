import React, { useRef, memo } from 'react';

interface PoseOverlayProps {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
}

export const PoseOverlay: React.FC<PoseOverlayProps> = memo(({
  canvasRef: externalCanvasRef,
  width,
  height,
}) => {
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full object-contain"
    />
  );
});

