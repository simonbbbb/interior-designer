import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-gray-100 px-8 py-4">
        <div className="text-xl font-bold text-blue-600">HomeForge</div>
        <Link
          href="/editor"
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Launch Editor
        </Link>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <h1 className="max-w-2xl text-5xl font-extrabold tracking-tight text-gray-900">
          Upload your floorplan.
          <br />
          <span className="text-blue-600">Move walls.</span> Place furniture.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500">
          A simple floorplan planner for homeowners. No CAD experience needed.
          Digitize your builder's plan, experiment with layouts, and export.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/editor"
            className="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700"
          >
            Open Editor
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          <FeatureCard
            icon="📐"
            title="AI Digitization"
            desc="Upload a floorplan image and we'll detect walls, doors
and windows automatically."
          />
          <FeatureCard
            icon="✏️"
            title="CAD-Lite Editor"
            desc="Move walls, add doors and windows, and
experiment with layouts in a clean canvas editor."
          />
          <FeatureCard
            icon="🪑"
            title="Furniture Planning"
            desc="Drag and drop furniture from a curated library. Snap to
walls with collision detection."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-8 py-6 text-center text-sm text-gray-400">
        HomeForge -- Built for homeowners, not architects.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 p-6 text-left transition hover:border-blue-200 hover:bg-blue-50/50">
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );
}
