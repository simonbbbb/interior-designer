import { create } from 'zustand';
import type { FurnitureCategory } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  activeCategory: FurnitureCategory | null;
  showScaleCalibration: boolean;
  showUploadModal: boolean;
  isDigitizing: boolean;
  mobileBlocker: boolean;

  setSidebarOpen: (open: boolean) => void;
  setActiveCategory: (cat: FurnitureCategory | null) => void;
  setShowScaleCalibration: (show: boolean) => void;
  setShowUploadModal: (show: boolean) => void;
  setIsDigitizing: (loading: boolean) => void;
  setMobileBlocker: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeCategory: null,
  showScaleCalibration: false,
  showUploadModal: true,
  isDigitizing: false,
  mobileBlocker: false,

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setShowScaleCalibration: (showScaleCalibration) =>
    set({ showScaleCalibration }),
  setShowUploadModal: (showUploadModal) => set({ showUploadModal }),
  setIsDigitizing: (isDigitizing) => set({ isDigitizing }),
  setMobileBlocker: (mobileBlocker) => set({ mobileBlocker }),
}));
