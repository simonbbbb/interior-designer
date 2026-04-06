# Data Models

## Coordinate & Measurement

```typescript
interface Point {
  x: number;    // Canvas pixels
  y: number;    // Canvas pixels
}

type WallType = 'standard' | 'half' | 'glass';
```

## Project

```typescript
interface Project {
  id: string;                 // UUID
  name: string;               // "My New Home"
  createdAt: Date;
  updatedAt: Date;
  scale: Scale;               // pixels-to-feet ratio
  backgroundImage?: string;   // Data URL or Cloudinary URL
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  furniture: FurnitureInstance[];
  history: HistoryState[];
  currentHistoryIndex: number;
}

interface Scale {
  pixelsPerFoot: number;      // e.g., 30 means 30px = 1 foot
  origin: Point;
  endpoint: Point;
  knownDistance: number;      // In feet
}
```

## Wall

```typescript
interface Wall {
  id: string;
  start: Point;
  end: Point;
  type: WallType;
  thickness: number;    // Canvas pixels (derived from type if not set)
  source?: 'ai' | 'manual';
  confidence?: number;  // AI confidence 0-1
  connectedWalls?: string[];
}
```

## Door

```typescript
interface Door {
  id: string;
  wallId: string;
  offsetFromStart: number;
  width: number;       // Canvas pixels
  swingDirection: 'left' | 'right';
}
```

## Window

```typescript
interface Window {
  id: string;
  wallId: string;
  offsetFromStart: number;
  width: number;
  sillHeight: number;
}
```

## Furniture

```typescript
interface FurnitureDefinition {
  id: string;
  name: string;
  category: 'bedroom' | 'living_room' | 'kitchen' | 'bathroom' | 'dining' | 'office' | 'appliances';
  width: number;     // Feet
  depth: number;     // Feet
  shape: 'rectangle' | 'l-shape' | 'circle' | 'custom';
  customPoints?: {x: number; y: number}[];
  color: string;
  fillColor: string;
  svgPath: string;   // SVG path for sidebar icon
}

interface FurnitureInstance {
  id: string;           // UUID
  definitionId: string;
  x: number;
  y: number;
  rotation: number;
  width: number;       // Canvas pixels
  height: number;      // Canvas pixels
}
```
