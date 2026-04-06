/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  Canvas as FabricCanvas,
  FabricImage,
  Line,
  Circle,
  Rect,
  FabricText,
  type FabricObject,
  type Point as FabricPoint,
} from 'fabric';
import { useCanvasStore, useEditorStore, useHistoryStore, useUIStore } from '@/store';
import { useKeyboard } from '@/lib/keyboard';
import {
  snapToAngle,
  findWallAtPoint,
  findNearestWallEndpoint,
  feetToPixels,
} from '@/lib/wall-utils';
import {
  screenToCanvas,
  DEFAULT_PPF,
  formatFeet,
} from '@/lib/canvas-utils';
import type { Point, Wall, Door, Window, Tool } from '@/types';

// ============================================================
// Custom Fabric object with our homeforge ID
// ============================================================
interface HFObj {
  homeforgeId?: string;
}

function hfId(obj: FabricObject): string | undefined {
  return (obj as any).homeforgeId as string | undefined;
}

function setHfId(obj: FabricObject, id: string): void {
  (obj as any).homeforgeId = id;
}

// ============================================================
// Draw state (mutable ref, no re-render needed)
// ============================================================
interface DrawState {
  phase: 'idle' | 'wall-drawing';
  startPoint: Point | null;
}

// ============================================================
// Component
// ============================================================

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const drawStateRef = useRef<DrawState>({
    phase: 'idle',
    startPoint: null,
  });

  const zoom = useCanvasStore((s) => s.zoom);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const backgroundImage = useCanvasStore((s) => s.backgroundImage);
  const backgroundOpacity = useCanvasStore((s) => s.backgroundOpacity);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const setSelectedObjectId = useCanvasStore((s) => s.setSelectedObjectId);

  const walls = useEditorStore((s) => s.walls);
  const doors = useEditorStore((s) => s.doors);
  const windows = useEditorStore((s) => s.windows);
  const addWall = useEditorStore((s) => s.addWall);

  // ---- Initialize Fabric.js canvas (once) ----
  useEffect(() => {
    if (!containerRef.current || fabricCanvasRef.current) return;
    const container = containerRef.current;
    const canvasEl = container.querySelector('canvas');
    if (!canvasEl) return;

    // Size the canvas element to fill its container before creating Fabric
    const w = container.clientWidth;
    const h = container.clientHeight;

    const fc = new FabricCanvas(canvasEl, {
      width: w,
      height: h,
      backgroundColor: '#F8FAFC',
      selection: true,
      preserveObjectStacking: true,
    });
    fabricCanvasRef.current = fc;

    // --- Pan ---
    let isPanning = false;
    let lastPoint = { x: 0, y: 0 };

    fc.on('mouse:down', (opt: any) => {
      const e = opt.e as MouseEvent;
      const tool = useCanvasStore.getState().activeTool;
      if (tool === 'pan' || e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning = true;
        lastPoint = { x: e.clientX, y: e.clientY };
        fc.set({ defaultCursor: 'grabbing' } as any);
        fc.discardActiveObject();
        fc.requestRenderAll();
      }
    });

    fc.on('mouse:move', (opt: any) => {
      if (!isPanning) return;
      const e = opt.e as MouseEvent;
      (fc as any).relativePan({
        x: e.clientX - lastPoint.x,
        y: e.clientY - lastPoint.y,
      });
      lastPoint = { x: e.clientX, y: e.clientY };
    });

    fc.on('mouse:up', () => {
      isPanning = false;
      const tool = useCanvasStore.getState().activeTool;
      fc.set({ defaultCursor: tool === 'pan' ? 'grab' : 'default' } as any);
    });

    // --- Zoom ---
    fc.on('mouse:wheel', (opt: any) => {
      const e = opt.e as WheelEvent;
      let z = fc.getZoom();
      z *= 0.999 ** e.deltaY;
      z = Math.min(5, Math.max(0.1, z));
      fc.zoomToPoint(
        { x: e.offsetX, y: e.offsetY } as FabricPoint,
        z,
      );
      e.preventDefault();
      e.stopPropagation();
    });

    fc.on('after:render', () => {
      setZoom(fc.getZoom());
    });

    // --- Selection ---
    fc.on('selection:created', (e: any) => {
      const obj = e.selected?.[0] as FabricObject | undefined;
      if (obj && hfId(obj)) setSelectedObjectId(hfId(obj)!);
    });
    fc.on('selection:updated', (e: any) => {
      const obj = e.selected?.[0] as FabricObject | undefined;
      if (obj && hfId(obj)) setSelectedObjectId(hfId(obj)!);
    });
    fc.on('selection:cleared', () => {
      setSelectedObjectId(null);
    });

    // --- Resize handler ---
    const handleResize = () => {
      const c = fabricCanvasRef.current;
      if (!c) return;
      const cont = c.getElement()?.parentElement;
      if (!cont) return;
      c.setDimensions({
        width: cont.clientWidth,
        height: cont.clientHeight,
      });
      c.requestRenderAll();
    };

    window.addEventListener('resize', handleResize);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Tool cursor ----
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const cursors: Record<string, string> = {
      pan: 'grab',
      'draw-wall': 'crosshair',
      select: 'default',
      'add-door': 'crosshair',
      'add-window': 'crosshair',
    };
    const sel: Record<string, boolean> = {
      pan: false,
      'draw-wall': false,
      select: true,
      'add-door': true,
      'add-window': true,
    };
    fc.set({
      defaultCursor: cursors[activeTool] ?? 'default',
      selection: sel[activeTool] ?? true,
    } as any);
  }, [activeTool]);

  // ---- Background image ----
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    if (backgroundImage) {
      const img = document.createElement('img');
      img.onload = () => {
        const fImg = new FabricImage(img, {
          originX: 'left',
          originY: 'top',
          opacity: backgroundOpacity,
          selectable: false,
          evented: false,
        } as any);
        fc.set('backgroundImage', fImg);
        fc.requestRenderAll();
      };
      img.src = backgroundImage;
    } else {
      fc.set('backgroundImage', null);
      fc.requestRenderAll();
    }
  }, [backgroundImage, backgroundOpacity]);

  // ---- Mouse click handler for all tools ----
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const handleClick = (opt: any) => {
      const e = opt.e as MouseEvent;
      if (e.button !== 0) return;
      const tool = useCanvasStore.getState().activeTool;
      const ppf = DEFAULT_PPF;

      if (tool === 'draw-wall') {
        handleWallDrawClick(e, fc, ppf, drawStateRef, addWall);
      } else if (tool === 'add-door') {
        handleDoorWindowPlacementClick(e, fc, 'add-door');
      } else if (tool === 'add-window') {
        handleDoorWindowPlacementClick(e, fc, 'add-window');
      }
      fc.requestRenderAll();
    };

    fc.on('mouse:down', handleClick);
    return () => {
      fc.off('mouse:down', handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addWall]);

  // ---- Mouse move handler for previews ----
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const handleMove = (opt: any) => {
      const e = opt.e as MouseEvent;
      const ds = drawStateRef.current;
      const tool = useCanvasStore.getState().activeTool;
      const wallsNow = useEditorStore.getState().walls;
      const rect = fc.getElement().getBoundingClientRect();
      const vpt = (fc as any).viewportTransform;
      const cp = screenToCanvas(
        e.clientX,
        e.clientY,
        rect,
        fc.getZoom(),
        vpt,
      );

      // ---- Draw wall preview ----
      if (ds.phase === 'wall-drawing' && ds.startPoint) {
        const snapped = snapToAngle(ds.startPoint, cp);
        const endpointSnap = findNearestWallEndpoint(wallsNow, snapped, 15);
        const finalPoint = endpointSnap?.location ?? snapped;

        // Update preview line
        removeByHfId(fc, 'preview-wall');
        const previewLine = new Line(
          [ds.startPoint.x, ds.startPoint.y, finalPoint.x, finalPoint.y],
          {
            stroke: '#2563EB',
            strokeWidth: 3,
            strokeDashArray: [6, 4],
            selectable: false,
            evented: false,
          } as any,
        );
        setHfId(previewLine, 'preview-wall');
        fc.add(previewLine);

        // Dimension text
        const dx = finalPoint.x - ds.startPoint.x;
        const dy = finalPoint.y - ds.startPoint.y;
        const pixels = Math.sqrt(dx * dx + dy * dy);
        const feet = pixels / DEFAULT_PPF;
        const dimText = formatFeet(feet);

        removeByHfId(fc, 'preview-dim');
        const txt = new FabricText(dimText, {
          left: (ds.startPoint.x + finalPoint.x) / 2,
          top: (ds.startPoint.y + finalPoint.y) / 2 - 16,
          fontSize: 13,
          fill: '#2563EB',
          fontWeight: '600',
          fontFamily: 'Inter, sans-serif',
          selectable: false,
          evented: false,
        } as any);
        setHfId(txt, 'preview-dim');
        fc.add(txt);

        // Snap endpoint indicator
        if (endpointSnap) {
          removeByHfId(fc, 'preview-endpoint-snap');
          const ring = new Circle({
            left: endpointSnap.location.x,
            top: endpointSnap.location.y,
            radius: 8,
            fill: 'transparent',
            stroke: '#10B981',
            strokeWidth: 2,
            selectable: false,
            evented: false,
          } as any);
          setHfId(ring, 'preview-endpoint-snap');
          fc.add(ring);
        } else {
          removeByHfId(fc, 'preview-endpoint-snap');
        }

        // Start point dot
        removeByHfId(fc, 'preview-start-dot');
        const dot = new Circle({
          left: ds.startPoint.x,
          top: ds.startPoint.y,
          radius: 5,
          fill: '#EF4444',
          selectable: false,
          evented: false,
        } as any);
        setHfId(dot, 'preview-start-dot');
        fc.add(dot);
      }
    };

    fc.on('mouse:move', handleMove);
    return () => {
      fc.off('mouse:move', handleMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Tool changes: reset draw state ----
  useEffect(() => {
    const ds = drawStateRef.current;
    const fc = fabricCanvasRef.current;
    if (activeTool !== 'draw-wall' && ds.phase !== 'idle') {
      if (fc) cleanupDrawPreview(fc);
      ds.phase = 'idle';
      ds.startPoint = null;
    }
    if (fc) removeByHfId(fc, 'cursor-wall-highlight');
  }, [activeTool]);

  // ---- Sync walls to canvas ----
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    syncWalls(fc, walls);
  }, [walls]);

  // ---- Sync doors to canvas ----
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    syncDoors(fc, doors, walls);
  }, [doors, walls]);

  // ---- Sync windows to canvas ----
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    syncWindows(fc, windows, walls);
  }, [windows, walls]);

  // ---- Keyboard shortcuts ----
  const isTyping = useCallback(() => {
    const el = document.activeElement;
    return (
      el?.tagName === 'INPUT' ||
      el?.tagName === 'TEXTAREA' ||
      el?.getAttribute('contenteditable') === 'true'
    );
  }, []);

  useKeyboard({
    onUndo: () => useHistoryStore.getState().undo(),
    onRedo: () => useHistoryStore.getState().redo(),
    onDeleteSelected: () => {
      const fc = fabricCanvasRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (active) {
        const objId = hfId(active);
        if (objId?.startsWith('wall_')) {
          useEditorStore.getState().removeWall(objId.replace('wall_', ''));
        } else if (objId?.startsWith('door_')) {
          useEditorStore.getState().removeDoor(objId.replace('door_', ''));
        } else if (objId?.startsWith('window_')) {
          useEditorStore.getState().removeWindow(objId.replace('window_', ''));
        }
        fc.remove(active);
        fc.discardActiveObject();
        fc.requestRenderAll();
      }
    },
    onRotateSelected: () => {
      const fc = fabricCanvasRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (active) {
        active.set({ angle: ((active as any).angle ?? 0) + 90 } as any);
        fc.requestRenderAll();
      }
    },
    onToolChange: (tool: Tool) => setActiveTool(tool),
    onNudge: (dx, dy) => {
      const fc = fabricCanvasRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (active) {
        active.set({
          left: ((active as any).left ?? 0) + dx,
          top: ((active as any).top ?? 0) + dy,
        } as any);
        fc.requestRenderAll();
      }
    },
    onSave: () => {
      const state = useEditorStore.getState();
      localStorage.setItem(
        'homeforge-project',
        JSON.stringify({
          walls: state.walls,
          doors: state.doors,
          windows: state.windows,
          furniture: state.furniture,
        }),
      );
    },
    onExport: () => {
      const fc = fabricCanvasRef.current;
      if (!fc) return;
      const dataUrl = (fc as any).toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });
      const link = document.createElement('a');
      link.download = 'homeforge-plan.png';
      link.href = dataUrl;
      link.click();
    },
    isTyping,
  });

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <canvas className="block h-full w-full" />
      {activeTool === 'draw-wall' && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <div className="rounded bg-gray-900 px-3 py-1 text-xs text-white opacity-80">
            Click to start wall, click again to end &bull; Escape to cancel
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Wall draw handler
// ============================================================

function handleWallDrawClick(
  e: MouseEvent,
  canvas: FabricCanvas,
  _ppf: number,
  dsRef: React.MutableRefObject<DrawState>,
  addWallFn: (wall: Wall) => void,
) {
  const ds = dsRef.current;
  const fc = canvas;
  const rect = fc.getElement().getBoundingClientRect();
  const vpt = (fc as any).viewportTransform;
  const cp = screenToCanvas(
    e.clientX,
    e.clientY,
    rect,
    fc.getZoom(),
    vpt,
  );
  const wallsNow = useEditorStore.getState().walls;

  // ---- FIRST CLICK ----
  if (ds.phase !== 'wall-drawing') {
    const endpointSnap = findNearestWallEndpoint(wallsNow, cp, 15);
    const startPoint = endpointSnap?.location ?? cp;

    ds.phase = 'wall-drawing';
    ds.startPoint = startPoint;

    // Draw start point dot
    const dot = new Circle({
      left: startPoint.x,
      top: startPoint.y,
      radius: 5,
      fill: '#EF4444',
      selectable: false,
      evented: false,
    } as any);
    setHfId(dot, 'preview-start-dot');
    fc.add(dot);
    fc.requestRenderAll();
    return;
  }

  // ---- SECOND CLICK: place the wall ----
  if (ds.phase === 'wall-drawing' && ds.startPoint) {
    const snapped = snapToAngle(ds.startPoint, cp);
    const endpointSnap = findNearestWallEndpoint(wallsNow, snapped, 15);
    const endPoint = endpointSnap?.location ?? snapped;

    let startPoint = ds.startPoint;
    const startSnap = findNearestWallEndpoint(wallsNow, startPoint, 15);
    if (startSnap) {
      startPoint = startSnap.location;
    }

    // Don't create degenerate walls
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      cleanupDrawPreview(fc);
      ds.phase = 'idle';
      ds.startPoint = null;
      return;
    }

    const wallId = crypto.randomUUID();
    const wall: Wall = {
      id: wallId,
      start: { x: startPoint.x, y: startPoint.y },
      end: { x: endPoint.x, y: endPoint.y },
      type: 'standard',
      thickness: 6,
      source: 'manual',
    };

    addWallFn(wall);
    cleanupDrawPreview(fc);
    ds.phase = 'idle';
    ds.startPoint = null;
  }
}

// ============================================================
// Door / Window placement handler
// ============================================================

function handleDoorWindowPlacementClick(
  e: MouseEvent,
  canvas: FabricCanvas,
  tool: 'add-door' | 'add-window',
) {
  const fc = canvas;
  const rect = fc.getElement().getBoundingClientRect();
  const vpt = (fc as any).viewportTransform;
  const cp = screenToCanvas(
    e.clientX,
    e.clientY,
    rect,
    fc.getZoom(),
    vpt,
  );
  const wallsNow = useEditorStore.getState().walls;
  const found = findWallAtPoint(wallsNow, cp, 15);
  if (!found) return;

  const wall = found.wall;
  const offset = Math.sqrt(
    (cp.x - wall.start.x) ** 2 + (cp.y - wall.start.y) ** 2,
  );
  const width = feetToPixels(3, DEFAULT_PPF); // 3 feet default

  if (tool === 'add-door') {
    useEditorStore.getState().addDoor({
      id: crypto.randomUUID(),
      wallId: wall.id,
      offsetFromStart: offset,
      width,
      swingDirection: 'right',
    });
  } else {
    useEditorStore.getState().addWindow({
      id: crypto.randomUUID(),
      wallId: wall.id,
      offsetFromStart: offset,
      width,
      sillHeight: 3,
    });
  }

  useCanvasStore.getState().setActiveTool('select');
}

// ============================================================
// Sync walls to Fabric canvas
// ============================================================

function syncWalls(canvas: FabricCanvas, walls: Wall[]) {
  const expected = new Set(walls.map((w) => `wall_${w.id}`));

  // Remove stale
  const staleIds = [
    'preview-wall',
    'preview-dim',
    'preview-start-dot',
    'preview-endpoint-snap',
    'cursor-wall-highlight',
  ];
  canvas.getObjects().forEach((obj) => {
    const id = hfId(obj);
    if (id && id.startsWith('wall_') && !expected.has(id)) {
      canvas.remove(obj);
    }
  });

  // Add / update
  for (const wall of walls) {
    const fabricId = `wall_${wall.id}`;
    const style = getWallStyle(wall.type);
    const existing = canvas
      .getObjects()
      .find((o) => hfId(o) === fabricId);

    if (existing) {
      existing.set({
        x1: wall.start.x,
        y1: wall.start.y,
        x2: wall.end.x,
        y2: wall.end.y,
        stroke: style.color,
        strokeWidth: style.thickness,
        strokeDashArray: style.dashed ? [8, 4] : undefined,
      } as any);
    } else {
      const line = new Line(
        [wall.start.x, wall.start.y, wall.end.x, wall.end.y],
        {
          stroke: style.color,
          strokeWidth: style.thickness,
          strokeLineCap: 'square',
          selectable: true,
          borderColor: '#2563EB',
          cornerColor: '#2563EB',
          cornerSize: 10,
          transparentCorners: false,
          ...(style.dashed ? { strokeDashArray: [8, 4] } : {}),
        },
      );
      setHfId(line, fabricId);
      canvas.add(line);
    }
  }

  canvas.requestRenderAll();
}

// ============================================================
// Sync doors to Fabric canvas
// ============================================================

function syncDoors(canvas: FabricCanvas, doors: Door[], walls: Wall[]) {
  removeByPrefix(canvas, 'door_');
  const wallMap = new Map(walls.map((w) => [w.id, w]));

  for (const door of doors) {
    const wall = wallMap.get(door.wallId);
    if (!wall) continue;

    const wallLen = Math.sqrt(
      (wall.end.x - wall.start.x) ** 2 +
        (wall.end.y - wall.start.y) ** 2,
    );
    if (wallLen === 0) continue;
    const t = door.offsetFromStart / wallLen;
    if (t < 0 || t > 1) continue;

    const px = wall.start.x + (wall.end.x - wall.start.x) * t;
    const py = wall.start.y + (wall.end.y - wall.start.y) * t;
    const angleDeg =
      (Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) *
        180) /
      Math.PI;

    // Gap (white rect over wall)
    const gap = new Rect({
      left: px,
      top: py,
      width: door.width,
      height: 16,
      originX: 'center',
      originY: 'center',
      fill: '#F8FAFC',
      stroke: null,
      angle: angleDeg,
      selectable: false,
      evented: false,
    } as any);
    setHfId(gap, `door_${door.id}-gap`);
    canvas.add(gap);

    // Door panel line (perpendicular to wall, showing swing side)
    const perpAngle = angleDeg + 90;
    const panelLen = door.width;
    const endX = px + Math.cos((perpAngle * Math.PI) / 180) * panelLen;
    const endY = py + Math.sin((perpAngle * Math.PI) / 180) * panelLen;

    const panel = new Line([px, py, endX, endY], {
      stroke: '#B45309',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    } as any);
    setHfId(panel, `door_${door.id}-panel`);
    canvas.add(panel);

    // Arc showing door swing
    const arcPath = `M ${px} ${py} Q ${(px + endX) / 2 + 10} ${(py + endY) / 2 + 10} ${endX} ${endY}`;
  }

  canvas.requestRenderAll();
}

// ============================================================
// Sync windows to Fabric canvas
// ============================================================

function syncWindows(canvas: FabricCanvas, windows: Window[], walls: Wall[]) {
  removeByPrefix(canvas, 'window_');
  const wallMap = new Map(walls.map((w) => [w.id, w]));

  for (const win of windows) {
    const wall = wallMap.get(win.wallId);
    if (!wall) continue;

    const wallLen = Math.sqrt(
      (wall.end.x - wall.start.x) ** 2 +
        (wall.end.y - wall.start.y) ** 2,
    );
    if (wallLen === 0) continue;
    const t = win.offsetFromStart / wallLen;
    if (t < 0 || t > 1) continue;

    const px = wall.start.x + (wall.end.x - wall.start.x) * t;
    const py = wall.start.y + (wall.end.y - wall.start.y) * t;
    const angleDeg =
      (Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) *
        180) /
      Math.PI;

    const winRect = new Rect({
      left: px,
      top: py,
      width: win.width,
      height: 10,
      originX: 'center',
      originY: 'center',
      fill: '#4DA6C8',
      stroke: '#2563EB',
      strokeWidth: 1.5,
      angle: angleDeg,
      selectable: true,
      borderColor: '#2563EB',
      cornerColor: '#2563EB',
      cornerSize: 8,
      transparentCorners: false,
    } as any);
    setHfId(winRect, `window_${win.id}`);
    canvas.add(winRect);
  }

  canvas.requestRenderAll();
}

// ============================================================
// Helpers
// ============================================================

function getWallStyle(type: string) {
  switch (type) {
    case 'standard':
      return { color: '#333333', thickness: 6, dashed: false };
    case 'half':
      return { color: '#888888', thickness: 4, dashed: false };
    case 'glass':
      return { color: '#4DA6C8', thickness: 3, dashed: true };
    default:
      return { color: '#333333', thickness: 6, dashed: false };
  }
}

function removeByHfId(canvas: FabricCanvas, id: string) {
  const obj = canvas.getObjects().find((o) => hfId(o) === id);
  if (obj) canvas.remove(obj);
}

function removeByPrefix(canvas: FabricCanvas, prefix: string) {
  const toRemove = canvas
    .getObjects()
    .filter((o) => hfId(o)?.startsWith(prefix));
  toRemove.forEach((o) => canvas.remove(o));
}

function cleanupDrawPreview(canvas: FabricCanvas) {
  ['preview-wall', 'preview-dim', 'preview-start-dot', 'preview-endpoint-snap'].forEach(
    (id) => removeByHfId(canvas, id),
  );
}
