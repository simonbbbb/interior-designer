import { create } from 'zustand';
import { HistoryManager } from '@/lib/history';
import type { Command } from '@/types';

interface HistoryStore {
  manager: HistoryManager;
  undoLabel: string | null;
  redoLabel: string | null;
  canUndo: boolean;
  canRedo: boolean;

  pushCommand: (cmd: Command) => void;
  undo: () => boolean;
  redo: () => boolean;
  clear: () => void;
  refreshLabels: () => void;
}

const manager = new HistoryManager();

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  manager,
  undoLabel: manager.undoLabel,
  redoLabel: manager.redoLabel,
  canUndo: manager.canUndo,
  canRedo: manager.canRedo,

  pushCommand: (cmd) => {
    manager.push(cmd);
    set({
      undoLabel: manager.undoLabel,
      redoLabel: manager.redoLabel,
      canUndo: manager.canUndo,
      canRedo: manager.canRedo,
    });
  },

  undo: () => {
    const ok = manager.undo();
    set({
      undoLabel: manager.undoLabel,
      redoLabel: manager.redoLabel,
      canUndo: manager.canUndo,
      canRedo: manager.canRedo,
    });
    return ok;
  },

  redo: () => {
    const ok = manager.redo();
    set({
      undoLabel: manager.undoLabel,
      redoLabel: manager.redoLabel,
      canUndo: manager.canUndo,
      canRedo: manager.canRedo,
    });
    return ok;
  },

  clear: () => {
    manager.clear();
    set({
      undoLabel: null,
      redoLabel: null,
      canUndo: false,
      canRedo: false,
    });
  },

  refreshLabels: () => {
    set({
      undoLabel: manager.undoLabel,
      redoLabel: manager.redoLabel,
      canUndo: manager.canUndo,
      canRedo: manager.canRedo,
    });
  },
}));
