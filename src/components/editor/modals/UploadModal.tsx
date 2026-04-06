'use client';

import { useState, useCallback, useRef } from 'react';
import { useCanvasStore, useEditorStore, useUIStore } from '@/store';
import { pdfToDataUrl } from '@/lib/pdf-to-image';
import type { Wall, Door, Window } from '@/types';

export function UploadModal() {
  const setBackgroundImage = useCanvasStore((s) => s.setBackgroundImage);
  const setShowUploadModal = useUIStore((s) => s.setShowUploadModal);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError('Please upload a PNG, JPG, or PDF file.');
        return;
      }
      setError(null);
      setDetecting(true);

      try {
        let dataUrl: string;

        if (file.type === 'application/pdf') {
          dataUrl = await pdfToDataUrl(file);
        } else {
          dataUrl = await fileToDataUrl(file);
        }

        setBackgroundImage(dataUrl);

        // Try digitization
        try {
          const response = await fetch('/api/digitize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl }),
          });
          const result = await response.json();

          if (result.walls && result.walls.length > 0) {
            const walls: Wall[] = result.walls.map((w: Record<string, unknown>) => ({
              id: w.id as string,
              start: { x: (w.start as Record<string, number>).x, y: (w.start as Record<string, number>).y },
              end: { x: (w.end as Record<string, number>).x, y: (w.end as Record<string, number>).y },
              type: 'standard' as const,
              thickness: (w.thickness as number) ?? 6,
              confidence: w.confidence as number,
              source: 'ai' as const,
            }));
            const doors: Door[] = (result.doors || []).map((d: Record<string, unknown>) => ({
              id: d.id as string,
              wallId: d.wallId as string,
              offsetFromStart: d.offsetFromStart as number,
              width: d.width as number,
              swingDirection: d.swingDirection as 'left' | 'right',
            }));
            const windows: Window[] = (result.windows || []).map((wi: Record<string, unknown>) => ({
              id: wi.id as string,
              wallId: wi.wallId as string,
              offsetFromStart: wi.offsetFromStart as number,
              width: wi.width as number,
              sillHeight: wi.sillHeight as number,
            }));
            useEditorStore.getState().setWalls(walls);
            useEditorStore.getState().setDoors(doors);
            useEditorStore.getState().setWindows(windows);
            setShowUploadModal(false);
          } else {
            setError('Could not auto-detect walls. Use the Draw Wall tool to trace over your plan.');
          }
        } catch {
          // Digitizer not available - that's fine, user can trace manually
          setShowUploadModal(false);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to process file.';
        setError(message);
      }

      setDetecting(false);
    },
    [setBackgroundImage, setShowUploadModal],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const dismiss = () => setShowUploadModal(false);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
      <div className="pointer-events-auto relative mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          &#x2715;
        </button>

        <div className="mb-1 text-center text-4xl">&#127968;</div>
        <h2 className="mb-1 text-center text-xl font-bold text-gray-900">
          Upload Your Floorplan
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Drop your file below or click to browse. We'll try to auto-detect walls.
        </p>

        {detecting ? (
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-8 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-blue-200 border-t-blue-600" />
            <p className="font-medium text-blue-700">
              {fileInputRef.current?.files?.[0]?.type === 'application/pdf'
                ? 'Converting PDF...'
                : 'Detecting walls...'}
            </p>
            <p className="mt-1 text-xs text-blue-500">
              This will just take a moment
            </p>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={
              'cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ' +
              (dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50')
            }
          >
            <div className="text-3xl">&#128193;</div>
            <p className="mt-3 text-sm font-medium text-gray-700">
              Drop your floorplan here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-400">
              PDF, PNG, JPG — up to 20MB
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              <span className="font-semibold">&#9888; </span>{error}
            </p>
            <p className="mt-2 text-xs text-red-500">
              Tip: Select <strong>Draw Wall</strong> in the toolbar and trace over your plan.
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,application/pdf"
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
