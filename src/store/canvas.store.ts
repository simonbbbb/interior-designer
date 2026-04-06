import { create } from 'zustand';
import type { Point, Tool, Scale } from '@/types';

/** Internal callback for scale calibration */
type CalibrateHandler = (pt: Point) => void;
let _calibrateClickHandler: CalibrateHandler | null = null;

export function setCalibrateClickHandler(handler: CalibrateHandler) {
  _calibrateClickHandler = handler;
}
export function getCalibrateClickHandler(): CalibrateHandler | null {
  return _calibrateClickHandler;
}

interface CanvasState {
  zoom: number;
  pan: Point;
  isPanning: boolean;
  selectedObjectId: string | null;
  activeTool: Tool;
  scale: Scale | null;
  backgroundImage: string | null;
  backgroundOpacity: number;
  showScaleCalibration: boolean;

  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  setIsPanning: (isPanning: boolean) => void;
  setSelectedObjectId: (id: string | null) => void;
  setActiveTool: (tool: Tool) => void;
  setScale: (scale: Scale | null) => void;
  setBackgroundImage: (url: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setShowScaleCalibration: (show: boolean) => void;
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
  showScaleCalibration: false,

  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  setIsPanning: (isPanning) => set({ isPanning }),
  setSelectedObjectId: (selectedObjectId) => set({ selectedObjectId }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setScale: (scale) => set({ scale }),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
  setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
  setShowScaleCalibration: (showScaleCalibration) => set({ showScaleCalibration }),
}));
