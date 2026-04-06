// ============================================================
// Grid-Based Spatial Index
// For collision detection and snap-to-wall lookups
// ============================================================
import { Point } from '@/types';

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class SpatialGrid {
  private grid: Map<string, Set<string>> = new Map();
  private cellSize: number;

  constructor(cellSize = 50) {
    this.cellSize = cellSize;
  }

  /** Compute cell key for a point */
  private cellKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  /** Return all cell keys that a bounding box overlaps */
  private getCells(bounds: BoundingBox): string[] {
    const cells: string[] = [];
    const minX = Math.floor(bounds.x / this.cellSize);
    const minY = Math.floor(bounds.y / this.cellSize);
    const maxX = Math.floor((bounds.x + bounds.w) / this.cellSize);
    const maxY = Math.floor((bounds.y + bounds.h) / this.cellSize);
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        cells.push(`${cx},${cy}`);
      }
    }
    return cells;
  }

  addObject(id: string, bounds: BoundingBox): void {
    const cells = this.getCells(bounds);
    for (const key of cells) {
      if (!this.grid.has(key)) this.grid.set(key, new Set());
      this.grid.get(key)!.add(id);
    }
  }

  removeObject(id: string, bounds: BoundingBox): void {
    const cells = this.getCells(bounds);
    for (const key of cells) {
      this.grid.get(key)?.delete(id);
    }
  }

  /** Query all object IDs whose cells overlap the given bounds */
  query(bounds: BoundingBox): string[] {
    const results = new Set<string>();
    const cells = this.getCells(bounds);
    for (const key of cells) {
      const ids = this.grid.get(key);
      if (ids) {
        ids.forEach((id) => results.add(id));
      }
    }
    return [...results];
  }

  clear(): void {
    this.grid.clear();
  }
}

/** Check if two bounding boxes overlap */
export function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** Find the nearest point on a line segment to a given point */
export function nearestPointOnLine(
  start: Point,
  end: Point,
  point: Point,
): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return { x: start.x, y: start.y };
  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };
}

/** Distance between two points */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}
