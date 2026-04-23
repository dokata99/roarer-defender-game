# Slice 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a runnable, Vercel-deployable Phaser 3 + Vite + TypeScript project with a main menu, a GameScene rendering a 13×7 grid with portal/castle placeholders, and stubs for the remaining scenes.

**Architecture:** Single-page Vite app mounting a Phaser 3 `Game` into `#app`. Scene routing uses Phaser's built-in `scene.start(key)`. Grid geometry and cell classification live in a pure `GridManager` module with no Phaser coupling. UI components (`HUD`, `BottomBar`) are dumb view classes that accept a `Phaser.Scene` and draw themselves. No tests this slice (skipped by user decision — restore TDD in Slice 2).

**Tech Stack:** Vite 5, TypeScript 5 (strict), Phaser 3.85, easystarjs (installed, unused), Prettier, Vercel static deploy.

**Parent spec:** [specs/03-implementation/03-01-slice-1-foundation-design.md](03-01-slice-1-foundation-design.md)

---

## File Structure

Files created in this slice:

| File | Responsibility |
|---|---|
| `package.json` | Dependencies, npm scripts |
| `tsconfig.json` | TypeScript strict config |
| `vite.config.ts` | Vite build config |
| `index.html` | Vite entry HTML, mounts `#app` |
| `vercel.json` | Vercel static deploy config |
| `.gitignore` | Node/Vite/Vercel ignores |
| `.prettierrc` | Prettier config |
| `README.md` | Dev/build/deploy instructions |
| `src/main.ts` | Phaser Game bootstrap, scene registration |
| `src/config/constants.ts` | Canvas/grid dimensions, colors, scene keys |
| `src/systems/GridManager.ts` | Grid math: cell↔pixel, cell-type classification |
| `src/scenes/MainMenuScene.ts` | Title + 5 buttons, handles navigation |
| `src/scenes/GameScene.ts` | Grid + portal + castle + HUD + bottom bar + dev buttons |
| `src/scenes/GameOverScene.ts` | DEFEAT overlay + Back to Menu |
| `src/scenes/ShopScene.ts` | "Under Construction" stub |
| `src/scenes/StatsScene.ts` | "Under Construction" stub |
| `src/scenes/CreditsScene.ts` | "Made with love by Nemetschek Bulgaria" + Back |
| `src/ui/HUD.ts` | Top bar: static Lives / Gold / Wave text |
| `src/ui/BottomBar.ts` | Bottom bar stub |

---

## Task Verification Pattern (no tests this slice)

Since Slice 1 skips unit tests, each task follows this pattern:

1. Write the code
2. Run `npm run dev` (if not already running) and open http://localhost:5173
3. Verify the described visual/behavioral outcome in the browser
4. Commit

Keep `npm run dev` running in a second terminal throughout — Vite HMR reflects changes instantly.

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `.gitignore`
- Create: `.prettierrc`
- Create: `src/main.ts` (temporary placeholder)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "roarer-defender-game",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "format": "prettier --write \"src/**/*.ts\" \"*.{json,md}\""
  },
  "dependencies": {
    "easystarjs": "^0.4.4",
    "phaser": "^3.85.2"
  },
  "devDependencies": {
    "prettier": "^3.3.3",
    "typescript": "^5.6.2",
    "vite": "^5.4.8"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "lib": ["ES2020", "DOM"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: true,
  },
});
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Roarer Defense</title>
    <style>
      html, body { margin: 0; padding: 0; background: #000; min-height: 100vh; }
      body { display: flex; align-items: center; justify-content: center; }
      #app { display: flex; align-items: center; justify-content: center; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
dist/
.vercel/
.env
.env.*
*.log
.DS_Store
```

- [ ] **Step 6: Create `.prettierrc`**

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 7: Create placeholder `src/main.ts`**

```typescript
console.log('Roarer Defense: scaffold up');
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: installs without errors. `node_modules/` appears. `package-lock.json` is created.

- [ ] **Step 9: Verify dev server boots**

Run: `npm run dev`
Expected: Vite logs `Local: http://localhost:5173/`. Opening the URL shows a blank page (the `console.log` appears in the browser console). Leave this running.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html .gitignore .prettierrc src/main.ts
git commit -m "Scaffold Vite + TypeScript + Phaser project"
```

---

## Task 2: Constants Module

**Files:**
- Create: `src/config/constants.ts`

- [ ] **Step 1: Create `src/config/constants.ts`**

```typescript
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const GRID_COLS = 13;
export const GRID_ROWS = 7;
export const CELL_SIZE = 72;

export const GRID_PIXEL_WIDTH = GRID_COLS * CELL_SIZE;
export const GRID_PIXEL_HEIGHT = GRID_ROWS * CELL_SIZE;

export const HUD_HEIGHT = 56;
export const BOTTOM_BAR_HEIGHT = 160;

export const GRID_OFFSET_X = (CANVAS_WIDTH - GRID_PIXEL_WIDTH) / 2;
export const GRID_OFFSET_Y = HUD_HEIGHT;

export const COLORS = {
  background: 0x0b0f1a,
  gridCell: 0x1a2033,
  gridBorder: 0x2a3a55,
  portal: 0x9933cc,
  castle: 0x3366cc,
  hudBg: 0x141a2a,
  bottomBarBg: 0x141a2a,
  textPrimary: '#ffffff',
  textMuted: '#8896b5',
  textGold: '#ffcc66',
  textAccent: '#66ffff',
  textDanger: '#ff4444',
} as const;

export const SCENE_KEYS = {
  MAIN_MENU: 'MainMenuScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
  SHOP: 'ShopScene',
  STATS: 'StatsScene',
  CREDITS: 'CreditsScene',
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/config/constants.ts
git commit -m "Add constants module for canvas/grid dimensions and colors"
```

---

## Task 3: GridManager Module

**Files:**
- Create: `src/systems/GridManager.ts`

- [ ] **Step 1: Create `src/systems/GridManager.ts`**

```typescript
import {
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
} from '../config/constants';

export type CellType = 'portal' | 'castle' | 'buildable' | 'out-of-bounds';

export interface CellCoord {
  col: number;
  row: number;
}

export interface PixelCoord {
  x: number;
  y: number;
}

export class GridManager {
  readonly cols = GRID_COLS;
  readonly rows = GRID_ROWS;
  readonly cellSize = CELL_SIZE;

  /** Returns the pixel center of the given cell. */
  cellToPixel(col: number, row: number): PixelCoord {
    return {
      x: GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2,
      y: GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  /** Returns the pixel top-left of the given cell. */
  cellToTopLeft(col: number, row: number): PixelCoord {
    return {
      x: GRID_OFFSET_X + col * CELL_SIZE,
      y: GRID_OFFSET_Y + row * CELL_SIZE,
    };
  }

  /** Returns the cell at the given pixel position, or null if outside the grid. */
  pixelToCell(x: number, y: number): CellCoord | null {
    const col = Math.floor((x - GRID_OFFSET_X) / CELL_SIZE);
    const row = Math.floor((y - GRID_OFFSET_Y) / CELL_SIZE);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return { col, row };
  }

  getCellType(col: number, row: number): CellType {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
      return 'out-of-bounds';
    }
    if (col === 0 && row >= 2 && row <= 4) return 'portal';
    if (col === GRID_COLS - 1 && row >= 2 && row <= 4) return 'castle';
    return 'buildable';
  }

  isPortalCell(col: number, row: number): boolean {
    return this.getCellType(col, row) === 'portal';
  }

  isCastleCell(col: number, row: number): boolean {
    return this.getCellType(col, row) === 'castle';
  }

  isBuildable(col: number, row: number): boolean {
    return this.getCellType(col, row) === 'buildable';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/GridManager.ts
git commit -m "Add GridManager with cell/pixel math and cell-type classification"
```

---

## Task 4: Phaser Bootstrap + Empty MainMenuScene

**Files:**
- Create: `src/scenes/MainMenuScene.ts` (empty for now)
- Modify: `src/main.ts`

- [ ] **Step 1: Create empty `src/scenes/MainMenuScene.ts`**

```typescript
import Phaser from 'phaser';
import { COLORS, SCENE_KEYS } from '../config/constants';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MAIN_MENU);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Roarer Defense (loading…)', {
        fontSize: '32px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);
  }
}
```

- [ ] **Step 2: Replace `src/main.ts` with Phaser bootstrap**

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './config/constants';
import { MainMenuScene } from './scenes/MainMenuScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainMenuScene],
};

new Phaser.Game(config);
```

- [ ] **Step 3: Verify in browser**

With `npm run dev` running, refresh http://localhost:5173.
Expected: the page shows a 1280×720 dark-themed canvas (scaled to fit the viewport, letterboxed) with the text "Roarer Defense (loading…)" centered.

- [ ] **Step 4: Commit**

```bash
git add src/main.ts src/scenes/MainMenuScene.ts
git commit -m "Bootstrap Phaser Game with empty MainMenuScene"
```

---

## Task 5: Full MainMenuScene with 5 Buttons

**Files:**
- Modify: `src/scenes/MainMenuScene.ts`

- [ ] **Step 1: Replace `src/scenes/MainMenuScene.ts` with full menu**

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, COLORS, SCENE_KEYS } from '../config/constants';

type MenuButton = {
  label: string;
  targetScene: string | null;
  enabled: boolean;
};

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MAIN_MENU);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(CANVAS_WIDTH / 2, 120, 'Roarer Defense', {
        fontSize: '72px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, 190, 'Defend the server from internet threats', {
        fontSize: '18px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    const buttons: MenuButton[] = [
      { label: 'Start Run', targetScene: SCENE_KEYS.GAME, enabled: true },
      { label: 'Endless Mode  [LOCKED]', targetScene: null, enabled: false },
      { label: 'Shop', targetScene: SCENE_KEYS.SHOP, enabled: true },
      { label: 'Stats', targetScene: SCENE_KEYS.STATS, enabled: true },
      { label: 'Credits', targetScene: SCENE_KEYS.CREDITS, enabled: true },
    ];

    const startY = 290;
    const gap = 64;

    buttons.forEach((btn, i) => {
      const y = startY + i * gap;
      const baseColor = btn.enabled ? COLORS.textPrimary : COLORS.textMuted;

      const text = this.add
        .text(CANVAS_WIDTH / 2, y, btn.label, {
          fontSize: '30px',
          color: baseColor,
          fontFamily: 'sans-serif',
        })
        .setOrigin(0.5);

      if (btn.enabled && btn.targetScene) {
        const target = btn.targetScene;
        text.setInteractive({ useHandCursor: true });
        text.on('pointerover', () => text.setColor(COLORS.textAccent));
        text.on('pointerout', () => text.setColor(baseColor));
        text.on('pointerdown', () => this.scene.start(target));
      }
    });
  }
}
```

- [ ] **Step 2: Verify in browser**

Refresh http://localhost:5173.
Expected:
- Title "Roarer Defense" at top, subtitle below
- 5 buttons vertically centered: Start Run, Endless Mode [LOCKED] (greyed out, not clickable), Shop, Stats, Credits
- Hovering enabled buttons turns them cyan and shows a hand cursor
- Clicking Shop/Stats/Credits/Start Run throws a Phaser warning in the console ("scene not found") — that's expected until later tasks register them

- [ ] **Step 3: Commit**

```bash
git add src/scenes/MainMenuScene.ts
git commit -m "Build MainMenuScene with title and 5 navigation buttons"
```

---

## Task 6: HUD and BottomBar UI Components

**Files:**
- Create: `src/ui/HUD.ts`
- Create: `src/ui/BottomBar.ts`

- [ ] **Step 1: Create `src/ui/HUD.ts`**

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, HUD_HEIGHT, COLORS } from '../config/constants';

export class HUD {
  constructor(scene: Phaser.Scene) {
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.hudBg, 1);
    bg.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
    bg.lineStyle(1, COLORS.gridBorder, 1);
    bg.strokeRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

    scene.add
      .text(40, HUD_HEIGHT / 2, 'Lives: 100', {
        fontSize: '20px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0, 0.5);

    scene.add
      .text(CANVAS_WIDTH / 2, HUD_HEIGHT / 2, 'Gold: 100', {
        fontSize: '20px',
        color: COLORS.textGold,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    scene.add
      .text(CANVAS_WIDTH - 40, HUD_HEIGHT / 2, 'Wave: 0 / 10', {
        fontSize: '20px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(1, 0.5);
  }
}
```

- [ ] **Step 2: Create `src/ui/BottomBar.ts`**

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BOTTOM_BAR_HEIGHT, COLORS } from '../config/constants';

export class BottomBar {
  constructor(scene: Phaser.Scene) {
    const y = CANVAS_HEIGHT - BOTTOM_BAR_HEIGHT;

    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.bottomBarBg, 1);
    bg.fillRect(0, y, CANVAS_WIDTH, BOTTOM_BAR_HEIGHT);
    bg.lineStyle(1, COLORS.gridBorder, 1);
    bg.strokeRect(0, y, CANVAS_WIDTH, BOTTOM_BAR_HEIGHT);

    scene.add
      .text(CANVAS_WIDTH / 2, y + BOTTOM_BAR_HEIGHT / 2, 'Towers and Start Wave controls arrive in Slice 2', {
        fontSize: '18px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/HUD.ts src/ui/BottomBar.ts
git commit -m "Add HUD and BottomBar UI stub components"
```

---

## Task 7: GameScene with Grid, Portal, Castle

**Files:**
- Create: `src/scenes/GameScene.ts`
- Modify: `src/main.ts` (register GameScene)

- [ ] **Step 1: Create `src/scenes/GameScene.ts`**

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
} from '../config/constants';
import { GridManager } from '../systems/GridManager';
import { HUD } from '../ui/HUD';
import { BottomBar } from '../ui/BottomBar';

export class GameScene extends Phaser.Scene {
  private grid!: GridManager;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.grid = new GridManager();

    this.drawGridCells();
    this.drawGridLines();
    this.drawPortalArt();
    this.drawCastleArt();

    new HUD(this);
    new BottomBar(this);

    this.addBackButton();
    this.addDevDefeatButton();
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

    // Labels inside portal and castle tiles
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
    g.lineStyle(2, COLORS.textPrimary, 0.5);
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
    g.lineStyle(2, COLORS.textPrimary, 0.5);
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

- [ ] **Step 2: Register `GameScene` in `src/main.ts`**

Replace `src/main.ts` with:

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './config/constants';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainMenuScene, GameScene],
};

new Phaser.Game(config);
```

- [ ] **Step 3: Verify in browser**

Refresh http://localhost:5173 and click Start Run.
Expected:
- HUD across top (Lives: 100 / Gold: 100 / Wave: 0 / 10)
- 13×7 grid of dark cells with visible borders
- 3 purple portal tiles on left (col 0, rows 2-4), each labeled "WWW"
- 3 blue castle tiles on right (col 12, rows 2-4), each labeled "SRV"
- Larger purple "WWW PORTAL" panel in the left margin, larger blue "SERVER" panel in the right margin
- Bottom bar with muted placeholder text
- Top-left "< Back to Menu" link (clicking returns to main menu)
- Bottom-right red "[DEV] Trigger Defeat" link (clicking throws a scene-not-found warning — fixed in Task 8)

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts src/main.ts
git commit -m "Add GameScene with grid, portal/castle placeholders, and HUD"
```

---

## Task 8: GameOverScene

**Files:**
- Create: `src/scenes/GameOverScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create `src/scenes/GameOverScene.ts`**

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCENE_KEYS } from '../config/constants';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100, 'DEFEAT', {
        fontSize: '96px',
        color: COLORS.textDanger,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'Run summary placeholder — real stats arrive in Slice 2', {
        fontSize: '18px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80, 'Back to Menu', {
        fontSize: '28px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor(COLORS.textAccent));
    back.on('pointerout', () => back.setColor(COLORS.textPrimary));
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.MAIN_MENU));
  }
}
```

- [ ] **Step 2: Register in `src/main.ts`**

Update the scene array in `src/main.ts` to include `GameOverScene`:

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './config/constants';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainMenuScene, GameScene, GameOverScene],
};

new Phaser.Game(config);
```

- [ ] **Step 3: Verify in browser**

Refresh, Start Run → click "[DEV] Trigger Defeat".
Expected: Red "DEFEAT" header, placeholder summary text, "Back to Menu" button that returns to main menu.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameOverScene.ts src/main.ts
git commit -m "Add GameOverScene with DEFEAT overlay"
```

---

## Task 9: Stub Scenes (Shop, Stats, Credits)

**Files:**
- Create: `src/scenes/ShopScene.ts`
- Create: `src/scenes/StatsScene.ts`
- Create: `src/scenes/CreditsScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create `src/scenes/ShopScene.ts`**

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCENE_KEYS } from '../config/constants';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SHOP);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(CANVAS_WIDTH / 2, 140, 'Shop', {
        fontSize: '64px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'Under Construction\n(arrives in Slice 4)', {
        fontSize: '28px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
        align: 'center',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80, '< Back to Menu', {
        fontSize: '22px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor(COLORS.textAccent));
    back.on('pointerout', () => back.setColor(COLORS.textPrimary));
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.MAIN_MENU));
  }
}
```

- [ ] **Step 2: Create `src/scenes/StatsScene.ts`**

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCENE_KEYS } from '../config/constants';

export class StatsScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.STATS);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(CANVAS_WIDTH / 2, 140, 'Stats', {
        fontSize: '64px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'Under Construction\n(arrives in Slice 4)', {
        fontSize: '28px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
        align: 'center',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80, '< Back to Menu', {
        fontSize: '22px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor(COLORS.textAccent));
    back.on('pointerout', () => back.setColor(COLORS.textPrimary));
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.MAIN_MENU));
  }
}
```

- [ ] **Step 3: Create `src/scenes/CreditsScene.ts`**

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCENE_KEYS } from '../config/constants';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.CREDITS);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(CANVAS_WIDTH / 2, 140, 'Credits', {
        fontSize: '64px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'Made with love by\nNemetschek Bulgaria', {
        fontSize: '36px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        align: 'center',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80, '< Back to Menu', {
        fontSize: '22px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor(COLORS.textAccent));
    back.on('pointerout', () => back.setColor(COLORS.textPrimary));
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.MAIN_MENU));
  }
}
```

- [ ] **Step 4: Register all three in `src/main.ts`**

Replace `src/main.ts` with the final version:

```typescript
import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './config/constants';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ShopScene } from './scenes/ShopScene';
import { StatsScene } from './scenes/StatsScene';
import { CreditsScene } from './scenes/CreditsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainMenuScene, GameScene, GameOverScene, ShopScene, StatsScene, CreditsScene],
};

new Phaser.Game(config);
```

- [ ] **Step 5: Verify in browser**

Refresh http://localhost:5173.
Expected: From the main menu, clicking Shop, Stats, and Credits each navigates to the respective scene. Shop and Stats show "Under Construction". Credits shows "Made with love by Nemetschek Bulgaria". Back buttons return to the main menu from each. No console warnings.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/ShopScene.ts src/scenes/StatsScene.ts src/scenes/CreditsScene.ts src/main.ts
git commit -m "Add Shop/Stats stub scenes and Credits scene"
```

---

## Task 10: Vercel Deploy Config and README

**Files:**
- Create: `vercel.json`
- Create: `README.md`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

- [ ] **Step 2: Create `README.md`**

````markdown
# Roarer Defense

A browser-based tower defense game with a cyber/digital theme. Defend the server from waves of internet threats.

Built with **Phaser 3 + Vite + TypeScript**. Deploys statically to Vercel.

## Development

```bash
npm install
npm run dev
```

Dev server runs at http://localhost:5173 with HMR.

## Build

```bash
npm run build
```

Type-checks (`tsc --noEmit`) and produces the static bundle in `dist/`.

## Deploy (Vercel)

Option A — CLI:

```bash
npm i -g vercel
vercel deploy          # preview
vercel deploy --prod   # production
```

Option B — Git integration: push to the branch connected to your Vercel project.

## Project Structure

```
src/
  main.ts              Phaser Game bootstrap
  config/constants.ts  Canvas/grid dimensions, colors, scene keys
  systems/             Headless game systems (GridManager, …)
  scenes/              Phaser scenes
  ui/                  UI view components (HUD, BottomBar, …)
specs/
  01-game-design/      Game design documents
  02-visual-design/    Visual design references
  03-implementation/   Slice-by-slice implementation specs & plans
```

## Specs

- Game spec: [specs/01-game-design/01-01-game-spec.md](specs/01-game-design/01-01-game-spec.md)
- Slice 1 Foundation design: [specs/03-implementation/03-01-slice-1-foundation-design.md](specs/03-implementation/03-01-slice-1-foundation-design.md)
- Slice 1 Foundation plan: [specs/03-implementation/03-02-slice-1-foundation-plan.md](specs/03-implementation/03-02-slice-1-foundation-plan.md)
````

- [ ] **Step 3: Verify production build**

Run: `npm run build`
Expected: no TypeScript errors, Vite logs "✓ built in …", `dist/index.html` and a hashed JS bundle exist in `dist/`.

- [ ] **Step 4: Verify the built bundle**

Run: `npm run preview`
Open the URL it prints. Expected: the main menu renders, all navigation works in the production build exactly as in dev.

- [ ] **Step 5: Commit**

```bash
git add vercel.json README.md
git commit -m "Add Vercel deploy config and README"
```

---

## Acceptance Criteria (final check)

After Task 10, walk through the parent spec's acceptance criteria:

1. ☐ `npm install && npm run dev` opens game at localhost; main menu renders with title and buttons.
2. ☐ Main menu shows: title, 5 buttons. Endless Mode is visibly locked and non-interactive.
3. ☐ Start Run → GameScene renders with grid, portal, castle, HUD, bottom UI bar, Back button.
4. ☐ "[DEV] Trigger Defeat" → GameOverScene with DEFEAT + Back to Menu.
5. ☐ Shop/Stats show "Under Construction"; Credits shows the Nemetschek Bulgaria text. Back buttons work from all three.
6. ☐ `npm run build` succeeds with zero errors.
7. ☐ `npm run preview` serves the built bundle; navigation works end-to-end.
8. ☐ TypeScript strict mode passes with zero errors.

If any criterion fails, fix before declaring Slice 1 done.

Optionally: run `vercel deploy` and confirm the preview URL works in the cloud. (This is part of the spec's Definition of Done but requires a Vercel account and CLI login — may need the user to drive.)
