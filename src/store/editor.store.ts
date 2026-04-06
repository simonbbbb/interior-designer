import { create } from 'zustand';
import type { Wall, Door, Window, FurnitureInstance } from '@/types';

interface EditorState {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  furniture: FurnitureInstance[];

  // Bulk set (for AI digitization results)
  setWalls: (walls: Wall[]) => void;
  setDoors: (doors: Door[]) => void;
  setWindows: (windows: Window[]) => void;

  // Wall CRUD
  addWall: (wall: Wall) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  removeWall: (id: string) => void;

  // Door CRUD
  addDoor: (door: Door) => void;
  removeDoor: (id: string) => void;

  // Window CRUD
  addWindow: (window: Window) => void;
  removeWindow: (id: string) => void;

  // Furniture CRUD
  addFurniture: (item: FurnitureInstance) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureInstance>) => void;
  removeFurniture: (id: string) => void;

  // Clear all
  setFurniture: (furniture: FurnitureInstance[]) => void;
  clearAll: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  walls: [],
  doors: [],
  windows: [],
  furniture: [],

  setWalls: (walls) => set({ walls }),
  setDoors: (doors) => set({ doors }),
  setWindows: (windows) => set({ windows }),

  addWall: (wall) => set((state) => ({ walls: [...state.walls, wall] })),
  updateWall: (id, updates) =>
    set((state) => ({
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),
  removeWall: (id) =>
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== id),
      doors: state.doors.filter((d) => d.wallId !== id),
      windows: state.windows.filter((w) => w.wallId !== id),
    })),

  addDoor: (door) => set((state) => ({ doors: [...state.doors, door] })),
  removeDoor: (id) =>
    set((state) => ({ doors: state.doors.filter((d) => d.id !== id) })),

  addWindow: (window_) =>
    set((state) => ({ windows: [...state.windows, window_] })),
  removeWindow: (id) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
    })),

  addFurniture: (item) =>
    set((state) => ({ furniture: [...state.furniture, item] })),
  updateFurniture: (id, updates) =>
    set((state) => ({
      furniture: state.furniture.map((f) =>
        f.id === id ? { ...f, ...updates } : f,
      ),
    })),
  removeFurniture: (id) =>
    set((state) => ({
      furniture: state.furniture.filter((f) => f.id !== id),
    })),

  clearAll: () => set({ walls: [], doors: [], windows: [], furniture: [] }),
  setFurniture: (furniture) => set({ furniture }),
}));
