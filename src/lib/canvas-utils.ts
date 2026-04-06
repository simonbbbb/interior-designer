import type { Point, Wall, Door, Window, Tool, WallType } from '@/types';

/** Wall type display properties */
export const WALL_TYPE_STYLES: Record<
  WallType,
  { color: string; thickness: number; dashed: boolean; label: string }
> = {
  standard: {
    color: '#333333',
    thickness: 6,
    dashed: false,
    label: 'Standard',
  },
  half: { color: '#888888', thickness: 4, dashed: false, label: 'Half Wall' },
  glass: { color: '#4DA6C8', thickness: 3, dashed: true, label: 'Glass' },
};

/** Standard door sizes in feet */
export const DOOR_SIZES = [28, 30, 32, 36];

/** Standard window sizes in feet */
export const WINDOW_SIZES = [24, 30, 36, 48, 60];

/** Default pixels-per-foot for unscaled projects */
export const DEFAULT_PPF = 30;

/**
 * Canvas coordinate utilities.
 * All mouse events give screen coordinates. These convert to Canvas
 * coordinates (accounting for pan offset and zoom level).
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  canvasRect: DOMRect,
  zoom: number,
  vpt: number[] | undefined,
): Point {
  const cx = screenX - canvasRect.left;
  const cy = screenY - canvasRect.top;
  const tx = vpt?.[4] ?? 0;
  const ty = vpt?.[5] ?? 0;
  return {
    x: (cx - tx) / zoom,
    y: (cy - ty) / zoom,
  };
}

/**
 * Format feet as feet + inches display string.
 * e.g., 12.5 -> 12' 6"
 */
export function formatFeet(feet: number): string {
  const f = Math.floor(feet);
  const inches = Math.round((feet - f) * 12);
  if (inches === 0) return `${f}'`;
  return `${f}' ${inches}"`;
}

/**
 * Parse a wall type string safely.
 */
export function parseWallType(s: string): WallType {
  if (s === 'half' || s === 'glass') return s;
  return 'standard';
}

/**
 * Calculate the perpendicular offset point for door swing arc visualization.
 */
export function doorSwingPoint(
  start: Point,
  end: Point,
  swing: 'left' | 'right',
  length: number,
): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const wallLen = Math.sqrt(dx * dx + dy * dy);
  if (wallLen === 0) return start;

  // Unit perpendicular vectors
  const px = -dy / wallLen;
  const py = dx / wallLen;

  // Swing to the left or right of the wall direction
  const sign = swing === 'left' ? -1 : 1;

  return {
    x: start.x + px * length * sign,
    y: start.y + py * length * sign,
  };
}
