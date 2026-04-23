# Path-Line Feature — Design Spec

**Date:** 2026-04-23
**Parent spec:** [specs/01-game-design/01-02-enemy-path-line-spec.md](../01-game-design/01-02-enemy-path-line-spec.md)
**Relation:** Thin slice between Slice 1 (Foundation) and Slice 2 (Combat). Validates the pathfinding stack before Slice 2 depends on it.

---

## Purpose

Render a semi-transparent red line on the grid showing the enemy A* route from each of the 3 portal tiles to the nearest castle tile. Gives the player a visual preview of enemy routes (once enemies and towers exist in Slice 2+).

This also builds the `PathfindingManager` infrastructure that Slice 2 requires for tower placement validation and enemy routing.

---

## Scope

### In scope

- New `src/systems/PathfindingManager.ts` wrapping `easystarjs`:
  - Constructor takes the `GridManager` and static portal/castle cell lists
  - `async recalculatePaths(blockedCells: ReadonlySet<string>): Promise<Map<string, CellCoord[]>>`
  - Returns a map keyed by `"col,row"` of the portal tile, valued by an ordered list of cells from portal to the nearest castle tile
  - Diagonals enabled, corner-cutting disabled (prevents enemies slipping between diagonally-placed towers in Slice 2+)
- GameScene updates:
  - Async `create()` (Phaser tolerates this)
  - Instantiate `PathfindingManager`
  - Call `recalculatePaths(new Set())` once at startup and cache results on the scene
  - Dedicated `pathLineGraphics: Phaser.GameObjects.Graphics` at depth `3`
  - `drawPathLines()` method renders every cached path as a connected segment list between cell centers, with `lineStyle(2, 0xFF0000, 0.3)`
  - Drawn after paths are resolved

### Out of scope (deferred)

- Tower occupancy / blocked cells — always an empty set in this slice; Slice 2 wires towers in
- Enemies actually following the path — Slice 2
- Per-portal color variation, pulsing, animated dots, dashed style — 01-02's "post-MVP" section, not touched here
- Recalculating paths at runtime — no trigger exists yet

---

## Behavior

With no towers, the 3 portal tiles `(0,2)`, `(0,3)`, `(0,4)` each route straight across to the castle tile in the same row, producing 3 parallel horizontal lines. This is the expected visual output for this slice and confirms pathfinding is wired correctly.

## API

```typescript
// PathfindingManager
constructor(grid: GridManager, portals: CellCoord[], castles: CellCoord[]);

async recalculatePaths(
  blockedCells: ReadonlySet<string>,
): Promise<Map<string, CellCoord[]>>;

// Cell key format: "col,row" (e.g., "3,5")
// Return map key: portal cell formatted as "col,row"
// Return map value: ordered path from portal (inclusive) to nearest castle tile (inclusive)
// If a portal has no valid path (fully blocked), it is omitted from the map
```

## Pathfinding configuration

- `enableDiagonals()` — matches 01-02 spec; gives natural-looking routes
- `disableCornerCutting()` — prevents enemies slipping between towers placed at diagonal corners of each other (important for Slice 2 placement semantics)
- Walkable cells: **everything except cells in `blockedCells`** (portals and castle tiles are walkable — enemies must be able to enter and exit them)

## Acceptance criteria

1. `npm run build` passes type-check and bundles cleanly.
2. Loading the Game scene shows 3 red horizontal lines, one per portal row, spanning cell centers from col 0 to col 12 at rows 2, 3, 4.
3. Lines are visibly semi-transparent (alpha ~0.3), 2px wide.
4. Lines render above grid cell fills (depth 3) and below any future enemies/towers/UI (which live at 10+ per 01-02).
5. Back-to-menu and dev Trigger Defeat buttons still work.

## Risks

- **`easystarjs` async callback loop**: easystarjs iterates paths across frames, requiring repeated `calculate()` calls. The wrapper must handle this — either tick `calculate()` on a Phaser update loop or call it in a tight loop until the callback resolves. For a 13×7 grid with no obstacles, it resolves in one call.
