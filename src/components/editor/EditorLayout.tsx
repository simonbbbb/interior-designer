'use client';

import { useRef, useCallback, useState } from 'react';
import { useCanvasStore, useUIStore } from '@/store';
import { Toolbar } from './toolbar/Toolbar';
import { FurnitureSidebar } from './furniture/FurnitureSidebar';
import { Canvas } from './canvas/Canvas';
import { StatusBar } from './statusbar/StatusBar';
import { ScaleCalibrationModal } from './modals/ScaleCalibrationModal';
import { UploadModal } from './modals/UploadModal';

const MIN_WIDTH = 1024;

export function EditorLayout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobileBlocker, setMobileBlocker] = useState(false);
  const showScaleCalibration = useUIStore((s) => s.showScaleCalibration);
  const showUploadModal = useCanvasStore((s) => !s.backgroundImage);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const activeTool = useCanvasStore((s) => s.activeTool);

  // Mobile guard
  if (typeof window !== 'undefined' && !mobileBlocker && window.innerWidth < MIN_WIDTH) {
    setMobileBlocker(true);
  }

  const handleUndo = useCallback(() => {}, []);
  const handleRedo = useCallback(() => {}, []);

  if (mobileBlocker && typeof window !== 'undefined' && window.innerWidth < MIN_WIDTH) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-5xl">{"\uD83D\uDCAA"}</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Desktop Recommended</h2>
          <p className="text-gray-600">
            HomeForge is optimized for desktop and tablet (1024px+).
            Please open this page on a larger screen for the best experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <FurnitureSidebar />}
        <Canvas />
      </div>
      <StatusBar />

      {showUploadModal && <UploadModal />}
      {showScaleCalibration && <ScaleCalibrationModal />}
    </div>
  );
}
