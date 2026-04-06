'use client';

import { useState, useCallback, useRef } from 'react';
import { useCanvasStore, useEditorStore, useUIStore } from '@/store';
import type { Wall, Door, Window } from '@/types';

export function UploadModal() {
  const setBackgroundImage = useCanvasStore((s) => s.setBackgroundImage);
  const setShowUploadModal = useUIStore((s) => s.setShowUploadModal);
  const setIsDigitizing = useUIStore((s) => s.setIsDigitizing);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setError(null);
      setDetecting(true);

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setBackgroundImage(dataUrl);

        try {
          const response = await fetch('/api/digitize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl }),
          });
          const result = await response.json();

          if (result.fallback || (!result.walls || result.walls.length === 0)) {
            setError('Auto-detection found no walls. Use the Draw Wall tool to trace over your plan.');
          } else {
            // Convert AI results to Zustand walls
            const walls: Wall[] = (result.walls || []).map((w: any) => ({
              id: w.id,
              start: { x: w.start.x, y: w.start.y },
              end: { x: w.end.x, y: w.end.y },
              type: 'standard' as const,
              thickness: w.thickness ?? 6,
              confidence: w.confidence,
              source: 'ai' as const,
            }));

            const doors: Door[] = (result.doors || []).map((d: any) => ({
              id: d.id,
              wallId: d.wallId,
              offsetFromStart: d.offsetFromStart,
              width: d.width,
              swingDirection: d.swingDirection,
            }));

            const windows: Window[] = (result.windows || []).map((wi: any) => ({
              id: wi.id,
              wallId: wi.wallId,
              offsetFromStart: wi.offsetFromStart,
              width: wi.width,
              sillHeight: wi.sillHeight,
            }));

            // Bulk add to store
            useEditorStore.getState().setWalls(walls);
            useEditorStore.getState().setDoors(doors);
            useEditorStore.getState().setWindows(windows);

            // Close modal - user can now edit the detected walls
            setShowUploadModal(false);
          }
        } catch (err) {
          console.error('[Upload] Digitization failed:', err);
          setError('Digitization service unavailable. Drawing tools are ready for manual tracing.');
        }

        setDetecting(false);
        setIsDigitizing(false);
      };
      reader.readAsDataURL(file);
    },
    [setBackgroundImage, setShowUploadModal, setIsDigitizing],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const dismiss = () => {
    setShowUploadModal(false);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto relative mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Dismiss"
        >
          ✕
        </button>

        <div className="mb-2 text-center text-3xl">&#127968;</div>
        <h2 className="mb-1 text-center text-lg font-semibold text-gray-900">
          Upload Your Floorplan
        </h2>
        <p className="mb-4 text-center text-xs text-gray-500">
          Or close this and start drawing walls from scratch
        </p>

        {detecting ? (
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-8 text-center">
            <div className="text-center text-2xl">&#9881;</div>
            <p className="mt-2 text-sm font-medium text-blue-700">
              Detecting walls and openings...
            </p>
            <p className="mt-1 text-xs text-blue-500">
              This may take a few seconds
            </p>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-blue-400 hover:bg-blue-50"
          >
            <div className="text-center text-2xl">&#128193;</div>
            <p className="mt-2 text-center text-sm text-gray-500">
              Drop your floorplan here or click to select
            </p>
            <p className="mt-1 text-center text-xs text-gray-400">
              Supports PNG, JPG (max 20MB)
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <span className="font-semibold">Notice: </span>
            {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
