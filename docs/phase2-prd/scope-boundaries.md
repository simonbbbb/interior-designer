# Scope Boundaries

## MVP Scope (This Build)
- Single-floor projects only
- JPG, PNG upload (PDF supported via server-side conversion)
- AI wall detection with manual adjustment
- Manual wall tracing tool
- Wall edit, resize, type change
- Door and window placement on walls
- Furniture library (~40 items across 6 categories)
- Furniture drag, drop, rotate, snap-to-wall
- Collision detection (wall-furniture overlap)
- Undo/Redo (Command Pattern, cap 200)
- Pan and zoom canvas
- Scale calibration
- PNG export with dimensions
- PDF export (jsPDF)
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete, R, Arrow keys, Ctrl+S)
- Desktop/tablet only (1024px+ minimum viewport)
- localStorage persistence

## Explicitly Out of Scope
- Multi-story support (P1)
- User accounts and authentication (P1)
- 3D view toggle (P1)
- Real-time collaboration (P2)
- Custom furniture creation / SVG upload (P2)
- Mobile editing (read-only viewer is P2)
- Construction document generation (out of scope permanently)
- Structural analysis / load-bearing wall detection (out of scope permanently)
- Metric/imperial toggle (P2)
- Sharing / view-only links (P2)
- Cloud storage for projects (P1)
