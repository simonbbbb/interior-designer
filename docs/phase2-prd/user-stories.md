# User Stories - Prioritized

## P0 - Must Have (MVP)

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-01 | Upload floorplan image (JPG/PNG/PDF) | Accepts JPG, PNG. Displays on canvas. PDF converted to image. |
| US-02 | AI auto-detect walls, doors, windows | AI returns coordinates. Rendered as editable vector overlays. |
| US-03 | Review and fix AI detections before committing | Preview with accept/reject/adjust per element. Manual Adjust Mode. |
| US-04 | Draw walls manually when AI fails | Click-to-place with angle snapping (0, 45, 90). Auto-join at intersections. |
| US-05 | Select and drag wall endpoints | Drag handles visible. Moving endpoint updates connected walls. |
| US-06 | Resize walls by dragging | Midpoint shifts parallel. Endpoint changes length. Real-time dimension. |
| US-07 | Change wall types (standard, half-wall, glass) | Selector on selection. Visual distinction on canvas. |
| US-08 | Add doors and windows to walls | Drag onto wall. Auto-cuts opening. Standard sizes. |
| US-09 | Drag furniture from sidebar to canvas | Categorized sidebar. Drag to canvas with scaled preview. |
| US-10 | Rotate and move furniture with keyboard | R rotate 90. Arrow nudge. Delete remove. Mouse drag move. |
| US-11 | Furniture snap-to-wall + collision warnings | Snap within tolerance. Red highlight on wall overlap. |
| US-12 | Undo and redo | Ctrl+Z undo, Ctrl+Y redo. Full history stack (cap 200). |
| US-13 | Pan and zoom canvas | Mouse wheel zoom. Click-drag pan. Zoom indicator. |
| US-14 | Set scale of uploaded floorplan | Draw known dimension, enter measurement. System calculates ratio. |
| US-15 | Export as PNG/PDF with dimensions | One-click export. High-res render. Room labels included. |

## P1 - Should Have (Post-MVP)

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-16 | Save and load projects | Save to cloud. Load from project list. Autosave every 30s. |
| US-17 | Auto-calculated room dimensions | Dimension lines between parallel walls. Room area in sq ft. |
| US-18 | 3D view toggle | Toggle between 2D and 3D isometric/dollhouse view. |
| US-19 | Multi-story support | Floor tabs. Level selector. Stairs indicator. |
| US-20 | Smart guides with distances | Dashed guides near other elements. Distance label shown. |

## P2 - Nice to Have (Future)

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-21 | Share read-only link | Shareable URL. Opens in read-only viewer. |
| US-22 | Imperial/metric toggle | Toggle in settings. All dimensions update. |
| US-23 | Text labels and annotations | Click to place text. Font scales to zoom. |
| US-24 | Mobile read-only viewer | Responsive viewer. Touch pan/zoom. No editing. |
