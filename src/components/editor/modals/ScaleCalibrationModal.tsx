'use client';

import { useUIStore, useCanvasStore } from '@/store';

export function ScaleCalibrationModal() {
  const setShow = useUIStore((s) => s.setShowScaleCalibration);
  const scale = useCanvasStore((s) => s.scale);
  const setScale = useCanvasStore((s) => s.setScale);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Set the Scale</h3>
        <p className="mt-1 text-sm text-gray-500">
          Click two points on your floorplan that you know the distance between,
          then enter the actual measurement.
        </p>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            Step 1: Draw a line on the floorplan between two known points.
            <br />
            <span className="font-mono">(Coming: click-to-draw calibration tool)</span>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            Step 2: Enter the real-world distance.
          </div>

          {scale && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Scale set: 1 foot = {scale.pixelsPerFoot.toFixed(1)} pixels
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setShow(false)}
            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Skip for now
          </button>
          <button
            onClick={() => setShow(false)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
