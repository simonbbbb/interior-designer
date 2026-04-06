# Spatial Indexing

## Grid-Based Spatial Index

Simple grid-based spatial index for collision detection and snapping.

```typescript
class SpatialGrid {
  private grid = new Map<string, string[]>();  // cell_key -> [object_ids]
  private cellSize: number = 50;  // 50px cells

  addObject(id, bounds) { /* fill cells covering bounding box */ }
  removeObject(id, bounds) { /* remove from cells */ }
  query(bounds): string[] { /* return all IDs in cells covering bounds */ }
  clear() { this.grid.clear(); }
}
```

## Use Cases

- **Furniture collision detection:** query grid for walls within furniture bounding box
- **Snap-to-wall:** query grid for nearest wall within tolerance
- **View culling:** at high zoom-out, only render objects visible in viewport

## Why Grid over R-Tree

For a 2D CAD tool with < 200 objects, a uniform grid is simpler, faster to implement, and sufficient. R-Trees become beneficial at 1000+ objects or with irregularly shaped spatial queries.

## Rebuild Strategy

Rebuild the entire grid on bulk changes (AI digitization load, project open). Incremental updates (add/remove single object) for single operations. Grid is cheap to rebuild (< 1ms for 200 objects).
