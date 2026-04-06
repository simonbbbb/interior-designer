// ============================================================
// HomeForge Type Definitions
// ============================================================

export interface Point {
  x: number;
  y: number;
}

export type WallType = 'standard' | 'half' | 'glass';

export type Tool = 'select' | 'draw-wall' | 'add-door' | 'add-window' | 'pan';

export type FurnitureCategory =
  | 'bedroom'
  | 'living_room'
  | 'kitchen'
  | 'bathroom'
  | 'dining'
  | 'office'
  | 'appliances';

export interface Scale {
  pixelsPerFoot: number;
  origin: Point;
  endpoint: Point;
  knownDistance: number; // in feet
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  type: WallType;
  thickness: number;
  source?: 'ai' | 'manual';
  confidence?: number;
  connectedWalls?: string[];
}

export interface Door {
  id: string;
  wallId: string;
  offsetFromStart: number;
  width: number;
  swingDirection: 'left' | 'right';
}

export interface Window {
  id: string;
  wallId: string;
  offsetFromStart: number;
  width: number;
  sillHeight: number;
}

export interface FurnitureDefinition {
  id: string;
  name: string;
  category: FurnitureCategory;
  width: number;  // feet
  depth: number;  // feet
  shape: 'rectangle' | 'l-shape' | 'circle' | 'custom';
  customPoints?: Point[];
  color: string;
  fillColor: string;
  svgPath: string;
}

export interface FurnitureInstance {
  id: string;
  definitionId: string;
  x: number;
  y: number;
  rotation: number;
  width: number;  // canvas pixels
  height: number; // canvas pixels
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  scale?: Scale;
  backgroundImage?: string;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  furniture: FurnitureInstance[];
}

// Commands for the History Manager
export interface Command {
  execute(): void;
  undo(): void;
  readonly label: string;
}
