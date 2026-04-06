# Phase 1 Summary: Golden Feature Set & Market Gap

## The Golden Feature Set

Combined best-of-breed from all 5 competitors:

| Feature Area | Best-in-Class Approach | Source |
|---|---|---|
| **Floorplan Upload** | Accept JPG, PNG, PDF with 3 input modes: AI auto-detect, manual tracing fallback, blank canvas | RoomSketcher (3 modes) |
| **AI Digitization** | Transparent detection: show wall/door/window detections as adjustable overlays BEFORE committing, with manual adjust toggle | Homestyler/Planner 5D but fix their opaque "black box" problem |
| **Wall Editing** | Snap-to-angle, auto-join at intersections, drag-resize with real-time dimension readout, wall type selector | Floorplanner (fastest) + RoomSketcher (wall types) |
| **Doors/Windows** | Drag onto wall surface, auto-cut opening, resize handles, pre-set standard sizes | Floorplanner (best implementation) |
| **Furniture Library** | Curated library of dimensionally-accurate common furniture (not 10M+ -- overwhelming). Categorized by room, with real-world dimensions | Planner 5D (curation over quantity) |
| **Furniture Placement** | Drag from sidebar, snap-to-wall, rotation (R key), collision detection (red highlight) | Planner 5D (easiest drag-drop) |
| **Smart Guides** | Real-time distance indicators ("3 ft from wall"), alignment guides, angle snapping | RoomSketcher measurement tools |
| **Undo/Redo** | Full history stack (Command Pattern), no artificial limit | None do this well -- gap |
| **3D View Toggle** | Real-time 3D preview (not conversion, just a view mode) | Floorplanner (fastest) |
| **Export** | PNG/PDF with dimensions, one-click, no paywall for basic export | All competitors lock this -- gap |
| **No floating panels** | Clean sidebar + top toolbar only. No coordinates, no layers, no property panels unless needed | Fix for Homestyler/Planner 5D complexity |
| **Performance** | Client-side Canvas/WebGL, spatial indexing for 100+ furniture items | Fix for Planner 5D/Homestyler lag |

## The Key Market Gap (HomeForge Opportunity)

None of the current tools nail the "consumer who has a PDF from their builder and wants to modify walls and place furniture" workflow:

1. **Floorplanner**: Manual tracing only. No AI digitization. Walls are tedious.
2. **RoomSketcher**: Great AI but paywalled behind professional pricing. Not for homeowners.
3. **Planner 5D**: AI exists but is a "black box conversion" -- if wrong, start over. Paywalled aggressively.
4. **Homestyler**: Powerful but UI is intimidating for consumers. Too complex.
5. **SketchUp Free**: Zero floorplan tooling. You are learning 3D modeling.

**HomeForge's differentiator**: A CAD-lite tool where you upload your builder's floorplan, the AI digitizes it transparently (you see and fix detections), then you edit walls and place furniture in a clean interface that never shows coordinates, layers, or CAD terminology. Export is free. The tool is designed for "my house is being built and I need to plan" -- a specific use case all competitors treat as secondary.
