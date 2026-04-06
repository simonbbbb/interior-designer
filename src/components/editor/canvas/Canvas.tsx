'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  Canvas as FabricCanvas,
  FabricImage,
  Line,
  Rect,
  Circle,
  Text as FabricText,
  Group,
  type FabricObject,
  type Point as FabricPoint,
} from 'fabric';
import { useCanvasStore, useEditorStore, useHistoryStore } from '@/store';
import { useKeyboard } from '@/lib/keyboard';
import {
  snapToAngle,
  findNearestWallEndpoint,
  findWallAtPoint,
  feetToPixels,
} from '@/lib/wall-utils';
import { screenToCanvas, DEFAULT_PPF, formatFeet } from '@/lib/canvas-utils';
import { getWallLengthFeet } from '@/lib/export-utils';
import { furnitureOverlapsWall, findFurnitureDefinition } from '@/lib/furniture-utils';
import type { Point, Wall, Door, Window, Tool, FurnitureInstance } from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Obj = FabricObject & { _hfId?: string };

// ============================================================
// Draw state
// ============================================================
interface DrawWall {
  phase: 'idle' | 'started';
  first: Point | null;
  dot: Obj | null;
  line: Line | null;
  dim: FabricText | null;
  snapCircle: Circle | null;
}

const GRID_SPACING = 30; // 1 foot in pixels at DEFAULT_PPF

// ============================================================
// Helpers
// ============================================================
function getId(o: FabricObject): string | undefined {
  return (o as Obj)._hfId;
}
function sid(o: Obj, id: string) {
  o._hfId = id;
}
function removeByPrefix(canvas: FabricCanvas, prefix: string) {
  canvas
    .getObjects()
    .filter((o) => getId(o)?.startsWith(prefix))
    .forEach((o) => canvas.remove(o));
}
function removeById(canvas: FabricCanvas, id: string) {
  const o = canvas.getObjects().find((x) => getId(x) === id);
  if (o) canvas.remove(o);
}

function wallStyle(t: string) {
  switch (t) {
    case 'half':
      return { c: '#888888', w: 4, d: false };
    case 'glass':
      return { c: '#4DA6C8', w: 3, d: true };
    default:
      return { c: '#333333', w: 6, d: false };
  }
}

// ============================================================
// Component
// ============================================================
export function Canvas() {
  const divRef = useRef<HTMLDivElement>(null);
  const fcRef = useRef<FabricCanvas | null>(null);
  const dwRef = useRef<DrawWall>({ phase: 'idle', first: null, dot: null, line: null, dim: null, snapCircle: null });

  const zoom = useCanvasStore((s) => s.zoom);
  const tool = useCanvasStore((s) => s.activeTool);
  const bgImage = useCanvasStore((s) => s.backgroundImage);
  const bgOpacity = useCanvasStore((s) => s.backgroundOpacity);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setTool = useCanvasStore((s) => s.setActiveTool);
  const walls = useEditorStore((s) => s.walls);
  const doors = useEditorStore((s) => s.doors);
  const windows = useEditorStore((s) => s.windows);
  const furniture = useEditorStore((s) => s.furniture);

  // ========== INIT ==========
  useEffect(() => {
    if (!divRef.current || fcRef.current) return;
    const el = divRef.current.querySelector('canvas')!;

    // Size before creating
    const W = divRef.current.clientWidth;
    const H = divRef.current.clientHeight;

    const fc = new FabricCanvas(el, { width: W, height: H, backgroundColor: '#F8FAFC', selection: true });
    fcRef.current = fc;

    // ---- grid ----
    drawGrid(fc);

    // ---- pan ----
    let panning = false;
    let last = { x: 0, y: 0 };
    fc.on('mouse:down', (o: any) => {
      const e = o.e as MouseEvent;
      const t = useCanvasStore.getState().activeTool;
      if (t === 'pan' || e.button === 1 || (e.button === 0 && e.altKey)) {
        panning = true;
        last = { x: e.clientX, y: e.clientY };
        fc.set({ defaultCursor: 'grabbing' });
        fc.discardActiveObject();
        fc.requestRenderAll();
      }
    });
    fc.on('mouse:move', (o: any) => {
      if (!panning) return;
      const e = o.e as MouseEvent;
      (fc as any).relativePan({ x: e.clientX - last.x, y: e.clientY - last.y });
      last = { x: e.clientX, y: e.clientY };
    });
    fc.on('mouse:up', () => {
      panning = false;
      const t = useCanvasStore.getState().activeTool;
      fc.set({ defaultCursor: t === 'pan' ? 'grab' : 'default' });
    });

    // ---- zoom ----
    fc.on('mouse:wheel', (o: any) => {
      const e = o.e as WheelEvent;
      let z = fc.getZoom();
      z *= 0.999 ** e.deltaY;
      z = Math.min(5, Math.max(0.1, z));
      fc.zoomToPoint({ x: e.offsetX, y: e.offsetY } as FabricPoint, z);
      e.preventDefault();
      e.stopPropagation();
    });

    fc.on('after:render', () => setZoom(fc.getZoom()));

    fc.on('selection:created', (e: any) => {
      const obj = e.selected?.[0];
      if (obj) useCanvasStore.getState().setSelectedObjectId(getId(obj) ?? null);
    });
    fc.on('selection:cleared', () => useCanvasStore.getState().setSelectedObjectId(null));

    // ---- wall draw (click handler) ----
    fc.on('mouse:down', (o: any) => {
      const e = o.e as MouseEvent;
      if (e.button !== 0) return;
      const t = useCanvasStore.getState().activeTool;
      if (t === 'draw-wall') onWallClick(e, fc);
      if (t === 'add-door' || t === 'add-window') onPlaceOnWallClick(e, fc, t as 'add-door' | 'add-window');
      fc.requestRenderAll();
    });

    // ---- wall draw move (preview) ----
    fc.on('mouse:move', (o: any) => {
      const e = o.e as MouseEvent;
      const t = useCanvasStore.getState().activeTool;
      if (t !== 'draw-wall') return;
      onWallMouseMove(e, fc);
    });

    // ---- object move -> sync store ----
    fc.on('object:moving', () => syncObjectToStore(fc));
    fc.on('object:scaling', () => syncObjectToStore(fc));

    // ---- resize ----
    const onResize = () => {
      const c = divRef.current;
      if (!c) return;
      fc.setDimensions({ width: c.clientWidth, height: c.clientHeight });
      drawGrid(fc);
      fc.requestRenderAll();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      fc.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== TOOL CURSOR ==========
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    const map: Record<string, { c: string; s: boolean }> = {
      select: { c: 'default', s: true },
      'draw-wall': { c: 'crosshair', s: false },
      'add-door': { c: 'crosshair', s: false },
      'add-window': { c: 'crosshair', s: false },
      pan: { c: 'grab', s: false },
    };
    const m = map[tool] ?? map.select;
    fc.set({ defaultCursor: m.c, selection: m.s });
  }, [tool]);

  // ========== BG IMAGE ==========
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    if (!bgImage) {
      fc.set('backgroundImage', null);
      fc.requestRenderAll();
      return;
    }
    const img = document.createElement('img');
    img.onload = () => {
      const W = fc.getWidth();
      const H = fc.getHeight();
      const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight) * 0.9;
      const scaledW = img.naturalWidth * scale;
      const scaledH = img.naturalHeight * scale;
      const fImg = new FabricImage(img, {
        left: (W - scaledW) / 2,
        top: (H - scaledH) / 2,
        scaleX: scale,
        scaleY: scale,
        opacity: bgOpacity,
        selectable: false,
        evented: false,
      });
      fc.set('backgroundImage', fImg);
      fc.requestRenderAll();
    };
    img.src = bgImage;
  }, [bgImage, bgOpacity]);

  // ========== SYNC WALLS ==========
  useEffect(() => {
    syncWalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walls]);

  // ========== SYNC DOORS ==========
  useEffect(() => {
    syncDoors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doors, walls]);

  // ========== SYNC WINDOWS ==========
  useEffect(() => {
    syncWindows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windows, walls]);

  // ========== SYNC FURNITURE ==========
  useEffect(() => {
    syncFurniture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [furniture, walls]);

  // ========== TOOL CHANGE: reset draw state ==========
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    if (tool !== 'draw-wall') clearDrawPreview(fc);
  }, [tool]);

  // ========== KEYBOARD ==========
  const isTyping = useCallback(() => {
    const el = document.activeElement;
    return el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA';
  }, []);

  useKeyboard({
    onUndo: () => {
      // Phase: undo is wired to history store but not connected yet
      // For now, this is a no-op until we integrate the command pattern
    },
    onRedo: () => {},
    onDeleteSelected: () => {
      const fc = fcRef.current;
      if (!fc) return;
      const active = fc.getActiveObjects();
      for (const obj of active) {
        const id = getId(obj);
        if (id?.startsWith('wall_')) useEditorStore.getState().removeWall(id.replace('wall_', ''));
        else if (id?.startsWith('furniture_')) useEditorStore.getState().removeFurniture(id.replace('furniture_', ''));
        else if (id?.startsWith('door_')) useEditorStore.getState().removeDoor(id.replace('door_', ''));
        else if (id?.startsWith('window_')) useEditorStore.getState().removeWindow(id.replace('window_', ''));
        fc.remove(obj);
      }
      fc.discardActiveObject();
      fc.requestRenderAll();
    },
    onRotateSelected: () => {
      const fc = fcRef.current;
      if (!fc) return;
      const a = fc.getActiveObject();
      if (a) {
        a.set({ angle: (a as any).angle + 90 });
        fc.requestRenderAll();
      }
    },
    onToolChange: (t: Tool) => setTool(t),
    onNudge: (dx, dy) => {
      const fc = fcRef.current;
      if (!fc) return;
      const a = fc.getActiveObject();
      if (a) {
        a.set({ left: (a as any).left + dx, top: (a as any).top + dy });
        fc.requestRenderAll();
      }
    },
    onSave: () => {
      const s = useEditorStore.getState();
      localStorage.setItem('homeforge-project', JSON.stringify({ walls: s.walls, doors: s.doors, windows: s.windows, furniture: s.furniture }));
    },
    onExport: () => {
      const fc = fcRef.current;
      if (!fc) return;
      const url = (fc as any).toDataURL({ format: 'png', multiplier: 2 });
      const a = document.createElement('a');
      a.download = 'homeforge-plan.png';
      a.href = url;
      a.click();
    },
    isTyping,
  });

  return (
    <div ref={divRef} className="relative h-full w-full overflow-hidden">
      <canvas className="block h-full w-full" />
    </div>
  );

  // ========== INLINE HANDLERS ==========

  function onWallClick(e: MouseEvent, fc: FabricCanvas) {
    const dw = dwRef.current;
    const rect = fc.getElement().getBoundingClientRect();
    const cp = screenToCanvas(e.clientX, e.clientY, rect, fc.getZoom(), (fc as any).viewportTransform);
    const ws = useEditorStore.getState().walls;

    if (dw.phase !== 'started') {
      // FIRST CLICK
      const snap = findNearestWallEndpoint(ws, cp);
      const pt = snap ?? cp;
      dw.phase = 'started';
      dw.first = pt;

      dw.dot = new Circle({ left: pt.x - 4, top: pt.y - 4, radius: 4, fill: '#EF4444', selectable: false, evented: false });
      fc.add(dw.dot);
      fc.requestRenderAll();
    } else {
      // SECOND CLICK
      const snapped = snapToAngle(dw.first!, cp);
      const epSnap = findNearestWallEndpoint(ws, snapped);
      const end = epSnap ?? snapped;

      const dist = Math.sqrt((end.x - dw.first!.x) ** 2 + (end.y - dw.first!.y) ** 2);
      if (dist < 5) {
        clearDrawPreview(fc);
        return;
      }

      const wall: Wall = {
        id: crypto.randomUUID(),
        start: { x: dw.first!.x, y: dw.first!.y },
        end: { x: end.x, y: end.y },
        type: 'standard',
        thickness: 6,
        source: 'manual',
      };
      useEditorStore.getState().addWall(wall);
      clearDrawPreview(fc);
    }
  }

  function onWallMouseMove(e: MouseEvent, fc: FabricCanvas) {
    const dw = dwRef.current;
    if (dw.phase !== 'started' || !dw.first) return;
    const rect = fc.getElement().getBoundingClientRect();
    const cp = screenToCanvas(e.clientX, e.clientY, rect, fc.getZoom(), (fc as any).viewportTransform);
    const ws = useEditorStore.getState().walls;

    const snapped = snapToAngle(dw.first, cp);
    const ep = findNearestWallEndpoint(ws, snapped) ?? snapped;

    // Preview line
    if (dw.line) fc.remove(dw.line);
    dw.line = new Line([dw.first.x, dw.first.y, ep.x, ep.y], { stroke: '#2563EB', strokeWidth: 3, strokeDashArray: [6, 4], selectable: false, evented: false });
    fc.add(dw.line);

    // Dimension
    if (dw.dim) fc.remove(dw.dim);
    const feet = Math.sqrt((ep.x - dw.first.x) ** 2 + (ep.y - dw.first.y) ** 2) / DEFAULT_PPF;
    dw.dim = new FabricText(formatFeet(feet), {
      left: (dw.first.x + ep.x) / 2,
      top: (dw.first.y + ep.y) / 2 - 16,
      originX: 'center',
      fontSize: 12,
      fill: '#2563EB',
      selectable: false,
      evented: false,
    });
    fc.add(dw.dim);

    // Snap indicator
    if (dw.snapCircle) fc.remove(dw.snapCircle);
    if (findNearestWallEndpoint(ws, snapped)) {
      dw.snapCircle = new Circle({ left: ep.x - 8, top: ep.y - 8, radius: 8, fill: 'transparent', stroke: '#10B981', strokeWidth: 2, selectable: false, evented: false });
      fc.add(dw.snapCircle);
    }

    fc.requestRenderAll();
  }

  function clearDrawPreview(fc: FabricCanvas) {
    const dw = dwRef.current;
    [dw.dot, dw.line, dw.dim, dw.snapCircle].forEach((o) => { if (o) fc.remove(o); });
    dw.phase = 'idle';
    dw.first = null;
    dw.dot = null;
    dw.line = null;
    dw.dim = null;
    dw.snapCircle = null;
    fc.requestRenderAll();
  }

  function onPlaceOnWallClick(e: MouseEvent, fc: FabricCanvas, type: 'add-door' | 'add-window') {
    const rect = fc.getElement().getBoundingClientRect();
    const cp = screenToCanvas(e.clientX, e.clientY, rect, fc.getZoom(), (fc as any).viewportTransform);
    const hit = findWallAtPoint(useEditorStore.getState().walls, cp);
    if (!hit) return;
    const w = hit;
    const offset = Math.sqrt((cp.x - w.start.x) ** 2 + (cp.y - w.start.y) ** 2);
    const wd = feetToPixels(3, DEFAULT_PPF);
    if (type === 'add-door') {
      useEditorStore.getState().addDoor({ id: crypto.randomUUID(), wallId: w.id, offsetFromStart: offset, width: wd, swingDirection: 'right' });
    } else {
      useEditorStore.getState().addWindow({ id: crypto.randomUUID(), wallId: w.id, offsetFromStart: offset, width: wd, sillHeight: 3 });
    }
    setTool('select');
  }

  function syncObjectToStore(fc: FabricCanvas) {
    const active = fc.getActiveObjects();
    for (const obj of active) {
      const id = getId(obj);
      if (id?.startsWith('furniture_')) {
        useEditorStore.getState().updateFurniture(id.replace('furniture_', ''), {
          x: (obj as any).left,
          y: (obj as any).top,
          rotation: (obj as any).angle ?? 0,
          width: (obj as any).width * ((obj as any).scaleX ?? 1),
          height: (obj as any).height * ((obj as any).scaleY ?? 1),
        });
      }
    }
  }

  function syncWalls() {
    const fc = fcRef.current;
    if (!fc) return;
    const expected = new Set(walls.map((w) => `wall_${w.id}`));

    // Remove stale
    fc.getObjects().forEach((o) => {
      const id = getId(o);
      if (id?.startsWith('wall_') && !expected.has(id)) fc.remove(o);
    });
    removeByPrefix(fc, 'dim_wall_');

    for (const w of walls) {
      const fid = `wall_${w.id}`;
      const st = wallStyle(w.type);
      const existing = fc.getObjects().find((o) => getId(o) === fid);

      // Wall
      const line = existing || new Line([w.start.x, w.start.y, w.end.x, w.end.y], {
        stroke: st.c, strokeWidth: st.w, strokeLineCap: 'square', selectable: true, borderColor: '#2563EB', cornerColor: '#2563EB', cornerSize: 9, transparentCorners: false, hasControls: st.d ? true : true,
        ...(st.d ? { strokeDashArray: [8, 4] } : {}),
      });
      if (!existing) { sid(line as Obj, fid); fc.add(line); }
      else { line.set({ x1: w.start.x, y1: w.start.y, x2: w.end.x, y2: w.end.y, stroke: st.c, strokeWidth: st.w, strokeDashArray: st.d ? [8, 4] : null }); }

      // Dimension label
      const len = getWallLengthFeet(w, DEFAULT_PPF);
      const mx = (w.start.x + w.end.x) / 2;
      const my = (w.start.y + w.end.y) / 2;
      const lbl = new FabricText(`${formatFeet(len)}`, {
        left: mx, top: my - 16, originX: 'center', fontSize: 11, fill: '#94A3B8', fontFamily: 'monospace', backgroundColor: 'rgba(248,250,252,0.8)', padding: 1, selectable: false, evented: false,
      });
      sid(lbl, `dim_wall_${w.id}`);
      fc.add(lbl);
    }
    fc.requestRenderAll();
  }

  function syncDoors() {
    const fc = fcRef.current;
    if (!fc) return;
    removeByPrefix(fc, 'door_');
    const wmap = new Map(walls.map((w) => [w.id, w]));
    for (const d of doors) {
      const w = wmap.get(d.wallId);
      if (!w) continue;
      const wl = Math.sqrt((w.end.x - w.start.x) ** 2 + (w.end.y - w.start.y) ** 2);
      if (wl === 0) continue;
      const t = d.offsetFromStart / wl;
      if (t < 0 || t > 1) continue;
      const px = w.start.x + (w.end.x - w.start.x) * t;
      const py = w.start.y + (w.end.y - w.start.y) * t;
      const ang = (Math.atan2(w.end.y - w.start.y, w.end.x - w.start.x) * 180) / Math.PI;

      const gap = new Rect({ left: px, top: py, width: d.width, height: 16, originX: 'center', originY: 'center', fill: '#F8FAFC', stroke: null, angle: ang, selectable: false, evented: false });
      sid(gap as Obj, `door_${d.id}-gap`);
      fc.add(gap);

      const pa = ang + 90;
      const pLine = new Line([px, py, px + Math.cos((pa * Math.PI) / 180) * d.width, py + Math.sin((pa * Math.PI) / 180) * d.width], { stroke: '#B45309', strokeWidth: 2, selectable: false, evented: false });
      sid(pLine as Obj, `door_${d.id}-panel`);
      fc.add(pLine);

      // Arc approximation with polyline
      const r = d.width;
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const a = pa * (Math.PI / 180);
        const a2 = a + (Math.PI / 2) * (i / 12) * (d.swingDirection === 'left' ? -1 : 1);
        pts.push({ x: px + Math.cos(a2) * r, y: py + Math.sin(a2) * r });
      }
    }
    fc.requestRenderAll();
  }

  function syncWindows() {
    const fc = fcRef.current;
    if (!fc) return;
    removeByPrefix(fc, 'window_');
    const wmap = new Map(walls.map((w) => [w.id, w]));
    for (const wi of windows) {
      const w = wmap.get(wi.wallId);
      if (!w) continue;
      const wl = Math.sqrt((w.end.x - w.start.x) ** 2 + (w.end.y - w.start.y) ** 2);
      if (wl === 0) continue;
      const t = wi.offsetFromStart / wl;
      if (t < 0 || t > 1) continue;
      const px = w.start.x + (w.end.x - w.start.x) * t;
      const py = w.start.y + (w.end.y - w.start.y) * t;
      const ang = (Math.atan2(w.end.y - w.start.y, w.end.x - w.start.x) * 180) / Math.PI;

      const r = new Rect({ left: px, top: py, width: wi.width, height: 10, originX: 'center', originY: 'center', fill: '#4DA6C8', stroke: '#2563EB', strokeWidth: 1.5, angle: ang, selectable: true, borderColor: '#2563EB', cornerColor: '#2563EB', cornerSize: 7, hasControls: false });
      sid(r as Obj, `window_${wi.id}`);
      fc.add(r);
    }
    fc.requestRenderAll();
  }

  function syncFurniture() {
    const fc = fcRef.current;
    if (!fc) return;
    removeByPrefix(fc, 'furniture_');

    for (const f of furniture) {
      const def = findFurnitureDefinition(f.definitionId);
      if (!def) continue;
      const fid = `furniture_${f.id}`;
      const collide = furnitureOverlapsWall(f, walls);

      let shape: Rect | Circle;
      if (def.shape === 'circle') {
        shape = new Circle({
          left: f.x, top: f.y, radius: f.width / 2, originX: 'center', originY: 'center',
          fill: def.fillColor,
          stroke: collide ? '#EF4444' : def.color,
          strokeWidth: collide ? 4 : 2,
          angle: f.rotation, selectable: true, borderColor: collide ? '#EF4444' : '#2563EB', cornerColor: '#2563EB', cornerSize: 7,
        });
      } else {
        shape = new Rect({
          left: f.x, top: f.y, width: f.width, height: f.height, originX: 'center', originY: 'center',
          fill: def.fillColor,
          stroke: collide ? '#EF4444' : def.color,
          strokeWidth: collide ? 4 : 2,
          angle: f.rotation, selectable: true, borderColor: collide ? '#EF4444' : '#2563EB', cornerColor: '#2563EB', cornerSize: 7,
        });
      }
      sid(shape as Obj, fid);
      fc.add(shape);

      // Label
      const lbl = new FabricText(def.name, {
        left: f.x, top: f.y - f.height / 2 - 12, originX: 'center', fontSize: 10, fill: collide ? '#EF4444' : '#6B7280', backgroundColor: 'rgba(248,250,252,0.85)', padding: 2, selectable: false, evented: false,
      });
      sid(lbl, `${fid}-label`);
      fc.add(lbl);
    }
    fc.requestRenderAll();
  }
}

// ============================================================
// Grid
// ============================================================
function drawGrid(fc: FabricCanvas) {
  removeByPrefix(fc, 'grid_');
  const W = fc.getWidth();
  const H = fc.getHeight();

  // Calculate visible viewport bounds
  const vpt = (fc as any).viewportTransform;
  const offsetX = vpt ? -vpt[4] / (vpt[0] || 1) : 0;
  const offsetY = vpt ? -vpt[5] / (vpt[3] || 1) : 0;
  const zoom = fc.getZoom();

  const startX = Math.floor(offsetX / GRID_SPACING) * GRID_SPACING;
  const startY = Math.floor(offsetY / GRID_SPACING) * GRID_SPACING;
  const endX = offsetX + W / zoom;
  const endY = offsetY + H / zoom;

  // Subtle grid dots
  for (let x = startX; x <= endX; x += GRID_SPACING) {
    for (let y = startY; y <= endY; y += GRID_SPACING) {
      const dot = new Circle({
        left: x - 0.5, top: y - 0.5, radius: 0.5, fill: '#E2E8F0', selectable: false, evented: false,
      });
      sid(dot, `grid_${Math.round(x)}_${Math.round(y)}`);
      fc.add(dot);
    }
  }
}
