'use client';

import { useState } from 'react';
import { useCanvasStore, useEditorStore, useUIStore } from '@/store';
import { Toolbar } from './toolbar/Toolbar';
import { FurnitureSidebar } from './furniture/FurnitureSidebar';
import { Canvas } from './canvas/Canvas';
import { StatusBar } from './statusbar/StatusBar';
import { ScaleCalibrationModal } from './modals/ScaleCalibrationModal';
import { UploadModal } from './modals/UploadModal';
import { serializeProject, deserializeProject } from '@/lib/export-utils';
import type { FurnitureCategory } from '@/types';

const DEFAULT_PPF = 30;

export function EditorLayout() {
  const hasBackground = useCanvasStore((s) => !!s.backgroundImage);
  const showUploadModal = useUIStore((s) => s.showUploadModal);
  const setShowUploadModal = useUIStore((s) => s.setShowUploadModal);
  const showScaleCalibration = useUIStore((s) => s.showScaleCalibration);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  const walls = useEditorStore((s) => s.walls);
  const doors = useEditorStore((s) => s.doors);
  const windows = useEditorStore((s) => s.windows);
  const furniture = useEditorStore((s) => s.furniture);
  const setWalls = useEditorStore((s) => s.setWalls);
  const setDoors = useEditorStore((s) => s.setDoors);
  const setWindows = useEditorStore((s) => s.setWindows);
  const setFurniture = useEditorStore((s) => s.setFurniture);

  const setBackgroundImage = useCanvasStore((s) => s.setBackgroundImage);

  const showUpload = !hasBackground && showUploadModal;

  const [showExportModal, setShowExportModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  /** Save project to localStorage */
  const handleSave = () => {
    const data = serializeProject(
      walls,
      doors,
      windows,
      furniture,
      hasBackground ? '__present__' : null,
      DEFAULT_PPF,
    );
    localStorage.setItem('homeforge-project', data);
    setSaveMessage('Project saved!');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  /** Load project from localStorage */
  const handleLoad = () => {
    const saved = localStorage.getItem('homeforge-project');
    if (!saved) {
      setSaveMessage('No saved project found.');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    const data = deserializeProject(saved);
    if (!data) {
      setSaveMessage('Saved project is corrupted.');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    setWalls(data.walls);
    setDoors(data.doors);
    setWindows(data.windows);
    if (data.furniture && setFurniture) {
      setFurniture(data.furniture);
    }
    setSaveMessage('Project loaded!');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gray-50">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <FurnitureSidebar />}
        <div className="relative flex-1">
          <Canvas />

          {/* Upload modal (non-blocking) */}
          {showUpload && (
            <div className="pointer-events-none absolute inset-0 z-40">
              <UploadModal />
            </div>
          )}

          {/* Load button when no background and modal dismissed */}
          {!showUpload && !hasBackground && walls.length === 0 && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="absolute bottom-4 right-4 z-20 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow-lg transition hover:bg-blue-700"
            >
              Upload Floorplan
            </button>
          )}

          {/* Save / Load / Export buttons (top-right when canvas has content) */}
          {(walls.length > 0 || hasBackground) && (
            <div className="absolute bottom-4 right-4 z-20 flex gap-2">
              {saveMessage && (
                <div className="rounded bg-gray-900 px-3 py-1.5 text-xs text-white shadow">
                  {saveMessage}
                </div>
              )}
              <button
                onClick={handleLoad}
                className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow border border-gray-200 transition hover:bg-gray-50"
                title="Load from browser storage"
              >
                Load
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow border border-gray-200 transition hover:bg-gray-50"
                title="Save to browser storage"
              >
                Save
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow transition hover:bg-blue-700"
              >
                Export
              </button>
            </div>
          )}
        </div>
      </div>
      <StatusBar />
      {showScaleCalibration && <ScaleCalibrationModal />}
      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
    </div>
  );
}

// ============================================================
// Export Modal Component (inline to keep things together)
// ============================================================

function ExportModal({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [includeDimensions, setIncludeDimensions] = useState(true);

  const handleExport = async () => {
    // Find the canvas element
    const canvasEl = document.querySelector('[data-fabric] canvas');
    if (!canvasEl) return;

    // Get image data from the canvas
    try {
      const dataUrl = (canvasEl as HTMLCanvasElement).toDataURL('image/png');

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `homeforge-plan-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        // For PDF: create a simple HTML page that prints to PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head><title>HomeForge Floorplan</title>
                <style>body{margin:0;display:flex;justify-content:center;padding:20px} img{max-width:100%;height:auto}</style>
              </head>
              <body>
                <img src="${dataUrl}" />
                <script>window.onload = () => { setTimeout(() => window.print(), 500); };</script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Export Floorplan</h3>

        <div className="space-y-4">
          {/* Format selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Format</label>
            <div className="flex gap-2">
              {(['png', 'pdf'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    format === fmt
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-dims"
              checked={includeDimensions}
              onChange={(e) => setIncludeDimensions(e.target.checked)}
              className="rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="include-dims" className="text-sm text-gray-700">
              Include dimension labels
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Export {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
