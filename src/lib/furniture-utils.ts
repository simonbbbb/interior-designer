import type { Point, Wall, FurnitureInstance, FurnitureDefinition } from '@/types';

export const FURNITURE_CATALOG: FurnitureDefinition[] = [
  // Bedroom
  { id: 'king-bed', name: 'King Bed', category: 'bedroom', width: 6.3, depth: 6.6, shape: 'rectangle', color: '#B45309', fillColor: '#FDE68A', svgPath: '' },
  { id: 'queen-bed', name: 'Queen Bed', category: 'bedroom', width: 5.0, depth: 6.6, shape: 'rectangle', color: '#B45309', fillColor: '#FDE68A', svgPath: '' },
  { id: 'nightstand', name: 'Nightstand', category: 'bedroom', width: 1.5, depth: 1.5, shape: 'rectangle', color: '#92400E', fillColor: '#FEF3C7', svgPath: '' },
  { id: 'dresser', name: 'Dresser', category: 'bedroom', width: 5.0, depth: 1.5, shape: 'rectangle', color: '#92400E', fillColor: '#FEF3C7', svgPath: '' },
  // Living Room
  { id: 'sofa-3', name: '3-Seater Sofa', category: 'living_room', width: 7.0, depth: 3.0, shape: 'rectangle', color: '#7C3AED', fillColor: '#EDE9FE', svgPath: '' },
  { id: 'loveseat', name: 'Loveseat', category: 'living_room', width: 5.0, depth: 3.0, shape: 'rectangle', color: '#7C3AED', fillColor: '#EDE9FE', svgPath: '' },
  { id: 'armchair', name: 'Armchair', category: 'living_room', width: 3.0, depth: 3.0, shape: 'rectangle', color: '#7C3AED', fillColor: '#EDE9FE', svgPath: '' },
  { id: 'coffee-table', name: 'Coffee Table', category: 'living_room', width: 4.0, depth: 2.0, shape: 'rectangle', color: '#6B7280', fillColor: '#F3F4F6', svgPath: '' },
  { id: 'tv-stand', name: 'TV Stand', category: 'living_room', width: 5.0, depth: 1.5, shape: 'rectangle', color: '#374151', fillColor: '#E5E7EB', svgPath: '' },
  // Kitchen
  { id: 'dining-table-6', name: 'Dining Table (6)', category: 'kitchen', width: 6.0, depth: 3.0, shape: 'rectangle', color: '#92400E', fillColor: '#FEF3C7', svgPath: '' },
  { id: 'dining-chair', name: 'Dining Chair', category: 'kitchen', width: 1.5, depth: 1.5, shape: 'rectangle', color: '#B45309', fillColor: '#FDE68A', svgPath: '' },
  { id: 'kitchen-island', name: 'Kitchen Island', category: 'kitchen', width: 5.0, depth: 2.5, shape: 'rectangle', color: '#6B7280', fillColor: '#F3F4F6', svgPath: '' },
  // Bathroom
  { id: 'vanity', name: 'Vanity', category: 'bathroom', width: 4.0, depth: 1.7, shape: 'rectangle', color: '#0891B2', fillColor: '#CFFAFE', svgPath: '' },
  { id: 'bathtub', name: 'Bathtub', category: 'bathroom', width: 5.0, depth: 2.5, shape: 'rectangle', color: '#0891B2', fillColor: '#CFFAFE', svgPath: '' },
  { id: 'shower', name: 'Shower', category: 'bathroom', width: 3.0, depth: 3.0, shape: 'rectangle', color: '#0891B2', fillColor: '#CFFAFE', svgPath: '' },
  { id: 'toilet', name: 'Toilet', category: 'bathroom', width: 1.5, depth: 2.5, shape: 'rectangle', color: '#0891B2', fillColor: '#CFFAFE', svgPath: '' },
  // Dining
  { id: 'bookshelf', name: 'Bookshelf', category: 'dining', width: 4.0, depth: 1.5, shape: 'rectangle', color: '#92400E', fillColor: '#FEF3C7', svgPath: '' },
  // Office
  { id: 'desk', name: 'Desk', category: 'office', width: 5.0, depth: 2.5, shape: 'rectangle', color: '#6B7280', fillColor: '#F3F4F6', svgPath: '' },
  { id: 'office-chair', name: 'Office Chair', category: 'office', width: 2.0, depth: 2.0, shape: 'circle', color: '#374151', fillColor: '#E5E7EB', svgPath: '' },
  // Appliances
  { id: 'fridge', name: 'Refrigerator', category: 'appliances', width: 2.5, depth: 2.5, shape: 'rectangle', color: '#1F2937', fillColor: '#D1D5DB', svgPath: '' },
  { id: 'washer', name: 'Washer', category: 'appliances', width: 2.5, depth: 2.5, shape: 'circle', color: '#1F2937', fillColor: '#D1D5DB', svgPath: '' },
  { id: 'dryer', name: 'Dryer', category: 'appliances', width: 2.5, depth: 2.5, shape: 'circle', color: '#1F2937', fillColor: '#D1D5DB', svgPath: '' },
];

/** Find catalog definition by ID */
export function findFurnitureDefinition(id: string): FurnitureDefinition | undefined {
  return FURNITURE_CATALOG.find((d) => d.id === id);
}

/** Check if furniture overlaps a wall (collision detection) */
export function furnitureOverlapsWall(
  furniture: { x: number; y: number; width: number; height: number; rotation: number },
  walls: Wall[],
  tolerance: number = 5,
): boolean {
  // Simple AABB check against wall bounding boxes
  const fLeft = furniture.x - furniture.width / 2;
  const fRight = furniture.x + furniture.width / 2;
  const fTop = furniture.y - furniture.height / 2;
  const fBottom = furniture.y + furniture.height / 2;

  for (const wall of walls) {
    const wallMinX = Math.min(wall.start.x, wall.end.x) - tolerance;
    const wallMaxX = Math.max(wall.start.x, wall.end.x) + tolerance;
    const wallMinY = Math.min(wall.start.y, wall.end.y) - tolerance;
    const wallMaxY = Math.max(wall.start.y, wall.end.y) + tolerance;

    if (
      fRight > wallMinX &&
      fLeft < wallMaxX &&
      fBottom > wallMinY &&
      fTop < wallMaxY
    ) {
      return true;
    }
  }
  return false;
}

/** Snap furniture to nearest wall within tolerance */
export function snapFurnitureToWall(
  furnitureX: number,
  furnitureY: number,
  walls: Wall[],
  tolerance: number = 20,
): { x: number; y: number } | null {
  for (const wall of walls) {
    // Check distance to wall line
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;

    let t = ((furnitureX - wall.start.x) * dx + (furnitureY - wall.start.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = wall.start.x + t * dx;
    const closestY = wall.start.y + t * dy;

    const dist = Math.sqrt((furnitureX - closestX) ** 2 + (furnitureY - closestY) ** 2);
    if (dist < tolerance) {
      return { x: closestX, y: closestY };
    }
  }
  return null;
}
