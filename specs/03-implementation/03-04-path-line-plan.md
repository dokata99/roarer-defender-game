# Path-Line Feature — Implementation Plan

> **For agentic workers:** Execute task-by-task. Each task ends with a commit.

**Goal:** Add a `PathfindingManager` and draw the enemy path lines on the grid.

**Parent spec:** [03-03-path-line-design.md](03-03-path-line-design.md)
**Feature spec:** [../01-game-design/01-02-enemy-path-line-spec.md](../01-game-design/01-02-enemy-path-line-spec.md)

---

## File Structure

| File | Action |
|---|---|
| `src/systems/PathfindingManager.ts` | Create |
| `src/scenes/GameScene.ts` | Modify: async `create()`, instantiate pathfinder, draw path lines |
| `src/config/constants.ts` | Add `PORTAL_CELLS`, `CASTLE_CELLS`, `PATH_LINE_COLOR`, `PATH_LINE_ALPHA`, `PATH_LINE_WIDTH`, `PATH_LINE_DEPTH` |

Note: `easystarjs` is already installed (from Slice 1). No new deps.

---

## Task 1: Add pathfinding constants and cell lists

**Files:**
- Modify: `src/config/constants.ts`

- [ ] **Step 1: Append to `src/config/constants.ts`**

Add this import line at the top of the file:

```typescript
import type { CellCoord } from '../systems/GridManager';
```

Then append the following at the bottom of the file, below the `SCENE_KEYS` block:

```typescript
export const PORTAL_CELLS: readonly CellCoord[] = [
  { col: 0, row: 2 },
  { col: 0, row: 3 },
  { col: 0, row: 4 },
];

export const CASTLE_CELLS: readonly CellCoord[] = [
  { col: GRID_COLS - 1, row: 2 },
  { col: GRID_COLS - 1, row: 3 },
  { col: GRID_COLS - 1, row: 4 },
];

export const PATH_LINE_COLOR = 0xff0000;
export const PATH_LINE_ALPHA = 0.3;
export const PATH_LINE_WIDTH = 2;
export const PATH_LINE_DEPTH = 3;
```

- [ ] **Step 2: Commit**

```bash
git add src/config/constants.ts
git commit -m "Add pathfinding and path-line constants"
```

---

## Task 2: PathfindingManager

**Files:**
- Create: `src/systems/PathfindingManager.ts`

easystarjs ships without TypeScript types. Handle via a minimal `declare module` block inside the manager.

- [ ] **Step 1: Create `src/systems/PathfindingManager.ts`**

```typescript
// easystarjs has no bundled types; declare the shape we use.
declare module 'easystarjs' {
  export default class EasyStar {
    setGrid(grid: number[][]): void;
    setAcceptableTiles(tiles: number[]): void;
    enableDiagonals(): void;
    disableCornerCutting(): void;
    findPath(
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      cb: (path: Array<{ x: number; y: number }> | null) => void,
    ): void;
    calculate(): void;
  }
}

import EasyStar from 'easystarjs';
import type { CellCoord } from './GridManager';
import { GridManager } from './GridManager';

const WALKABLE = 0;
const BLOCKED = 1;

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export class PathfindingManager {
  private readonly easystar: EasyStar;

  constructor(
    private readonly grid: GridManager,
    private readonly portals: readonly CellCoord[],
    private readonly castles: readonly CellCoord[],
  ) {
    this.easystar = new EasyStar();
    this.easystar.setAcceptableTiles([WALKABLE]);
    this.easystar.enableDiagonals();
    this.easystar.disableCornerCutting();
  }

  /**
   * Recalculate paths from each portal to its nearest reachable castle cell.
   * Returns a Map keyed by the portal cell's string key ("col,row").
   * Portals with no valid path are omitted.
   */
  async recalculatePaths(
    blockedCells: ReadonlySet<string>,
  ): Promise<Map<string, CellCoord[]>> {
    this.easystar.setGrid(this.buildGrid(blockedCells));

    const results = new Map<string, CellCoord[]>();

    for (const portal of this.portals) {
      const path = await this.findShortestPathToAnyCastle(portal);
      if (path) {
        results.set(cellKey(portal.col, portal.row), path);
      }
    }

    return results;
  }

  private buildGrid(blockedCells: ReadonlySet<string>): number[][] {
    const matrix: number[][] = [];
    for (let row = 0; row < this.grid.rows; row++) {
      const r: number[] = [];
      for (let col = 0; col < this.grid.cols; col++) {
        r.push(blockedCells.has(cellKey(col, row)) ? BLOCKED : WALKABLE);
      }
      matrix.push(r);
    }
    return matrix;
  }

  private async findShortestPathToAnyCastle(
    portal: CellCoord,
  ): Promise<CellCoord[] | null> {
    let best: CellCoord[] | null = null;
    for (const castle of this.castles) {
      const path = await this.findPathOnce(portal, castle);
      if (path && (best === null || path.length < best.length)) {
        best = path;
      }
    }
    return best;
  }

  private findPathOnce(from: CellCoord, to: CellCoord): Promise<CellCoord[] | null> {
    return new Promise((resolve) => {
      this.easystar.findPath(from.col, from.row, to.col, to.row, (result) => {
        if (!result) {
          resolve(null);
          return;
        }
        resolve(result.map((p) => ({ col: p.x, row: p.y })));
      });
      this.easystar.calculate();
    });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/systems/PathfindingManager.ts
git commit -m "Add PathfindingManager wrapping easystarjs"
```

---

## Task 3: Wire path-line rendering into GameScene

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Replace `src/scenes/GameScene.ts` with the updated scene**

```typescript
import Phaser from 'phaser';
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
import { GridManager, type CellCoord } from '../systems/GridManager';
import { PathfindingManager } from '../systems/PathfindingManager';
import { HUD } from '../ui/HUD';
import { BottomBar } from '../ui/BottomBar';

export class GameScene extends Phaser.Scene {
  private grid!: GridManager;
  private pathfinder!: PathfindingManager;
  private pathLineGraphics!: Phaser.GameObjects.Graphics;
  private cachedPaths: Map<string, CellCoord[]> = new Map();

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  async create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.grid = new GridManager();
    this.pathfinder = new PathfindingManager(this.grid, PORTAL_CELLS, CASTLE_CELLS);

    this.drawGridCells();
    this.drawGridLines();
    this.drawPortalArt();
    this.drawCastleArt();

    this.pathLineGraphics = this.add.graphics();
    this.pathLineGraphics.setDepth(PATH_LINE_DEPTH);

    this.cachedPaths = await this.pathfinder.recalculatePaths(new Set());
    this.drawPathLines();

    new HUD(this);
    new BottomBar(this);

    this.addBackButton();
    this.addDevDefeatButton();
  }

  private drawPathLines() {
    this.pathLineGraphics.clear();
    this.pathLineGraphics.lineStyle(PATH_LINE_WIDTH, PATH_LINE_COLOR, PATH_LINE_ALPHA);

    for (const path of this.cachedPaths.values()) {
      if (path.length < 2) continue;
      const start = this.grid.cellToPixel(path[0].col, path[0].row);
      this.pathLineGraphics.beginPath();
      this.pathLineGraphics.moveTo(start.x, start.y);
      for (let i = 1; i < path.length; i++) {
        const p = this.grid.cellToPixel(path[i].col, path[i].row);
        this.pathLineGraphics.lineTo(p.x, p.y);
      }
      this.pathLineGraphics.strokePath();
    }
  }

  private drawGridCells() {
    const g = this.add.graphics();
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const type = this.grid.getCellType(col, row);
        const x = GRID_OFFSET_X + col * CELL_SIZE;
        const y = GRID_OFFSET_Y + row * CELL_SIZE;

        let fill: number = COLORS.gridCell;
        if (type === 'portal') fill = COLORS.portal;
        else if (type === 'castle') fill = COLORS.castle;

        g.fillStyle(fill, 1);
        g.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    for (let row = 2; row <= 4; row++) {
      const portalCenter = this.grid.cellToPixel(0, row);
      this.add
        .text(portalCenter.x, portalCenter.y, 'WWW', {
          fontSize: '14px',
          color: COLORS.textPrimary,
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const castleCenter = this.grid.cellToPixel(GRID_COLS - 1, row);
      this.add
        .text(castleCenter.x, castleCenter.y, 'SRV', {
          fontSize: '14px',
          color: COLORS.textPrimary,
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }
  }

  private drawGridLines() {
    const g = this.add.graphics();
    g.lineStyle(1, COLORS.gridBorder, 1);

    const left = GRID_OFFSET_X;
    const top = GRID_OFFSET_Y;
    const right = GRID_OFFSET_X + GRID_COLS * CELL_SIZE;
    const bottom = GRID_OFFSET_Y + GRID_ROWS * CELL_SIZE;

    for (let col = 0; col <= GRID_COLS; col++) {
      const x = GRID_OFFSET_X + col * CELL_SIZE;
      g.lineBetween(x, top, x, bottom);
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      const y = GRID_OFFSET_Y + row * CELL_SIZE;
      g.lineBetween(left, y, right, y);
    }
  }

  private drawPortalArt() {
    const pad = 20;
    const width = GRID_OFFSET_X - pad * 2;
    const topLeft = this.grid.cellToTopLeft(0, 2);
    const height = 3 * CELL_SIZE;

    const g = this.add.graphics();
    g.fillStyle(COLORS.portal, 1);
    g.fillRect(pad, topLeft.y, width, height);
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeRect(pad, topLeft.y, width, height);

    this.add
      .text(pad + width / 2, topLeft.y + height / 2, 'WWW\nPORTAL', {
        fontSize: '28px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
  }

  private drawCastleArt() {
    const pad = 20;
    const width = GRID_OFFSET_X - pad * 2;
    const gridRight = GRID_OFFSET_X + GRID_COLS * CELL_SIZE;
    const x = gridRight + pad;
    const topLeft = this.grid.cellToTopLeft(GRID_COLS - 1, 2);
    const height = 3 * CELL_SIZE;

    const g = this.add.graphics();
    g.fillStyle(COLORS.castle, 1);
    g.fillRect(x, topLeft.y, width, height);
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeRect(x, topLeft.y, width, height);

    this.add
      .text(x + width / 2, topLeft.y + height / 2, 'SERVER\n(castle)', {
        fontSize: '24px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
  }

  private addBackButton() {
    const btn = this.add
      .text(20, 28, '< Back to Menu', {
        fontSize: '16px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor(COLORS.textAccent));
    btn.on('pointerout', () => btn.setColor(COLORS.textPrimary));
    btn.on('pointerdown', () => this.scene.start(SCENE_KEYS.MAIN_MENU));
  }

  private addDevDefeatButton() {
    const btn = this.add
      .text(CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20, '[DEV] Trigger Defeat', {
        fontSize: '14px',
        color: COLORS.textDanger,
        fontFamily: 'sans-serif',
      })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#ffaaaa'));
    btn.on('pointerout', () => btn.setColor(COLORS.textDanger));
    btn.on('pointerdown', () => this.scene.start(SCENE_KEYS.GAME_OVER));
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Build verification**

Run: `npm run build`
Expected: bundle completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "Draw enemy path lines on the grid using easystarjs"
```

---

## Acceptance check

After Task 3:

1. ☐ `npm run build` passes.
2. ☐ `npm run dev` → Start Run → 3 semi-transparent red horizontal lines visible at rows 2, 3, 4 of the grid, spanning from portal tiles to castle tiles.
3. ☐ Grid, portal/castle placeholders, HUD, BottomBar, Back button, and Trigger Defeat button still work.
