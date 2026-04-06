// ============================================================
// History Manager -- Command Pattern for Undo/Redo
// ============================================================
import { Command } from '@/types';

const MAX_DEPTH = 200;

export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  push(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > MAX_DEPTH) {
      this.undoStack.shift();
    }
    this.redoStack = []; // clear redo on new action
  }

  undo(): boolean {
    const cmd = this.undoStack.pop();
    if (!cmd) return false;
    cmd.undo();
    this.redoStack.push(cmd);
    return true;
  }

  redo(): boolean {
    const cmd = this.redoStack.pop();
    if (!cmd) return false;
    cmd.execute();
    this.undoStack.push(cmd);
    return true;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoLabel(): string | null {
    const top = this.undoStack[this.undoStack.length - 1];
    return top?.label ?? null;
  }

  get redoLabel(): string | null {
    const top = this.redoStack[this.redoStack.length - 1];
    return top?.label ?? null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
