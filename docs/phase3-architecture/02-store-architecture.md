# Zustand Store Architecture

Four separate stores to prevent unnecessary re-renders.

## Canvas Store (High-Frequency)

```typescript
// Changes on every frame during drag/pan/zoom
interface CanvasState {
  zoom: number;
  pan: Point;
  isDragging: boolean;
  isPanning: boolean;
  selectedObject: string | null;
  tool: 'select' | 'draw-wall' | 'add-door' | 'add-window' | 'pan';
  scale: Scale | null;
  backgroundImage: string | null;
  backgroundOpacity: number;
}
```

Used by: CanvasContainer, GridOverlay, SnapGuides

## Editor Store (Domain Objects)

```typescript
// Moderate frequency -- changes on user actions
interface EditorState {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  furniture: FurnitureInstance[];

  // CRUD operations
  addWall, updateWall, removeWall,
  addDoor, removeDoor,
  addWindow, removeWindow,
  addFurniture, updateFurniture, removeFurniture,
  setWalls, setDoors, setWindows, // bulk set (from AI)
}
```

Used by: CanvasContainer, WallRenderer, DoorRenderer, FurnitureRenderer

## History Store (Command Pattern)

```typescript
interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];

  pushCommand(cmd: Command): void;
  undo(): void;
  redo(): void;
  clear(): void;
}
```

Used by: Toolbar (undo/redo buttons), keyboard shortcuts

## UI Store (Presentation)

```typescript
interface UIState {
  sidebarOpen: boolean;
  activeCategory: FurnitureCategory | null;
  showScaleCalibration: boolean;
  showAIPreview: boolean;
  aiDetections: { walls: Wall[]; doors: Door[]; windows: Window[] };
  isDigitizing: boolean;
  mobileOverlay: boolean;
  exportModalOpen: boolean;
}
```

Used by: Sidebar, modals, overlays, responsive guard

## Design Rules

1. Canvas components subscribe to `canvas` and `editor` stores only.
2. UI components subscribe to `ui` store only.
3. History store is accessed imperatively (not reactively) to avoid render storms.
4. No store references another store. Components that need cross-store data compose multiple hooks.
5. Zustand's `useStore.subscribe(selector)` used for fine-grained subscriptions to prevent unnecessary Canvas re-renders.
