import { create } from 'zustand';
import type { FurnitureCategory, Wall, Door, Window } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  activeCategory: FurnitureCategory | null;
  showScaleCalibration: boolean;
  isDigitizing: boolean;
  mobileBlocker: boolean;

  setSidebarOpen: (open: boolean) => void;
  setActiveCategory: (cat: FurnitureCategory | null) => void;
  setShowScaleCalibration: (show: boolean) => void;
  setIsDigitizing: (loading: boolean) => void;
  setMobileBlocker: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeCategory: null,
  showScaleCalibration: false,
  isDigitizing: false,
  mobileBlocker: false,

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setShowScaleCalibration: (showScaleCalibration) =>
    set({ showScaleCalibration }),
  setIsDigitizing: (isDigitizing) => set({ isDigitizing }),
  setMobileBlocker: (mobileBlocker) => set({ mobileBlocker }),
}));
