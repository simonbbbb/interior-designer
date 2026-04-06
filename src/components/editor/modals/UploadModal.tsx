'use client';

import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/store';

export function UploadModal() {
  const setBackgroundImage = useCanvasStore((s) => s.setBackgroundImage);
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

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="w-full max-w-lg text-center">
        <div className="mb-2 text-4xl">&#127968;</div>
        <h2 className="mb-1 text-2xl font-bold text-gray-900">
          Upload Your Floorplan
        </h2>
        <p className="mb-6 text-gray-500">
          Drag and drop a PNG or JPG, or click to browse
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-12 transition-colors hover:border-blue-400 hover:bg-blue-50"
        >
          <div className="text-3xl">&#128193;</div>
          <p className="mt-2 text-sm text-gray-500">
            Drop your floorplan here or click to select
          </p>
          <p className="mt-1 text-xs text-gray-400">
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
