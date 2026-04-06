import type { Point, Wall, Door, Window } from '@/types';

const SNAP_ANGLE = 5; // degrees tolerance for snapping
const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * Snap a point to the nearest cardinal/ordinal angle from an origin.
 * Returns the adjusted endpoint.
 */
export function snapToAngle(
  start: Point,
  end: Point,
  tolerance: number = SNAP_ANGLE,
): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  angle = ((angle % 360) + 360) % 360;

  let snappedAngle = angle;
  for (const sa of SNAP_ANGLES) {
    let diff = Math.abs(angle - sa);
    if (diff > 180) diff = 360 - diff;
    if (diff <= tolerance) {
      snappedAngle = sa;
      break;
    }
  }

  const radians = snappedAngle * (Math.PI / 180);
  const length = Math.sqrt(dx * dx + dy * dy);
  return {
    x: start.x + Math.cos(radians) * length,
    y: start.y + Math.sin(radians) * length,
  };
}

/**
 * Find intersection point of two line segments.
 * Returns null if they don't intersect (or are collinear/parallel).
 * Based on the standard parametric line-line intersection formula.
 */
export function lineSegmentIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): Point | null {
  const dxa = a2.x - a1.x;
  const dya = a2.y - a1.y;
  const dxb = b2.x - b1.x;
  const dyb = b2.y - b1.y;

  const denom = dya * dxb - dxa * dyb;
  if (Math.abs(denom) < 1e-8) return null; // parallel or collinear

  const dp = b1.x - a1.x;
  const dp2 = b1.y - a1.y;

  const ua = (dp * dyb - dxb * dp2) / denom;
  const ub = (dp * dya - dxa * dp2) / denom;

  // Only return if the intersection is ON both segments
  if (ua < -0.001 || ua > 1.001 || ub < -0.001 || ub > 1.001) return null;

  return {
    x: a1.x + ua * dxa,
    y: a1.y + ua * dya,
  };
}

/**
 * Compute all wall-wall intersections within the wall collection,
 * and return a map of wallId -> { connections: string[] }
 * where connections are wall IDs that intersect with this wall.
 * We don't split walls (that breaks connectedWalls logic).
 * Instead we track which walls connect at which points.
 */
export function computeWallConnections(
  walls: Wall[],
): Map<string, { point: Point; otherWallId: string }[]> {
  const connections = new Map<string, { point: Point; otherWallId: string }[]>();

  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const a = walls[i];
      const b = walls[j];

      const hit = lineSegmentIntersection(
        a.start,
        a.end,
        b.start,
        b.end,
      );

      if (!hit) continue;

      // Record mutual connection
      const entryA = connections.get(a.id) ?? [];
      entryA.push({ point: hit, otherWallId: b.id });
      connections.set(a.id, entryA);

      const entryB = connections.get(b.id) ?? [];
      entryB.push({ point: hit, otherWallId: a.id });
      connections.set(b.id, entryB);
    }
  }

  return connections;
}

/**
 * Calculate the length of a wall in feet.
 */
export function wallLengthFeet(wall: Wall, pixelsPerFoot: number): number {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const pixels = Math.sqrt(dx * dx + dy * dy);
  return pixels / pixelsPerFoot;
}

/**
 * Get the wall at a given point (within tolerance).
 * Used when clicking to add a door/window on a wall.
 */
export function findWallAtPoint(
  walls: Wall[],
  point: Point,
  tolerance: number = 10,
): { wall: Wall; distance: number } | null {
  let best: { wall: Wall; distance: number } | null = null;

  for (const wall of walls) {
    const dist = distPointToLine(point, wall.start, wall.end);
    if (dist <= tolerance && (!best || dist < best.distance)) {
      best = { wall, distance: dist };
    }
  }

  return best;
}

/**
 * Distance from point p to line segment ab.
 */
export function distPointToLine(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    // a and b are the same point
    return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  }

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = a.x + t * dx;
  const closestY = a.y + t * dy;
  return Math.sqrt((p.x - closestX) ** 2 + (p.y - closestY) ** 2);
}

/**
 * Find the nearest endpoint of any wall to a point. Used for wall snapping.
 */
export function findNearestWallEndpoint(
  walls: Wall[],
  point: Point,
  tolerance: number = 15,
): { wall: Wall; endpoint: 'start' | 'end'; location: Point } | null {
  let best: { wall: Wall; endpoint: 'start' | 'end'; location: Point } | null =
    null;
  let bestDist = tolerance;

  for (const wall of walls) {
    const dStart = Math.sqrt(
      (point.x - wall.start.x) ** 2 + (point.y - wall.start.y) ** 2,
    );
    const dEnd = Math.sqrt(
      (point.x - wall.end.x) ** 2 + (point.y - wall.end.y) ** 2,
    );

    if (dStart < bestDist) {
      best = { wall, endpoint: 'start', location: wall.start };
      bestDist = dStart;
    }
    if (dEnd < bestDist) {
      best = { wall, endpoint: 'end', location: wall.end };
      bestDist = dEnd;
    }
  }

  return best;
}

/**
 * Convert feet to pixels
 */
export function feetToPixels(feet: number, pixelsPerFoot: number): number {
  return feet * pixelsPerFoot;
}
