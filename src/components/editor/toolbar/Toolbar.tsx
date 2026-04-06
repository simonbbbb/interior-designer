import { useCallback } from 'react';
import type { Tool } from '@/types';
import { useCanvasStore, useHistoryStore } from '@/store';

interface ToolDef {
  id: Tool;
  label: string;
  icon: string;
  shortcut?: string;
}

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'S' },
  { id: 'draw-wall', label: 'Draw Wall', icon: '╱', shortcut: 'W' },
  { id: 'add-door', label: 'Add Door', icon: '⊓', shortcut: undefined },
  { id: 'add-window', label: 'Add Window', icon: '▭', shortcut: undefined },
  { id: 'pan', label: 'Pan', icon: '✋', shortcut: undefined },
];

export function Toolbar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const setBackgroundImage = useCanvasStore((s) => s.setBackgroundImage);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undoLabel = useHistoryStore((s) => s.undoLabel);
  const redoLabel = useHistoryStore((s) => s.redoLabel);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  const handleToolClick = useCallback(
    (tool: Tool) => {
      setActiveTool(tool);
    },
    [setActiveTool],
  );

  const handleUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [setBackgroundImage]);

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4">
      {/* Logo */}
      <div className="mr-4 flex items-center gap-2">
        <span className="text-lg font-bold text-blue-600">HomeForge</span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200" />

      {/* Tools */}
      <div className="flex items-center gap-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
            className={
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ' +
              (activeTool === tool.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
            }
          >
            <span className="text-base">{tool.icon}</span>
            <span>{tool.label}</span>
            {tool.shortcut && (
              <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
                {tool.shortcut}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          title={`Undo${undoLabel ? `: ${undoLabel}` : ''} (Ctrl+Z)`}
          className={
            'rounded px-2 py-1 text-sm transition-colors ' +
            (canUndo
              ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              : 'cursor-not-allowed text-gray-300')
          }
        >
          ↶ Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title={`Redo${redoLabel ? `: ${redoLabel}` : ''} (Ctrl+Y)`}
          className={
            'rounded px-2 py-1 text-sm transition-colors ' +
            (canRedo
              ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              : 'cursor-not-allowed text-gray-300')
          }
        >
          ↷ Redo
        </button>
      </div>

      <div className="flex-1" />

      {/* Upload */}
      <button
        onClick={handleUpload}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
      >
        Upload Floorplan
      </button>
    </div>
  );
}
