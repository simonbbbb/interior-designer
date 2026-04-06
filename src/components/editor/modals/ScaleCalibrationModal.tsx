'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/store';
import type { Point } from '@/types';

// Calibration state shared with canvas via window
const calibrationStateRef = {
  origin: null as Point | null,
  step: 1 as 1 | 2,
};

// Export so Canvas can dispatch calibration clicks
export function triggerCalibrationClick(pt: Point) {
  const ref = (window as any).__calibrationRef;
  if (!ref || ref.step === 1) return;

  if (!ref.origin) {
    ref.origin = pt;
    ref.step = 2;
    const ev = new CustomEvent('homeforge:calibration-update', { detail: { step: 2, origin: pt } });
    window.dispatchEvent(ev);
    return;
  }

  // Step 2: finish
  const knownDist = (window as any).__calibrationDistance;
  if (knownDist > 0) {
    const dx = pt.x - ref.origin.x;
    const dy = pt.y - ref.origin.y;
    const pixels = Math.sqrt(dx * dx + dy * dy);
    const pixelsPerFoot = pixels / knownDist;

    useCanvasStore.getState().setScale({
      pixelsPerFoot,
      origin: ref.origin,
      endpoint: pt,
      knownDistance: knownDist,
    });

    useCanvasStore.getState().setShowScaleCalibration(false);
    ref.origin = null;
    ref.step = 1;
  }
}

// Expose global ref for canvas to use
if (typeof window !== 'undefined') {
  (window as any).__calibrationRef = calibrationStateRef;
}

export function ScaleCalibrationModal() {
  const scale = useCanvasStore((s) => s.scale);
  const setShow = useCanvasStore((s) => s.setShowScaleCalibration);

  const [knownDistance, setKnownDistance] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  // Listen for calibration clicks
  useState(() => {
    const handler = (e: Event) => {
      setStep((e as CustomEvent).detail.step);
    };
    window.addEventListener('homeforge:calibration-update', handler as EventListener);
    return () => window.removeEventListener('homeforge:calibration-update', handler as EventListener);
  });

  const handleStart = () => {
    const dist = parseFloat(knownDistance);
    if (!dist || dist <= 0) return;

    // Store distance globally
    (window as any).__calibrationDistance = dist;

    // Reset calibration state
    calibrationStateRef.origin = null;
    calibrationStateRef.step = 1;

    setStep(1);
  };

  const handleReset = () => {
    useCanvasStore.getState().setScale(null);
    calibrationStateRef.origin = null;
    calibrationStateRef.step = 1;
    setStep(1);
    setKnownDistance('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          onClick={() => setShow(false)}
          className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-gray-100"
        >
          ✕
        </button>

        <h3 className="text-lg font-semibold text-gray-900">Calibrate Scale</h3>
        <p className="mt-1 text-sm text-gray-500">
          Enter a known distance, then click two points on a wall.
        </p>

        <div className="mt-4 space-y-3">
          {/* Distance input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Known Distance (feet)
            </label>
            <input
              type="number"
              step="0.1"
              value={knownDistance}
              onChange={(e) => setKnownDistance(e.target.value)}
              placeholder="e.g. 12"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            className={
              'w-full rounded-md px-4 py-2 text-sm font-medium transition ' +
              (step === 1 && !scale
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200')
            }
            disabled={!knownDistance || parseFloat(knownDistance) <= 0}
          >
            {step === 2 ? 'Now click the second point on the canvas...' : 'Start Measuring'}
          </button>

          {/* Reset button when scale is set */}
          {scale && (
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-sm text-green-700">
                Scale: 1 foot = {scale.pixelsPerFoot.toFixed(1)} pixels
              </p>
              <button
                onClick={handleReset}
                className="mt-1 text-xs text-green-600 underline hover:text-green-800"
              >
                Reset calibration
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShow(false)}
            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
