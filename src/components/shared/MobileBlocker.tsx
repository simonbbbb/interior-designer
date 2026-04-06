'use client';

const MIN_WIDTH = 1024;

export function MobileBlocker() {
  if (typeof window === 'undefined' || window.innerWidth >= MIN_WIDTH) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">{"\uD83D\uDCAA"}</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Desktop Recommended</h2>
        <p className="text-gray-600">
          HomeForge is optimized for desktop and tablet (1024px+).
          Please open this page on a larger screen for the best experience.
        </p>
      </div>
    </div>
  );
}
