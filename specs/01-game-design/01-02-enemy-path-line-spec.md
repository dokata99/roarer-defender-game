# Enemy Path Line - Feature Specification

## Overview

Add a semi-transparent narrow red line to the game grid that visualizes the path enemies will take from the portal (spawn) to the server (base). This gives the player a clear preview of enemy routes, helping them make better tower placement decisions.

---

## Visual Design

### Line Appearance

| Property | Value | Rationale |
|----------|-------|-----------|
| Color | `0xFF0000` (red) | High contrast against the dark `#141726` grid background and cyan/purple theme elements |
| Opacity | `0.25` – `0.35` alpha | Visible but not distracting; does not compete with enemies, towers, or projectiles |
| Width | `2px` | Narrow enough to feel like a guide, not a wall |
| Depth | `3` (above grid at `1`, below enemies at `20` and towers at `10`) | Sits on top of the grid/circuit overlay but beneath gameplay elements |

### Line Shape

- The line connects the **center of each cell** along the path, from portal cell to castle cell.
- Since pathfinding uses diagonals (EasyStar with `enableDiagonals()`), the line will include diagonal segments — not just horizontal/vertical.
- Each of the 3 portal rows (`[0,2]`, `[0,3]`, `[0,4]`) gets its own path line, since their A* routes may diverge around towers.
- Lines are drawn as connected segments: `cell[0] -> cell[1] -> cell[2] -> ... -> cell[n]`.

### Optional Enhancements (post-MVP)

- **Dashed/dotted style** instead of solid — gives a more "data packet route" feel matching the cyber theme.
- **Subtle pulsing animation** — slow alpha tween between 0.2 and 0.4 to suggest data flow direction.
- **Animated dots** moving along the line — small circles that travel the path to show flow direction (portal → server).
- **Per-path color variation** — slightly different hue per portal row for readability when paths overlap.

---

## Implementation Plan

### Step 1: Populate initial cached paths in `create()`

**File:** `src/scenes/GameScene.ts`

Currently `recalculatePaths()` is only called when a tower is placed or sold, so `cachedPaths` is an empty `Map` at game start and no path lines would be drawn. Add an initial call in `create()`, after the pathfinding grid is initialised (after `this.pathfinder.updateGrid(...)` on line 99):

```
await this.recalculatePaths();
```

Because `recalculatePaths()` is `async`, `create()` must become `async create()`. Phaser's Scene lifecycle tolerates an async `create()` — the scene simply finishes setup once the promise resolves. Everything after the `await` (grid drawing, UI creation, etc.) is already synchronous and unaffected.

### Step 2: Add a dedicated `Graphics` object for the path line

**File:** `src/scenes/GameScene.ts`

- Add a new property: `private pathLineGraphics!: Phaser.GameObjects.Graphics;`
- Create it in `create()` after `drawGrid()` and the new initial `recalculatePaths()` from Step 1.
- Set its depth to `3` so it renders above the grid but below gameplay elements.

### Step 3: Create a `drawPathLines()` method

**File:** `src/scenes/GameScene.ts`

```
private drawPathLines(): void
```

**Logic:**

1. Clear any previous path drawing: `this.pathLineGraphics.clear()`.
2. Set the line style: `this.pathLineGraphics.lineStyle(2, 0xFF0000, 0.3)`.
3. Iterate over `this.cachedPaths` (the `Map<string, { x, y }[]>` of grid-coordinate paths, where EasyStar's `x` = column and `y` = row).
4. For each path:
   a. Convert the first waypoint from grid coords to pixel coords using `this.gridManager.gridToPixel(point.x, point.y)`.
   b. Begin a new path: `this.pathLineGraphics.beginPath()` and `moveTo(pixelX, pixelY)`.
   c. For each subsequent waypoint, convert to pixel and call `this.pathLineGraphics.lineTo(pixelX, pixelY)`.
   d. Stroke the path: `this.pathLineGraphics.strokePath()`.

### Step 4: Call `drawPathLines()` at the right moments

The path line must be redrawn whenever the cached paths change. This happens in two places:

1. **After initial path calculation in `create()`** — the `recalculatePaths()` call added in Step 1 populates `cachedPaths`; draw the default paths before any towers are placed.
2. **At the end of `recalculatePaths()`** — called whenever a tower is placed or sold. Add `this.drawPathLines()` after the `await this.pathfinder.findAllPaths()` line inside `recalculatePaths()`.

> **Async note:** `recalculatePaths()` is async but its callers (tower place/sell) invoke it fire-and-forget without `await`. This is fine — `drawPathLines()` is called *inside* the method after the `await`, so it always runs with fresh paths. The caller proceeds immediately; the path line update happens asynchronously within the same frame or the next frame. In practice the delay is imperceptible.

This ensures the red line always reflects the current enemy route, updating in real-time as the player builds.

### Step 5: Handle edge case — no valid path

If a portal has no path (shouldn't happen since tower placement already prevents blocking all paths), skip drawing for that portal. The `cachedPaths` map simply won't contain an entry for that portal key, so the loop naturally skips it.

---

## Integration Points

| System | How it's affected |
|--------|------------------|
| `GameScene.create()` | Becomes `async`; adds initial `recalculatePaths()` call; creates `pathLineGraphics`; calls `drawPathLines()` after initial path calc |
| `GameScene.recalculatePaths()` | Calls `drawPathLines()` at the end to update the visual |
| `PathfindingManager` | No changes needed — paths are already exposed via `findAllPaths()` |
| `GridManager` | No changes needed — `gridToPixel()` already exists |
| Enemy rendering | No changes — enemies render at depth `20`, above the path line |
| Tower rendering | No changes — towers render at depth `10`, above the path line |

---

## Depth Layer Reference

For context, the existing depth hierarchy:

| Depth | Element |
|-------|---------|
| `1` | Grid cells + circuit overlay |
| `2` | Portal/castle backgrounds + cell highlights |
| **`3`** | **Path line (new)** — also used by server bay dividers and LEDs |
| `5` | Hover highlight (tower placement preview) |
| `10` | Towers |
| `15` | Projectiles |
| `20` | Enemies |
| `40+` | UI elements (HUD, panels) |

> **Note:** Depth `3` is shared with server bay dividers and LED dots. This is fine since the path line is drawn on the grid area and does not overlap the server rack. If overlap becomes an issue, bump the path line to depth `4`.

---

## Files Changed

| File | Change |
|------|--------|
| `src/scenes/GameScene.ts` | Make `create()` async; add initial `recalculatePaths()` call; add `pathLineGraphics` property; add `drawPathLines()` method; call it from `create()` and `recalculatePaths()` |

**Total: 1 file, ~30-40 lines of new code.**

---

## Testing Checklist

- [ ] Path lines are visible on game start (before any towers placed)
- [ ] All 3 portal paths are drawn
- [ ] Lines update immediately when a tower is placed
- [ ] Lines update immediately when a tower is sold
- [ ] Lines do not obscure enemies, towers, or projectiles
- [ ] Lines are visible but not distracting (check alpha feels right)
- [ ] Lines follow diagonal segments correctly (not just grid-aligned)
- [ ] No performance issues from repeated `clear()` + redraw cycles
- [ ] Path lines work correctly in both Campaign and Endless modes
- [ ] Path lines redraw correctly after scene restart (game over → retry)
- [ ] Overlapping paths (before towers placed) don't appear too bright — combined alpha stays reasonable
