// ============================================================
// Keyboard Shortcut Handler
// ============================================================
import type { Tool } from '@/types';

export interface UseKeyboardOptions {
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  onRotateSelected: () => void;
  onToolChange: (tool: Tool) => void;
  onNudge: (dx: number, dy: number) => void;
  onSave: () => void;
  onExport: () => void;
  // Pass ref to know if user is typing
  isTyping: () => boolean;
}

/**
 * Register global keyboard shortcuts.
 * Single-key shortcuts (w, s, r) only fire when no input is focused.
 */
export function useKeyboard(opts: UseKeyboardOptions): void {
  if (typeof window === 'undefined') return;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (opts.isTyping() && !e.ctrlKey && !e.metaKey) return;

    // Undo: Cmd+Z or Ctrl+Z
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      opts.onUndo();
      return;
    }

    // Redo: Cmd+Shift+Z or Cmd+Y or Ctrl+Y
    if (
      (e.metaKey || e.ctrlKey) &&
      ((e.key === 'z' && e.shiftKey) || e.key === 'y')
    ) {
      e.preventDefault();
      opts.onRedo();
      return;
    }

    // Save: Cmd+S or Ctrl+S
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      opts.onSave();
      return;
    }

    // Delete / Backspace when not typing
    if (!opts.isTyping() && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      opts.onDeleteSelected();
      return;
    }

    // Rotate: R (only when not typing)
    if (!opts.isTyping() && e.key === 'r') {
      e.preventDefault();
      opts.onRotateSelected();
      return;
    }

    // Arrow keys: nudge
    if (
      !opts.isTyping() &&
      (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')
    ) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowUp') opts.onNudge(0, -step);
      if (e.key === 'ArrowDown') opts.onNudge(0, step);
      if (e.key === 'ArrowLeft') opts.onNudge(-step, 0);
      if (e.key === 'ArrowRight') opts.onNudge(step, 0);
      return;
    }

    // Tool shortcuts (single key, only when not typing and no modifiers)
    if (!opts.isTyping() && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      if (e.key === 'w') {
        opts.onToolChange('draw-wall');
        return;
      }
      if (e.key === 's') {
        opts.onToolChange('select');
        return;
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  // Return cleanup -- used in React's useEffect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (handleKeyDown as any)._cleanup = () => window.removeEventListener('keydown', handleKeyDown);
}
