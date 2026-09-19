import { Point2D, Point3D, PoseLandmark } from '../types/pose';

/**
 * Calculates the interior angle in degrees formed at vertex B by points A, B, and C.
 * Point A -> Vertex B -> Point C
 * Example: Hip (A) -> Knee (B) -> Ankle (C) returns Knee Angle in [0, 180] degrees.
 */
export function calculateJointAngle(
  pointA: Point2D | PoseLandmark,
  vertexB: Point2D | PoseLandmark,
  pointC: Point2D | PoseLandmark
): number {
  if (!pointA || !vertexB || !pointC) return 0;

  // Vector BA
  const radiansBA = Math.atan2(pointA.y - vertexB.y, pointA.x - vertexB.x);
  // Vector BC
  const radiansBC = Math.atan2(pointC.y - vertexB.y, pointC.x - vertexB.x);

  let angleRad = radiansBC - radiansBA;
  let angleDeg = Math.abs((angleRad * 180.0) / Math.PI);

  if (angleDeg > 180.0) {
    angleDeg = 360.0 - angleDeg;
  }

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Calculates the tilt angle of segment A->B relative to a strict vertical line.
 * Useful for Torso Lean angle (Hip -> Shoulder).
 * 0 degrees = vertical upright posturing.
 * 90 degrees = completely horizontal forward bend.
 */
export function calculateAngleWithVertical(
  pointA: Point2D | PoseLandmark,
  pointB: Point2D | PoseLandmark
): number {
  if (!pointA || !pointB) return 0;

  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;

  // Angle with respect to vertical y-axis
  const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
  const angleDeg = (angleRad * 180.0) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Distance between two 2D points in normalized screen space [0, 1].
 */
export function distance2D(p1: Point2D | PoseLandmark, p2: Point2D | PoseLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate midpoint between two 2D points.
 */
export function midpoint2D(p1: Point2D | PoseLandmark, p2: Point2D | PoseLandmark): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}
