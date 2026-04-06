# Sprint 4: Furniture & Styling

## What was built
- Furniture catalog (lib/furniture-utils.ts) with 23 items across 7 categories
- syncFurniture() function in Canvas component - renders furniture as Fabric.js Rect/Circle objects
- Drag-and-drop from sidebar to canvas (HTML5 DragEvent handler on canvas element)
- Collision detection: furniture turns red (thick red border) when overlapping walls
- Furniture labels above each item showing its name
- Move/rotate/scale handlers that sync Fabric.js state back to Zustand store
- Delete handler for furniture objects

## Architecture
```
FurnitureSidebar (sidebar items with draggable=true)
    |
    | dragstart -> setData('application/json', {id, width, depth, ...})
    |
    v
Canvas <--- dragover/drop handlers on canvas element
    |
    | drop -> parse JSON -> screenToCanvas -> addFurniture(store)
    |
    v
Zustand store.addFurniture() triggers useEffect
    |
    v
syncFurniture() renders Fabric.js Rects with:
    - fill color from catalog
    - collision detection against walls (red border if overlapping)
    - text label with furniture name
    - selectable, draggable, rotatable
    |
    v
object:moving/scaling handlers sync back to store
```

## Files created/modified
- src/lib/furniture-utils.ts - New file: catalog + collision detection + snap-to-wall
- src/components/editor/canvas/Canvas.tsx - Added syncFurniture, drag-drop handlers, move tracking
- src/store/editor.store.ts - Already had furniture CRUD (from Sprint 1)

## Verification
- Drag simulation added furniture to canvas, status bar updated to 'Furniture: 1'
- Furniture rendered as colored rectangles with category-accurate colors and name labels
- Collision detection shows red border when furniture overlaps walls (MVP)
