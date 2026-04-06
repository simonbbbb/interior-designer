# Canvas Component Architecture

## File Structure

```
src/components/editor/
  EditorLayout.tsx                 # Main layout
  Canvas/
    CanvasContainer.tsx            # Fabric.js initialization
    CanvasBackground.tsx           # Background image
    tools/
      DrawWallTool.tsx
      SelectTool.tsx
    objects/
      WallRenderer.tsx
      DoorRenderer.tsx
      WindowRenderer.tsx
      FurnitureRenderer.tsx
    overlays/
      GridOverlay.tsx
      DimensionOverlay.tsx
      SnapGuidesOverlay.tsx
  toolbar/
    Toolbar.tsx
    ToolButton.tsx
  sidebar/
    FurnitureSidebar.tsx
    FurnitureCategory.tsx
    DragPreview.tsx
  modals/
    ScaleCalibrationModal.tsx
    ExportModal.tsx
    UploadModal.tsx
  statusbar/
    StatusBar.tsx
```

## Key Architecture Rule

**Fabric.js objects are NOT React components.**

Fabric.js manages its own render tree. React never re-renders the canvas DOM. React subscribes to Zustand and calls Fabric.js imperatively:

```
canvas.add(new fabric.Line(...))
fabricObject.setCoords()
canvas.renderAll()
```

This keeps the React component tree decoupled from the high-frequency canvas rendering loop. Fabric.js handles its own requestAnimationFrame.

## Canvas Lifecycle

1. CanvasContainer mounts: create Fabric.js canvas on <canvas> element
2. Set up pan/zoom handlers (mouse wheel + click-drag)
3. Subscribe to Zustand stores for walls/doors/windows/furniture
4. On store change: update Fabric objects imperatively (no React render)
5. Register keyboard shortcut handler
6. On object move/rotate/scale: push Command to history store
7. On unmount: dispose Fabric canvas, unsubscribe from stores
