'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  Canvas as FabricCanvas,
  FabricImage,
  Line,
  type FabricObject,
  type Point as FabricPoint,
} from 'fabric';
// Note: Fabric v7 ships ESM-only, but @types/fabric targets v5.
// We augment with our own type for the custom property.
import { useCanvasStore, useEditorStore, useHistoryStore } from '@/store';
import { useKeyboard } from '@/lib/keyboard';

/** Custom property bag we attach to Fabric objects */
interface CustomFabricObject extends FabricObject {
  homeforgeId?: string;
}

/**
 * Main Fabric.js canvas component.
 * Fabric.js manages its own render tree. React only subscribes to stores
 * and calls Fabric.js imperatively.
 *
 * Fabric v7 uses modular ESM exports (no namespace object).
 * Shapes are instantiated directly: new Line([...]), new FabricImage().
 */
export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);

  const zoom = useCanvasStore((s) => s.zoom);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const backgroundImage = useCanvasStore((s) => s.backgroundImage);
  const backgroundOpacity = useCanvasStore((s) => s.backgroundOpacity);
  const selectedObjectId = useCanvasStore((s) => s.selectedObjectId);
  const setSelectedObjectId = useCanvasStore((s) => s.setSelectedObjectId);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  const walls = useEditorStore((s) => s.walls);

  // Track which Fabric object IDs we've rendered
  const renderedIdsRef = useRef<Set<string>>(new Set());

  /** Initialize Fabric.js canvas (runs once on mount) */
  useEffect(() => {
    if (!containerRef.current || fabricCanvasRef.current) return;

    const canvasEl = containerRef.current.querySelector('canvas');
    if (!canvasEl) return;

    const canvas = new FabricCanvas(canvasEl, {
      backgroundColor: '#F8FAFC',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    // --- Pan (middle mouse or alt+click or pan tool) ---
    let isPanning = false;
    let lastPoint = { x: 0, y: 0 };

    canvas.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent;
      const isPanTool = useCanvasStore.getState().activeTool === 'pan';
      if (isPanTool || e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning = true;
        lastPoint = { x: e.clientX, y: e.clientY };
        canvas.set({ defaultCursor: 'grabbing' });
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (!isPanning) return;
      const e = opt.e as MouseEvent;
      const dx = e.clientX - lastPoint.x;
      const dy = e.clientY - lastPoint.y;
      lastPoint = { x: e.clientX, y: e.clientY };
      canvas.relativePan({ x: dx, y: dy } as FabricPoint);
    });

    canvas.on('mouse:up', () => {
      isPanning = false;
      const tool = useCanvasStore.getState().activeTool;
      canvas.set({ defaultCursor: tool === 'pan' ? 'grab' : 'default' });
    });

    // --- Zoom with wheel ---
    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent;
      let z = canvas.getZoom();
      z *= 0.999 ** e.deltaY;
      z = Math.min(5, Math.max(0.1, z));
      canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY } as FabricPoint, z);
      e.preventDefault();
      e.stopPropagation();
    });

    // --- Sync zoom to Zustand ---
    canvas.on('after:render', () => {
      setZoom(canvas.getZoom());
    });

    // --- Selection tracking ---
    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0] as CustomFabricObject | undefined;
      if (obj?.homeforgeId) setSelectedObjectId(obj.homeforgeId);
    });

    canvas.on('selection:updated', (e) => {
      const obj = e.selected?.[0] as CustomFabricObject | undefined;
      if (obj?.homeforgeId) setSelectedObjectId(obj.homeforgeId);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObjectId(null);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Active tool cursor ---
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const cursors: Record<string, string> = {
      pan: 'grab',
      'draw-wall': 'crosshair',
      select: 'default',
      'add-door': 'crosshair',
      'add-window': 'crosshair',
    };
    const selections: Record<string, boolean> = {
      pan: false,
      'draw-wall': false,
      select: true,
      'add-door': true,
      'add-window': true,
    };
    canvas.set({
      defaultCursor: cursors[activeTool] ?? 'default',
      selection: selections[activeTool] ?? true,
    });
  }, [activeTool]);

  // --- Background image ---
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (backgroundImage) {
      const img = document.createElement('img');
      img.onload = () => {
        const fImg = new FabricImage(img, {
          originX: 'left' as const,
          originY: 'top' as const,
          opacity: backgroundOpacity,
          selectable: false,
          evented: false,
        });
        canvas.set('backgroundImage', fImg);
        canvas.requestRenderAll();
      };
      img.src = backgroundImage;
    } else {
      canvas.set('backgroundImage', null);
      canvas.requestRenderAll();
    }
  }, [backgroundImage, backgroundOpacity]);

  // --- Render walls from Zustand store ---
  const syncWalls = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const expected = new Set(walls.map((w) => `wall_${w.id}`));

    // Remove stale Fabric objects
    const toRemove: CustomFabricObject[] = [];
    canvas.getObjects().forEach((obj) => {
      const custom = obj as CustomFabricObject;
      const id = custom.homeforgeId;
      if (id?.startsWith('wall_') && !expected.has(id)) {
        toRemove.push(custom);
      }
    });
    toRemove.forEach((o) => canvas.remove(o));

    // Add/update walls
    for (const wall of walls) {
      const fabricId = `wall_${wall.id}`;
      const style = getWallStyle(wall.type);
      const existing = canvas.getObjects().find(
        (o) => (o as CustomFabricObject).homeforgeId === fabricId,
      );

      if (existing) {
        existing.set({
          x1: wall.start.x,
          y1: wall.start.y,
          x2: wall.end.x,
          y2: wall.end.y,
          stroke: style.color,
          strokeWidth: style.thickness,
          strokeDashArray: style.dashed ? ([8, 4] as number[]) : ([] as number[]),
        });
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
        (line as CustomFabricObject).homeforgeId = fabricId;
        canvas.add(line);
      }
    }

    if (walls.length > 0 || toRemove.length > 0) {
      renderedIdsRef.current = expected;
      canvas.requestRenderAll();
    }
  }, [walls]);

  useEffect(() => {
    syncWalls();
  }, [walls, syncWalls]);

  // --- Furniture drag-drop handling ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer?.getData('application/json');
      if (!data) return;

      try {
        const item = JSON.parse(data);
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getElement().getBoundingClientRect();
        const vpt = canvas.viewportTransform;
        const canvasX =
          (e.clientX - rect.left) / canvas.getZoom() - (vpt?.[4] ?? 0);
        const canvasY =
          (e.clientY - rect.top) / canvas.getZoom() - (vpt?.[5] ?? 0);

        const instance = {
          id: crypto.randomUUID(),
          definitionId: item.id,
          x: canvasX,
          y: canvasY,
          rotation: 0,
          width: item.width * 30,
          height: item.depth * 30,
        };
        console.log('[Canvas] Drop furniture:', instance);
        useEditorStore.getState().addFurniture(instance);
      } catch (err) {
        console.error('[Canvas] Drop failed:', err);
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, []);

  // --- Keyboard shortcuts ---
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
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active) {
        const custom = active as CustomFabricObject;
        const objId = custom.homeforgeId;
        if (objId?.startsWith('wall_')) {
          useEditorStore
            .getState()
            .removeWall(objId.replace('wall_', ''));
        }
        canvas.remove(active);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }
    },
    onRotateSelected: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active) {
        const angle = (active.angle ?? 0) + 90;
        active.set({ angle });
        canvas.requestRenderAll();
      }
    },
    onToolChange: (tool) => setActiveTool(tool),
    onNudge: (dx, dy) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active) {
        active.set({
          left: (active.left ?? 0) + dx,
          top: (active.top ?? 0) + dy,
        });
        canvas.requestRenderAll();
      }
    },
    onSave: () => {
      const state = useEditorStore.getState();
      const data = JSON.stringify({
        walls: state.walls,
        doors: state.doors,
        windows: state.windows,
        furniture: state.furniture,
      });
      localStorage.setItem('homeforge-project', data);
    },
    onExport: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL({
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
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded bg-gray-900 px-3 py-1 text-xs text-white opacity-80">
          Click to place wall start, then click to set end point
        </div>
      )}
    </div>
  );
}

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
