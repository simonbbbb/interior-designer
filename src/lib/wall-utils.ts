import type { Point, Wall } from '@/types';

const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SNAP_TOLERANCE = 5; // degrees

/** Snap endpoint to nearest 0/45/90 degree angle from start */
export function snapToAngle(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  angle = ((angle % 360) + 360) % 360;
  const length = Math.sqrt(dx * dx + dy * dy);

  let snapped = angle;
  for (const sa of SNAP_ANGLES) {
    let diff = Math.abs(angle - sa);
    if (diff > 180) diff = 360 - diff;
    if (diff <= SNAP_TOLERANCE) { snapped = sa; break; }
  }

  const rad = snapped * (Math.PI / 180);
  return { x: start.x + Math.cos(rad) * length, y: start.y + Math.sin(rad) * length };
}

/** Find nearest wall endpoint within tolerance. Returns null if none. */
export function findNearestWallEndpoint(
  walls: Wall[],
  point: Point,
  tolerance = 15,
): Point | null {
  let best: Point | null = null;
  let bestDist = tolerance;

  for (const w of walls) {
    const ds = Math.sqrt((point.x - w.start.x) ** 2 + (point.y - w.start.y) ** 2);
    const de = Math.sqrt((point.x - w.end.x) ** 2 + (point.y - w.end.y) ** 2);
    if (ds < bestDist) { best = w.start; bestDist = ds; }
    if (de < bestDist) { best = w.end; bestDist = de; }
  }
  return best;
}

/** Find wall that a point is close to (within tolerance). Returns null */
export function findWallAtPoint(walls: Wall[], point: Point, tolerance = 10): Wall | null {
  let best: Wall | null = null;
  let bestDist = tolerance;

  for (const w of walls) {
    const d = distPointToLine(point, w.start, w.end);
    if (d <= tolerance && (!best || d < bestDist)) { best = w; bestDist = d; }
  }
  return best;
}

/** Distance from point p to line segment ab */
export function distPointToLine(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  return Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
}

export function feetToPixels(feet: number, ppf: number): number {
  return feet * ppf;
}

