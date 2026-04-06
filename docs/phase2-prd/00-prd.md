# HomeForge - Product Requirements Document (PRD)

## 1. Product Vision

HomeForge is a web-based CAD-lite floorplan tool built for one specific job: allow homeowners with house plans under construction to digitize their builder's floorplan, experiment with wall modifications, and visualize furniture placement -- without learning a professional CAD tool.

**Positioning statement:** "Upload your floorplan. Move walls. Place furniture. Done."

**Non-positioning:** HomeForge is NOT a replacement for AutoCAD, SketchUp, or professional architectural software. It does not produce construction documents, does not support structural engineering calculations, and does not claim measurement accuracy for permitting.

## 2. Target User Personas

### Primary: "The New Homeowner" (Sarah, 34)
- Building her first home, has a PDF floorplan from the builder
- Wants to see if the master bedroom fits a king bed with nightstands
- Considers moving the laundry room wall if it's easy to do
- Has zero CAD experience, gets frustrated by coordinate panels and layer systems
- Will use the tool for 2-4 evenings, then save/export and be done
- Device: Laptop (13-15 inch), occasionally an iPad

### Secondary: "The Renovator" (Marcus, 45)
- Remodeling an existing home, needs to plan wall removals and new layouts
- Has photos or scans of old blueprints
- Wants to share the visual plan with his contractor
- May use the tool for weeks or months across phases
- Comfortable with basic tech, not with CAD

### Excluded Users (MVP):
- Professional architects and engineers
- Real estate agents producing marketing materials
- Furniture retailers creating store layouts
- 3D printing enthusiasts

## 3. Scope Boundaries

### MVP Scope (This Build)
- Single-floor projects only
- JPG, PNG upload (PDF via server-side conversion)
- AI wall detection with manual adjustment
- Manual wall tracing tool
- Wall edit, resize, type change
- Door and window placement on walls
- Furniture library (~40 items)
- Furniture drag, drop, rotate, snap-to-wall
- Collision detection (wall-furniture)
- Undo/Redo (Command Pattern)
- Pan and zoom canvas
- Scale calibration
- PNG export with dimensions
- PDF export
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete, R, Arrow keys, Ctrl+S)
- Desktop/tablet only (1024px+ min viewport)

### Explicitly Out of Scope
- Multi-story support (P1)
- User accounts and authentication (localStorage only for MVP)
- 3D view toggle (P1)
- Real-time collaboration
- Custom furniture creation
- Mobile editing (read-only viewer is P2)
- Construction document generation
- Structural analysis or load-bearing wall detection
- Metric/imperial toggle (P2 -- defaults to imperial)
- Sharing/view-only links (P2)

## 4. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Canvas render performance | 60 FPS with 100+ objects |
| Initial load time | < 3 seconds on 4G network |
| AI digitization time | < 10 seconds for 2000x2000px image |
| Max project size | 20,000 walls, 500 furniture pieces |
| Browser support | Chrome 100+, Firefox 100+, Safari 15+, Edge 100+ |
| Responsive constraint | Min 1024px width. Below: "Desktop Recommended" overlay |
| Data persistence (MVP) | localStorage. Cloud save is P1 (PostgreSQL) |

## 5. UX/UI Layout

```
+---------------------------------------------------+
| [Logo]  |  Toolbar (Wall | Door | Window | Measure)|  <- 48px
|---------------------------------------------------|
|           |                                        |
| Furniture |                                        |
| Sidebar   |           Canvas Area                   |
| 280px     |           (Fabric.js)                   |
|           |                                        |
|           |                                        |
|---------------------------------------------------|
| Scale: 1" = 4ft  |  Zoom: 150%  |  [Undo] [Redo]  |  <- 32px status bar
+---------------------------------------------------+
```

## 6. Color Palette

- Primary: #2563EB (blue) for CTAs and selection
- Walls: #333333 (standard), #888888 (half), #4DA6C8 (glass)
- Furniture: #F59E0B (amber) with #92400E stroke
- Background: #F8FAFC (light gray) canvas, white page
- Error/Warning: #EF4444 for collisions
- Success: #10B981 for accepted AI detections
- Grid lines: #E2E8F0
- Typography: Inter (Google Fonts), Monospace for dimensions

## 7. Success Metrics

| Metric | Target |
|---|---|
| User completes digitization + 1 edit | > 60% of uploaders |
| Average session duration | 15-30 minutes |
| Return rate | > 30% |
| Export rate | > 40% of sessions |
| AI detection accuracy | > 70% on clean architectural drawings |
| Fallback to tracing mode | < 20% of uploads |
