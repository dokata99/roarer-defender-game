# Path Tier Visuals — Design Spec

**Date:** 2026-04-23
**Related:** [01-02 enemy-path-line](../01-game-design/01-02-enemy-path-line-spec.md), [01-08 enemy-bestiary](../01-game-design/01-08-enemy-bestiary.md)

---

## Purpose

Each wave's threat level is currently invisible on the path — all paths render as the same thin red line. Players must read the wave preview text to know what's coming. The path view should *telegraph* the upcoming threat so wave-to-wave progression feels visible and visceral.

This spec turns the path into a themed surface — grass for normal waves, cobblestone for elites, bricks for the boss — plus a per-tier red guide line on top. During build phase the path previews the *upcoming* wave's tier; during wave phase it matches the *current* wave.

---

## Scope

### In scope

- **3 wave tiers** — `normal`, `elite`, `boss` — derived from the `spawns` contents of the upcoming / current `WaveConfig`.
- **Per-tier path cell texture** — generated procedurally at scene boot (no asset files):
  - `normal` → **grass**
  - `elite` → **cobblestone**
  - `boss` → **bricks**
- **Per-tier red guide line** on top of the textured path, matching the tier's threat feel:
  - `normal` → muted red, solid, 2 px, alpha 0.28
  - `elite` → orange, dashed (8 on / 4 off), 2.5 px, alpha 0.38
  - `boss` → threat red `0xff2e63`, 3 px, alpha pulsing 0.3↔0.6 at ~1.5 Hz
- Renders on scene create, on wave phase change (start wave, wave cleared), and on tower place/sell (already existing hooks).
- Graceful fallback if a cell lies on portal/castle (col 0 or 12, rows 2-4) → skip texturing it so the portal/castle visuals remain intact.

### Out of scope (deferred)

- Animated flow dots along the path ("post-MVP" in 01-02). If requested later.
- Per-path color variation (top vs middle vs bottom row). All paths share the tier look.
- Real asset tiles — textures are procedural for now.
- Smooth crossfade between tiers when the wave ends. Instant swap is fine for v1.

---

## Tier derivation

Given a `WaveConfig`, pick the tier by the most-threatening spawn type present:

```
containsBoss(spawns)    → 'boss'
else containsElite(...) → 'elite'    (mixed fast+elite also maps here)
else                     → 'normal'
```

### Which wave to read

- `phase === 'wave'` → current wave (`waveIndex`)
- else (`build`, `defeated`, `victory`) → upcoming wave (`waveIndex + 1`)
- If no such wave exists (e.g., after all 10 campaign waves cleared, awaiting victory transition) → fall back to `normal`. This state is ephemeral.

Works for both campaign (`CAMPAIGN_WAVES[n-1]`) and endless (`buildEndlessWave(n)`).

---

## Visual spec

### Grass (normal)
- Base fill: `0x2d4a2b` (dark mossy green)
- 10–14 random "blade" strokes per 72×72 tile: 2 px wide, 3–6 px long, rotated random angles, color `0x4a7841`
- 2–3 "dirt specks" per tile: 2–3 px filled ellipses, color `0x3d5a32`
- Feel: calm, organic, safe

### Cobblestone (elite)
- Base fill: `0x23262a` (near-black mortar)
- 6–8 irregular rounded rectangles per tile, radii 3–4 px, sizes 12–22 px per side, in shades `0x5a5d62` → `0x7a7d82`
- Each stone gets a darker 1 px shadow rim on one side for depth
- Feel: hardened, fortified

### Bricks (boss)
- Base fill: `0x1a0808` (dark mortar)
- 3 staggered brick rows per tile:
  - Row 0: 3 full bricks, ~24×22 px
  - Row 1: offset by half-brick, so visible edges at 0, 12, 36, 60, 72
  - Row 2: aligned like row 0
- Brick colors alternate in shades `0x6b2020` → `0x8c2828`
- 1 px mortar gap between bricks
- Feel: dangerous, ominous — the path turns red

### Red guide line per tier

| Tier | Color | Width | Alpha | Style | Notes |
|---|---|---|---|---|---|
| normal | `0xff4d4d` | 2 | 0.28 | solid | baseline |
| elite | `0xff8c42` | 2.5 | 0.38 | dashed 8/4 | warmer, discontinuous |
| boss | `0xff2e63` | 3 | pulsing 0.3↔0.6 | solid | Phaser tween on `alpha`, 1.5 Hz, yoyo infinite |

Dashed lines drawn by walking each segment and emitting short sub-lines at 8 px intervals with 4 px gaps.

Pulse owned by a single `Phaser.Tweens.Tween`. Stored on the renderer so tier transitions can destroy it. Non-boss tiers destroy the pulse tween and set alpha to the static value.

---

## Architecture

### New files

| File | Responsibility |
|---|---|
| `src/config/pathStyle.ts` | Tier enum, tier→line-style lookup, texture key strings |
| `src/ui/PathTextures.ts` | Generate the 3 procedural textures at scene boot (`registerPathTextures(scene)`) |
| `src/ui/PathRenderer.ts` | Owns the cell sprites + line graphics; exposes `render(paths, tier)`; manages pulse tween lifecycle |

### GameScene changes

- Remove `pathLineGraphics` + `drawPathLines()` — move into `PathRenderer`.
- On `create()`: call `registerPathTextures(this)` once, then construct `this.pathRenderer = new PathRenderer(this)`.
- Add a helper `private getCurrentPathTier(): PathTier` that reads `phase`, `waveIndex`, and `mode` to pick current vs upcoming WaveConfig.
- Every existing `this.drawPathLines()` call becomes `this.pathRenderer.render(this.cachedPaths, this.getCurrentPathTier())`.
- Add a call after wave ends (in the existing transition to build phase).

### Depth layering

| Depth | Element | Change |
|---|---|---|
| 1 | Grid cells | unchanged |
| 2 | Portal/castle cell fills, labels | unchanged |
| **2** | **Path tile sprites** (new) | rendered *after* grid cells but skip portal/castle cells |
| **3** | **Path line** (existing `PATH_LINE_DEPTH`) | moves into PathRenderer |
| 10+ | Towers, enemies, UI | unchanged |

Path tile sprites render at the same depth as portal/castle cell fills but are explicitly skipped on those cells, so visually the purple/blue cells keep their identity.

---

## Acceptance criteria

1. `npm run build` passes type-check and bundles.
2. Starting a fresh campaign run shows the path cells filled with grass texture and a muted-red solid line at 2 px.
3. Clearing wave 2 → during build phase before wave 3 (elite), path cells re-render as cobblestone and the line becomes orange + dashed.
4. Clearing wave 9 → build phase before wave 10 (boss): path cells re-render as bricks, line becomes threat-red and pulses.
5. Starting wave 10 → path keeps the brick/pulsing state (tier matches current wave).
6. Placing a tower that re-routes a path → textured cells update to the new path on the next frame; tier stays the same.
7. Switching to endless mode — wave 11 (normal cycle) → grass, wave 13 (elite) → cobblestone, wave 15 (boss) → bricks.
8. Portal and castle cells keep their purple/blue fills (not overwritten by path textures).

---

## Risks

- **Performance**: 1 sprite per path cell × 3 paths × up to ~13 cells = ~40 sprites max. Trivial on desktop. No concern.
- **Texture generation on scene boot**: Must run once; re-entry into GameScene must not double-register. `registerPathTextures(scene)` checks `scene.textures.exists('grass-path')` before drawing.
- **Pulse tween leak**: The renderer destroys its pulse tween in `destroy()` and on tier change. GameScene calls `pathRenderer.destroy()` on scene shutdown (via `this.events.once('shutdown', ...)`).
