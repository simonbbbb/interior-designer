# System Architecture

## Tech Stack Decision Summary

| Layer | Choice | Justification |
|---|---|---|
| Frontend Framework | Next.js 14 (App Router) + TypeScript | SSR for landing, CSR for editor, excellent DX |
| 2D Canvas Engine | **Fabric.js 5.x** | 2D vector manipulation, built-in selection/drag/resize/rotation, serialization, proven in CAD-lite apps. Three.js is overkill for 2D and adds massive complexity for a feature (3D view) that is explicitly P1. |
| State Management | **Zustand** | Minimal boilerplate, excellent performance for high-frequency canvas state updates |
| Styling | Tailwind CSS + Radix UI primitives | Tailwind for layout, Radix for accessible components |
| Backend (digitization) | Python FastAPI + OpenCV | OpenCV is battle-tested for edge/line detection. Easy to deploy. |
| Backend (API) | Next.js API Routes | MVP needs no separate Express server. One deploy, one repo. |
| Database (P1) | PostgreSQL + Prisma ORM | Structured relational data. Type-safe queries. |
| Storage | Cloudinary (free tier) | Handles image uploads/resizing/PDF-to-image. Better DX than raw S3. |
| Persistence (MVP) | **localStorage** | Zero infrastructure. Cloud save comes in P1. |
| Export | jsPDF + Canvas.toDataURL() | Client-side only. No server needed for export. |

## Monorepo Structure

```
/homeforge
  /src                    <- Next.js app
    /app                  <- Next.js App Router
    /components           <- React components (UI + Canvas)
    /store                <- Zustand stores
    /lib                  <- Canvas utilities, keyboard shortcuts, history
    /types                <- TypeScript interfaces
    /services             <- API client for digitization
  /digitizer              <- Python FastAPI + OpenCV service
  /public                 <- Static assets (SVG furniture icons)
```

## Architecture Diagram

```
            +-------------------+
            |   User Browser    |
            |  (Next.js Editor)  |
            +-------------------+
                    |
                    |  POST /api/digitize
            +-------+--------+
            | Next.js API     |  <-- Proxy to digitizer, project save/load
            +-----------------+
                    |
                    |  POST /digitize
            +-----------------+
            | Python FastAPI  |  <-- OpenCV digitization
            | + OpenCV        |
            +-----------------+

            +-----------------+
            | Cloudinary      |  <-- Image storage (P1)
            | localStorage    |  <-- Project persistence (MVP)
            +-----------------+
```

## Why NOT Rust/Wasm for the canvas

Rust/Wasm is excellent for:
- Heavy CPU computation in the browser (physics engines, ray tracing, large matrix math)
- Image/video processing that must run client-side

Rust/Wasm is NOT helpful for:
- Canvas rendering: The GPU does this via the browser's Canvas2D/WebGL APIs. Fabric.js calls hardware-accelerated APIs regardless.
- Wall intersection logic: Simple line-line intersection. Even with 1000 walls, ~500K comparisons take <10ms in JavaScript V8.
- AI digitization: Runs on the server in Python (OpenCV, already C++ under the hood).
- State management: Zustand operates at microsecond speed. JS<->Wasm serialization overhead would be slower.

Hidden costs of Rust/Wasm:
- Build pipeline complexity (wasm-pack, wasm-bindgen)
- Debugging across JS/Wasm boundary is painful
- Bundle size: ~500KB+ minimum for Rust runtime
- Fabric.js API cannot be called from Rust -- need custom Wasm bridge for everything
- No npm ecosystem integration
- Learning curve for a team not familiar with Rust

The 60 FPS target with 100+ objects is easily achievable with Fabric.js. Floorplanner.com renders 260,000 3D models in pure JavaScript via WebGL. We are building for 1/10th that complexity.
