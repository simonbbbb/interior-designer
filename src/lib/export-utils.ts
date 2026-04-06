import type { Wall, Door, Window, FurnitureInstance } from '@/types';
import { formatFeet } from './canvas-utils';

/** Calculate wall length in feet */
export function getWallLengthFeet(wall: Wall, pixelsPerFoot: number): number {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  return Math.sqrt(dx * dx + dy * dy) / pixelsPerFoot;
}

/** Get room dimensions based on adjacent walls */
export function getRoomDimensions(
  walls: Wall[],
  pixelsPerFoot: number,
): { label: string; x: number; y: number; width: string }[] {
  // Simple heuristic: find wall pairs and compute their midpoint
  const results: { label: string; x: number; y: number; width: string }[] = [];
  const ppf = pixelsPerFoot;

  for (const wall of walls) {
    const lenFeet = getWallLengthFeet(wall, ppf);
    const midX = (wall.start.x + wall.end.x) / 2;
    const midY = (wall.start.y + wall.end.y) / 2;

    results.push({
      label: formatFeet(lenFeet),
      x: midX,
      y: midY - 15,
      width: 'wall',
    });
  }

  return results;
}

/** Generate project export data for localStorage */
export function serializeProject(
  walls: Wall[],
  doors: Door[],
  windows: Window[],
  furniture: FurnitureInstance[],
  backgroundImage: string | null,
  pixelsPerFoot: number,
): string {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      walls,
      doors,
      windows,
      furniture,
      backgroundImage: backgroundImage ?? null,
      pixelsPerFoot,
    },
  });
}

/** Deserialize saved project */
export function deserializeProject(
  serialized: string,
): {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  furniture: FurnitureInstance[];
  backgroundImage: string | null;
  pixelsPerFoot: number;
} | null {
  try {
    const parsed = JSON.parse(serialized);
    if (parsed.version !== 1 || !parsed.data) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
