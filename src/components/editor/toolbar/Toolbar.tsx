'use client';

import { useCallback } from 'react';
import type { Tool, WallType } from '@/types';
import { useCanvasStore, useHistoryStore, useEditorStore, useUIStore } from '@/store';

interface ToolDef {
  id: Tool;
  label: string;
  icon: string;
  shortcut?: string;
}

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'S' },
  { id: 'draw-wall', label: 'Draw Wall', icon: '╱', shortcut: 'W' },
  { id: 'add-door', label: 'Add Door', icon: '⊓' },
  { id: 'add-window', label: 'Add Window', icon: '▭' },
  { id: 'pan', label: 'Pan', icon: '✋' },
];

const WALL_TYPES: { type: WallType; icon: string; label: string }[] = [
  { type: 'standard', icon: '━', label: 'Standard' },
  { type: 'half', icon: '┈', label: 'Half Wall' },
  { type: 'glass', icon: '┄┄', label: 'Glass' },
];

export function Toolbar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const selectedId = useCanvasStore((s) => s.selectedObjectId);
  const setShowUploadModal = useUIStore((s) => s.setShowUploadModal);
  const walls = useEditorStore((s) => s.walls);
  const updateWall = useEditorStore((s) => s.updateWall);

  // Find selected wall to show its type in the selector
  const selectedWall = selectedId
    ? walls.find((w) => w.id === selectedId)
    : null;

  const handleToolClick = useCallback(
    (t: Tool) => setActiveTool(t),
    [setActiveTool],
  );

  const handleWallTypeChange = useCallback(
    (wt: WallType) => {
      if (selectedId) {
        updateWall(selectedId, { type: wt });
      }
    },
    [selectedId, updateWall],
  );

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4">
      {/* Logo */}
      <div className="mr-4 flex items-center gap-2">
        <span className="text-lg font-bold text-blue-600">HomeForge</span>
      </div>
      <div className="h-6 w-px bg-gray-200" />

      {/* Tools */}
      <div className="flex items-center gap-1">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleToolClick(t.id)}
            title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
            className={
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ' +
              (activeTool === t.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
            }
          >
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
            {t.shortcut && (
              <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
                {t.shortcut}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-gray-200" />

      {/* Wall Type Selector - only active when a wall is selected */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-gray-400">Wall:</span>
        {WALL_TYPES.map((wt) => (
          <button
            key={wt.type}
            onClick={() => handleWallTypeChange(wt.type)}
            disabled={!selectedWall}
            title={wt.label}
            className={
              'flex items-center rounded-md px-2.5 py-1.5 text-sm transition-colors font-mono ' +
              (!selectedWall
                ? 'cursor-not-allowed text-gray-200'
                : selectedWall?.type === wt.type
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 border border-transparent')
            }
          >
            {wt.icon}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Upload */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
      >
        Upload
      </button>
    </div>
  );
}