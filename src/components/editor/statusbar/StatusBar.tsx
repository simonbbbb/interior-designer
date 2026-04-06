'use client';

import { useCanvasStore, useEditorStore, useHistoryStore } from '@/store';

export function StatusBar() {
  const zoom = useCanvasStore((s) => s.zoom);
  const walls = useEditorStore((s) => s.walls);
  const furniture = useEditorStore((s) => s.furniture);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undoLabel = useHistoryStore((s) => s.undoLabel);
  const redoLabel = useHistoryStore((s) => s.redoLabel);

  return (
    <div className="flex h-8 shrink-0 items-center border-t border-gray-200 bg-white px-4 text-xs text-gray-500">
      <div className="flex items-center gap-4">
        <span>Walls: {walls.length}</span>
        <span>Furniture: {furniture.length}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {canUndo && (
          <span className="text-gray-400">
            Undo: {undoLabel}
          </span>
        )}
        {canRedo && (
          <span className="text-gray-400">
            Redo: {redoLabel}
          </span>
        )}
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
