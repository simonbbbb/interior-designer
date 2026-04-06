'use client';

import { useCallback, useRef } from 'react';
import { useCanvasStore, useUIStore } from '@/store';

export function UploadModal() {
  const setBackgroundImage = useCanvasStore((s) => s.setBackgroundImage);
  const setShowUploadModal = useUIStore((s) => s.setShowUploadModal);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [setBackgroundImage],
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
