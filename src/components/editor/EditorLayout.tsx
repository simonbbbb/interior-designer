'use client';

import { useCanvasStore, useUIStore } from '@/store';
import { Toolbar } from './toolbar/Toolbar';
import { FurnitureSidebar } from './furniture/FurnitureSidebar';
import { Canvas } from './canvas/Canvas';
import { StatusBar } from './statusbar/StatusBar';
import { ScaleCalibrationModal } from './modals/ScaleCalibrationModal';
import { UploadModal } from './modals/UploadModal';

export function EditorLayout() {
  const hasBackground = useCanvasStore((s) => !!s.backgroundImage);
  const showUploadModal = useUIStore((s) => s.showUploadModal);
  const setShowUploadModal = useUIStore((s) => s.setShowUploadModal);
  const showScaleCalibration = useUIStore((s) => s.showScaleCalibration);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  // Show upload modal on first visit (no background, not yet dismissed)
  const showUpload = !hasBackground && showUploadModal;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gray-50">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <FurnitureSidebar />}
        {/* Canvas sits behind the upload modal but is still interactive */}
        <div className="relative flex-1">
          <Canvas />
          {showUpload && (
            <div className="pointer-events-none absolute inset-0 z-40">
              <UploadModal />
            </div>
          )}
          {!showUpload && !hasBackground && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="absolute bottom-4 right-4 z-20 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow-lg transition hover:bg-blue-700"
            >
              Upload Floorplan
            </button>
          )}
        </div>
      </div>
      <StatusBar />
      {showScaleCalibration && <ScaleCalibrationModal />}
    </div>
  );
}
