import { create } from 'zustand';
import type { Point, Tool, Scale } from '@/types';

interface CanvasState {
  zoom: number;
  pan: Point;
  isPanning: boolean;
  selectedObjectId: string | null;
  activeTool: Tool;
  scale: Scale | null;
  backgroundImage: string | null;
  backgroundOpacity: number;

  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  setIsPanning: (isPanning: boolean) => void;
  setSelectedObjectId: (id: string | null) => void;
  setActiveTool: (tool: Tool) => void;
  setScale: (scale: Scale | null) => void;
  setBackgroundImage: (url: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  zoom: 1,
  pan: { x: 0, y: 0 },
  isPanning: false,
  selectedObjectId: null,
  activeTool: 'select',
  scale: null,
  backgroundImage: null,
  backgroundOpacity: 0.5,

  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  setIsPanning: (isPanning) => set({ isPanning }),
  setSelectedObjectId: (selectedObjectId) => set({ selectedObjectId }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setScale: (scale) => set({ scale }),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
  setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
}));
