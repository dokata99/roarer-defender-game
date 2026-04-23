# Path Tier Visuals — Implementation Plan

> **For agentic workers:** Execute task-by-task. **Do not auto-commit** — per user preference, staging/committing is user-driven. Skip any "commit" step unless user explicitly asks.

**Goal:** Render the enemy path with a tier-themed texture (grass / cobblestone / bricks) and tier-themed red line, updating on wave changes and tower place/sell.

**Design:** [03-05-path-tier-visuals-design.md](03-05-path-tier-visuals-design.md)

---

## File map

| File | Action |
|---|---|
| `src/config/pathStyle.ts` | **Create** — tier enum, tier→line-style lookup, texture keys |
| `src/ui/PathTextures.ts` | **Create** — procedural texture generator, called once per scene |
| `src/ui/PathRenderer.ts` | **Create** — owns cell sprites + line graphics, manages pulse tween |
| `src/scenes/GameScene.ts` | **Modify** — delete old path-line code, wire in PathRenderer, add `getCurrentPathTier()`, add shutdown cleanup |
| `src/config/constants.ts` | **Modify** — `PATH_LINE_*` constants become tier-specific and move to `pathStyle.ts`; keep `PATH_LINE_DEPTH` only |

---

## Task 1: pathStyle config

**Files:** `src/config/pathStyle.ts` (new)

- [ ] **Create `src/config/pathStyle.ts`**

```typescript
import type { EnemySpec } from '../entities/Enemy';
import type { WaveConfig } from './waves';

export type PathTier = 'normal' | 'elite' | 'boss';

export const PATH_TILE_DEPTH = 2;
export const PATH_LINE_DEPTH = 3;

export const PATH_TEXTURE_KEYS: Record<PathTier, string> = {
  normal: 'path-tile-grass',
  elite: 'path-tile-cobble',
  boss: 'path-tile-brick',
};

export interface PathLineStyle {
  color: number;
  width: number;
  /** If `pulse` is set, alpha tween between [pulse.from, pulse.to] at `pulse.hz`. Otherwise static alpha. */
  alpha: number;
  pulse?: { from: number; to: number; hz: number };
  /** If set, draws dashed segments with [on, off] pixel lengths. */
  dash?: [number, number];
}

export const PATH_LINE_STYLES: Record<PathTier, PathLineStyle> = {
  normal: { color: 0xff4d4d, width: 2, alpha: 0.28 },
  elite: { color: 0xff8c42, width: 2.5, alpha: 0.38, dash: [8, 4] },
  boss: {
    color: 0xff2e63,
    width: 3,
    alpha: 0.45,
    pulse: { from: 0.3, to: 0.6, hz: 1.5 },
  },
};

export function tierFromWave(wave: WaveConfig | null): PathTier {
  if (!wave) return 'normal';
  const hasBoss = wave.spawns.some((s: EnemySpec) => s.type === 'boss');
  if (hasBoss) return 'boss';
  const hasElite = wave.spawns.some((s: EnemySpec) => s.type === 'elite');
  if (hasElite) return 'elite';
  return 'normal';
}
```

- [ ] **Remove the old PATH_LINE_* constants from `src/config/constants.ts`** (leave them out — the new constants in `pathStyle.ts` replace them, and `PATH_LINE_DEPTH` moved too).

Delete these lines from `constants.ts`:

```typescript
export const PATH_LINE_COLOR = 0xff0000;
export const PATH_LINE_ALPHA = 0.3;
export const PATH_LINE_WIDTH = 2;
export const PATH_LINE_DEPTH = 3;
```

- [ ] **Type-check:** `npx tsc --noEmit` — GameScene will have stale imports from constants; don't fix yet, Task 4 removes them.

---

## Task 2: Procedural textures

**Files:** `src/ui/PathTextures.ts` (new)

- [ ] **Create `src/ui/PathTextures.ts`**

```typescript
import Phaser from 'phaser';
import { CELL_SIZE } from '../config/constants';
import { PATH_TEXTURE_KEYS } from '../config/pathStyle';

/**
 * Register all 3 path-tile textures on the given scene's texture cache.
 * Idempotent — safe to call on scene re-entry.
 */
export function registerPathTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(PATH_TEXTURE_KEYS.normal)) drawGrass(scene);
  if (!scene.textures.exists(PATH_TEXTURE_KEYS.elite)) drawCobble(scene);
  if (!scene.textures.exists(PATH_TEXTURE_KEYS.boss)) drawBrick(scene);
}

function drawGrass(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x2d4a2b, 1);
  g.fillRect(0, 0, CELL_SIZE, CELL_SIZE);

  // Random blade strokes
  const rng = seededRng(42);
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(rng() * CELL_SIZE);
    const y = Math.floor(rng() * CELL_SIZE);
    const len = 3 + Math.floor(rng() * 4);
    const angle = rng() * Math.PI;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;
    g.lineStyle(2, 0x4a7841, 1);
    g.lineBetween(x, y, x + dx, y + dy);
  }

  // Dirt specks
  g.fillStyle(0x3d5a32, 0.6);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(rng() * CELL_SIZE);
    const y = Math.floor(rng() * CELL_SIZE);
    g.fillEllipse(x, y, 3 + rng() * 3, 2 + rng() * 2);
  }

  g.generateTexture(PATH_TEXTURE_KEYS.normal, CELL_SIZE, CELL_SIZE);
  g.destroy();
}

function drawCobble(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x23262a, 1);
  g.fillRect(0, 0, CELL_SIZE, CELL_SIZE);

  const rng = seededRng(7);
  const stoneColors = [0x5a5d62, 0x6a6d72, 0x7a7d82, 0x63666b];

  for (let i = 0; i < 7; i++) {
    const w = 14 + Math.floor(rng() * 10);
    const h = 14 + Math.floor(rng() * 10);
    const x = Math.floor(rng() * (CELL_SIZE - w));
    const y = Math.floor(rng() * (CELL_SIZE - h));
    const color = stoneColors[i % stoneColors.length];

    // Shadow
    g.fillStyle(0x15171a, 1);
    g.fillRoundedRect(x + 1, y + 1, w, h, 4);
    // Stone
    g.fillStyle(color, 1);
    g.fillRoundedRect(x, y, w, h, 4);
  }

  g.generateTexture(PATH_TEXTURE_KEYS.elite, CELL_SIZE, CELL_SIZE);
  g.destroy();
}

function drawBrick(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x1a0808, 1);
  g.fillRect(0, 0, CELL_SIZE, CELL_SIZE);

  const brickH = 22;
  const brickW = 24;
  const mortar = 1;
  const colors = [0x6b2020, 0x7a2424, 0x8c2828, 0x702222];
  const rng = seededRng(99);

  // 3 rows
  for (let row = 0; row < 3; row++) {
    const y = row * (brickH + mortar);
    const offset = row % 2 === 0 ? 0 : -brickW / 2;
    for (let col = -1; col < 4; col++) {
      const x = offset + col * (brickW + mortar);
      const clipX = Math.max(0, x);
      const clipW = Math.min(CELL_SIZE, x + brickW) - clipX;
      if (clipW <= 0) continue;
      const color = colors[Math.floor(rng() * colors.length)];
      g.fillStyle(color, 1);
      g.fillRect(clipX, y, clipW, brickH);
    }
  }

  g.generateTexture(PATH_TEXTURE_KEYS.boss, CELL_SIZE, CELL_SIZE);
  g.destroy();
}

/** Deterministic RNG so textures look identical each run. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
```

- [ ] **Type-check:** `npx tsc --noEmit` — file should compile standalone.

---

## Task 3: PathRenderer

**Files:** `src/ui/PathRenderer.ts` (new)

- [ ] **Create `src/ui/PathRenderer.ts`**

```typescript
import Phaser from 'phaser';
import { CELL_SIZE } from '../config/constants';
import {
  PATH_LINE_STYLES,
  PATH_TEXTURE_KEYS,
  PATH_TILE_DEPTH,
  PATH_LINE_DEPTH,
  type PathTier,
} from '../config/pathStyle';
import { GridManager, cellKey, type CellCoord } from '../systems/GridManager';

export class PathRenderer {
  private tiles: Phaser.GameObjects.Image[] = [];
  private line: Phaser.GameObjects.Graphics;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private currentTier: PathTier | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly grid: GridManager,
  ) {
    this.line = scene.add.graphics().setDepth(PATH_LINE_DEPTH);
  }

  render(paths: ReadonlyMap<string, CellCoord[]>, tier: PathTier): void {
    this.clearTiles();
    this.paintTiles(paths, tier);
    this.drawLine(paths, tier);
    this.applyTierFx(tier);
    this.currentTier = tier;
  }

  destroy(): void {
    this.clearTiles();
    this.line.destroy();
    this.killPulse();
  }

  // -------------------------------------------------------------

  private clearTiles(): void {
    for (const t of this.tiles) t.destroy();
    this.tiles = [];
  }

  private paintTiles(
    paths: ReadonlyMap<string, CellCoord[]>,
    tier: PathTier,
  ): void {
    const textureKey = PATH_TEXTURE_KEYS[tier];
    const painted = new Set<string>();

    for (const path of paths.values()) {
      for (const cell of path) {
        if (this.grid.isPortalCell(cell.col, cell.row)) continue;
        if (this.grid.isCastleCell(cell.col, cell.row)) continue;
        const key = cellKey(cell.col, cell.row);
        if (painted.has(key)) continue;
        painted.add(key);

        const topLeft = this.grid.cellToTopLeft(cell.col, cell.row);
        const img = this.scene.add
          .image(topLeft.x, topLeft.y, textureKey)
          .setOrigin(0, 0)
          .setDepth(PATH_TILE_DEPTH);
        this.tiles.push(img);
      }
    }
  }

  private drawLine(
    paths: ReadonlyMap<string, CellCoord[]>,
    tier: PathTier,
  ): void {
    const style = PATH_LINE_STYLES[tier];
    this.line.clear();
    this.line.lineStyle(style.width, style.color, 1);
    this.line.setAlpha(style.pulse ? style.pulse.from : style.alpha);

    for (const path of paths.values()) {
      if (path.length < 2) continue;
      if (style.dash) {
        this.strokeDashed(path, style.dash[0], style.dash[1]);
      } else {
        this.strokeSolid(path);
      }
    }
  }

  private strokeSolid(path: CellCoord[]): void {
    const start = this.grid.cellToPixel(path[0].col, path[0].row);
    this.line.beginPath();
    this.line.moveTo(start.x, start.y);
    for (let i = 1; i < path.length; i++) {
      const p = this.grid.cellToPixel(path[i].col, path[i].row);
      this.line.lineTo(p.x, p.y);
    }
    this.line.strokePath();
  }

  private strokeDashed(path: CellCoord[], on: number, off: number): void {
    let carry = 0; // how far into the current on/off cycle we are
    let inOn = true;

    for (let i = 0; i < path.length - 1; i++) {
      const a = this.grid.cellToPixel(path[i].col, path[i].row);
      const b = this.grid.cellToPixel(path[i + 1].col, path[i + 1].row);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      const ux = dx / len;
      const uy = dy / len;

      let travelled = 0;
      while (travelled < len) {
        const remaining = (inOn ? on : off) - carry;
        const step = Math.min(remaining, len - travelled);
        if (inOn) {
          const sx = a.x + ux * travelled;
          const sy = a.y + uy * travelled;
          const ex = a.x + ux * (travelled + step);
          const ey = a.y + uy * (travelled + step);
          this.line.lineBetween(sx, sy, ex, ey);
        }
        travelled += step;
        carry += step;
        if (carry >= (inOn ? on : off) - 1e-6) {
          carry = 0;
          inOn = !inOn;
        }
      }
    }
  }

  private applyTierFx(tier: PathTier): void {
    if (tier === this.currentTier) return;
    this.killPulse();
    const style = PATH_LINE_STYLES[tier];
    if (!style.pulse) return;
    const { from, to, hz } = style.pulse;
    this.pulseTween = this.scene.tweens.add({
      targets: this.line,
      alpha: { from, to },
      duration: Math.round(1000 / hz / 2),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private killPulse(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween.remove();
      this.pulseTween = null;
    }
  }
}
```

- [ ] **Type-check:** `npx tsc --noEmit` — should compile.

---

## Task 4: Wire PathRenderer into GameScene

**Files:** `src/scenes/GameScene.ts` (modify)

- [ ] **Replace the PATH_LINE imports** at the top of GameScene. Change this block:

```typescript
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  COLORS,
  SCENE_KEYS,
  PORTAL_CELLS,
  CASTLE_CELLS,
  PATH_LINE_COLOR,
  PATH_LINE_ALPHA,
  PATH_LINE_WIDTH,
  PATH_LINE_DEPTH,
} from '../config/constants';
```

Into this:

```typescript
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  COLORS,
  SCENE_KEYS,
  PORTAL_CELLS,
  CASTLE_CELLS,
} from '../config/constants';
import { tierFromWave, type PathTier } from '../config/pathStyle';
import { registerPathTextures } from '../ui/PathTextures';
import { PathRenderer } from '../ui/PathRenderer';
```

- [ ] **Replace the `pathLineGraphics` field declaration** with the renderer:

Change:

```typescript
private pathLineGraphics!: Phaser.GameObjects.Graphics;
```

Into:

```typescript
private pathRenderer!: PathRenderer;
```

- [ ] **Update `create()`** — replace the pathLineGraphics setup and `drawPathLines()` call.

Find this block near the top of `create()`:

```typescript
    this.pathLineGraphics = this.add.graphics();
    this.pathLineGraphics.setDepth(PATH_LINE_DEPTH);
```

Replace with:

```typescript
    registerPathTextures(this);
    this.pathRenderer = new PathRenderer(this, this.grid);
    this.events.once('shutdown', () => this.pathRenderer.destroy());
```

- [ ] **Replace every `this.drawPathLines()` call** (4 call sites, per the spec) with:

```typescript
    this.pathRenderer.render(this.cachedPaths, this.getCurrentPathTier());
```

The call sites are at roughly lines 119, 276, 337, 394 (after each `await this.recalculatePaths()`).

- [ ] **Delete the old `drawPathLines()` method** (around line 680 in current code). Replace with `getCurrentPathTier()`:

```typescript
  private getCurrentPathTier(): PathTier {
    const targetWave =
      this.phase === 'wave' ? this.waveIndex : this.waveIndex + 1;
    const cfg = this.buildWaveConfig(targetWave);
    return tierFromWave(cfg);
  }
```

- [ ] **Add a tier-refresh call when the wave ends.** Find the place where the scene transitions from `wave` phase back to `build` phase (look for `this.phase = 'build'` or the wave-cleared handler). After setting phase to build, call:

```typescript
    this.pathRenderer.render(this.cachedPaths, this.getCurrentPathTier());
```

This ensures the path re-skins to the next wave's tier as soon as the current wave clears.

Also add a call when wave *starts* — find `this.phase = 'wave'` (the Start Wave handler) and add the same line after it, so the tier updates from "upcoming" to "current" (usually same, but consistent).

- [ ] **Type-check:** `npx tsc --noEmit` — must be clean now.

- [ ] **Build:** `npm run build` — verify bundle produces.

---

## Task 5: Manual verification

- [ ] **Run `npm run dev`** and walk through:
  1. Main menu → Start Run → GameScene opens. Path cells show **grass** texture. Red line is muted red, solid.
  2. Place a tower that re-routes one path → new path cells get textured, old ones clear.
  3. Click Start Wave → wave runs; tier stays normal/grass.
  4. Clear wave 2 → during build phase before wave 3, path re-textures to **cobblestone**, line becomes orange and dashed.
  5. Keep playing to wave 9 clear → before wave 10, path becomes **bricks** with pulsing threat-red line.
  6. Start wave 10 → brick/pulse look persists during the wave.
  7. Portal/castle cells (col 0 and 12 at rows 2-4) stay purple/blue regardless of tier.
  8. Back to menu → Start Run again → grass returns, no duplicate textures registered (open devtools console, no warnings about texture keys).

- [ ] If any step fails, capture the screenshot / console output and iterate.

---

## Acceptance

All 8 steps of Task 5 pass. `npm run build` is clean. No TypeScript errors. User signs off.
