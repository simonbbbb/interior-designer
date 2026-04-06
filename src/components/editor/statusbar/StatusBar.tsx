'use client';

import { useCanvasStore, useEditorStore, useUIStore } from '@/store';
import { useCallback } from 'react';

export function StatusBar() {
  const zoom = useCanvasStore((s) => s.zoom);
  const walls = useEditorStore((s) => s.walls);
  const furniture = useEditorStore((s) => s.furniture);
  const scale = useCanvasStore((s) => s.scale);
  const setShowScale = useUIStore((s) => s.setShowScaleCalibration);

  return (
    <div className="flex h-8 shrink-0 items-center border-t border-gray-200 bg-white px-4 text-xs text-gray-500">
      <div className="flex items-center gap-4">
        <span>Walls: {walls.length}</span>
        <span>Furniture: {furniture.length}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {scale ? (
          <button
            onClick={() => setShowScale(true)}
            className="cursor-pointer text-gray-500 hover:text-blue-600"
            title="Click to recalibrate"
          >
            Scale: 1ft = {scale.pixelsPerFoot.toFixed(0)}px
            <span className="ml-1 text-gray-400">(set)</span>
          </button>
        ) : (
          <button
            onClick={() => setShowScale(true)}
            className="cursor-pointer text-blue-500 hover:text-blue-700"
            title="Calibrate dimensions to a known measurement"
          >
            Set Scale
          </button>
        )}
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
