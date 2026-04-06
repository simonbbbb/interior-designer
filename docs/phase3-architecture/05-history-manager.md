# History Manager (Command Pattern)

## Pattern

```typescript
interface Command {
  execute(canvas: fabric.Canvas, store: UseEditorStore): void;
  undo(canvas: fabric.Canvas, store: UseEditorStore): void;
  readonly label: string;
}

class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxDepth = 200;

  push(cmd, canvas, store) {
    cmd.execute(canvas, store);
    this.undoStack.push(cmd);
    if (this.undoStack.length > this.maxDepth) this.undoStack.shift();
    this.redoStack = [];  // Clear redo on new action
  }

  undo(canvas, store) { /* pop, call undo(), push to redo */ }
  redo(canvas, store) { /* pop, call execute(), push to undo */ }
}
```

## Commands (MVP)

1. AddWallCommand / RemoveWallCommand
2. MoveWallEndpointCommand
3. ModifyWallCommand (parallel shift, type change, resize)
4. AddDoorCommand / RemoveDoorCommand
5. AddWindowCommand / RemoveWindowCommand
6. AddFurnitureCommand / RemoveFurnitureCommand
7. MoveFurnitureCommand
8. RotateFurnitureCommand
9. ScaleFurnitureCommand
10. SetScaleCommand

Each command is reversible. execute() and undo() must be idempotent.
