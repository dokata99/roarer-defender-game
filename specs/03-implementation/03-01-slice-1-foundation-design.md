# Slice 1: Foundation — Design Spec

**Date:** 2026-04-23
**Parent spec:** [specs/01-game-design/01-01-game-spec.md](../01-game-design/01-01-game-spec.md)
**Slice:** 1 of 5 (Foundation)

---

## Purpose

Deliver a runnable, deployable shell of *Roarer Defense*: project scaffold, scene structure, navigation, and a rendered game grid with portal and castle placeholders. No gameplay logic yet.

This slice exists so that every subsequent slice (combat, campaign waves, meta-progression, endless) has a stable foundation to build on: a working Vite + Phaser setup, scene routing, a grid manager with coordinate math, and a Vercel deploy path.

---

## Scope

### In scope

- Vite + TypeScript (strict) + Phaser 3 project scaffold, runs via `npm run dev`
- `easystarjs` added as a dependency (unused this slice; reserved for Slice 2 pathfinding)
- Scene skeletons with Phaser-native scene navigation (`scene.start`)
- MainMenu with 5 buttons and a themed dark background
- GameScene renders: 13×7 grid, portal placeholder on the left, castle placeholder on the right, a top HUD stub (hardcoded `Lives: 100 / Gold: 100 / Wave: 0`), and a bottom UI bar stub
- GameOverScene overlay reachable from GameScene via a dev-only debug button (temporary — removed in Slice 2 when real defeat triggers exist)
- Shop/Stats/Credits scenes as "Under Construction" stubs with a back button
- Vercel-ready static build (`vite build` → `dist/`) and `vercel.json`
- Prettier config (formatting only; linting deferred to keep this slice tight)
- README with dev, build, and deploy instructions

### Out of scope (deferred to later slices)

- Towers, enemies, projectiles, pathfinding, waves → Slice 2
- Build/wave phase switching, tower upgrades/sell UX, pause, wave preview → Slice 3
- localStorage save, Roarer Points, Shop functionality, Stats content, VictoryScene → Slice 4
- Endless mode, animations, tooltips, range indicators, hit flashes, gold drop text → Slice 5
- Unit tests — explicitly skipped for this slice per user decision

---

## Tech & tooling

| Concern | Choice |
|---|---|
| Build | Vite |
| Language | TypeScript, `strict: true` |
| Game engine | Phaser 3 |
| Pathfinding | `easystarjs` (installed, unused this slice) |
| Format | Prettier, defaults only (ESLint deferred) |
| Deploy | Vercel static deploy from `dist/` |
| Node | 20+ |

---

## Scene structure

Scene transitions use Phaser's `this.scene.start(key)`. No external router.

| Scene | Slice 1 state |
|---|---|
| `MainMenuScene` | Full: title, 5 buttons. "Endless Mode" button is visually locked (hardcoded `false` — real unlock logic in Slice 4). |
| `GameScene` | Full for this slice: grid, portal, castle, HUD stub, bottom UI bar stub, Back to Menu button, dev-only "Trigger Defeat" debug button. |
| `GameOverScene` | Bare overlay: "DEFEAT" header + "Back to Menu" button. Reachable via the debug button above. |
| `ShopScene` | "Under Construction" stub + Back button. |
| `StatsScene` | "Under Construction" stub + Back button. |
| `CreditsScene` | Final content: "Made with love by Nemetschek Bulgaria" + Back button. |
| `VictoryScene` | **Not created** in this slice. Added in Slice 3. |

---

## Rendering & layout

### Canvas

- **Fixed 1280×720**, Phaser `Scale.Scale.FIT` with letterboxing so smaller viewports scale down proportionally. This matches the spec's `minimum resolution: 1280×720` and its desktop-only mandate.

### Layout within the canvas

```
+----------------------------------------------------------+
|                      Top HUD stub                        |  56 px
+----------------------------------------------------------+
|           |                                  |           |
|  Portal   |         13 × 7  grid             |  Castle   |  504 px
|  art      |         936 × 504 px             |  art      |
|  172 px   |                                  |  172 px   |
|           |                                  |           |
+----------------------------------------------------------+
|                   Bottom UI bar stub                     |  160 px
+----------------------------------------------------------+
```

- Canvas: 1280 × 720. Vertical budget: 56 (HUD) + 504 (grid) + 160 (bottom) = 720 exact.
- Grid cell: **72 px square**, 13×7 → 936 × 504 px.
- Horizontal margins: (1280 − 936) / 2 = **172 px** on each side — used for portal/castle art.
- Grid origin (top-left corner): `(172, 56)`.
- Portal art area: left 172 px strip, vertically aligned to portal tiles (rows 2–4 of grid).
- Castle art area: right 172 px strip, vertically aligned to castle tiles (rows 2–4 of grid).
- Grid lines, cell fills, portal/castle rectangles drawn programmatically via `Phaser.GameObjects.Graphics`.

### Placeholders (per parent spec)

| Element | Placeholder |
|---|---|
| Grid cell | Dark grey fill, light grey 1-px border |
| Portal tiles (col 0, rows 2–4) | Purple/magenta rectangles, labeled "WWW" |
| Castle tiles (col 12, rows 2–4) | Blue rectangles, labeled "SERVER" |
| Portal art (left margin) | Larger purple rectangle, labeled "WWW" |
| Castle art (right margin) | Larger blue rectangle, labeled "SERVER" |
| Background | Dark themed (`#0b0f1a` or similar near-black) |

---

## Directory layout

```
roarer-defender-game/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  vercel.json
  .prettierrc
  README.md
  src/
    main.ts                 # Phaser Game config + scene registration
    scenes/
      MainMenuScene.ts
      GameScene.ts
      GameOverScene.ts
      ShopScene.ts          # stub
      StatsScene.ts         # stub
      CreditsScene.ts
    systems/
      GridManager.ts        # grid dims, cell <-> pixel math, cell-type classification
    config/
      constants.ts          # GRID_COLS, GRID_ROWS, CELL_SIZE, CANVAS_W/H, colors, scene keys
    ui/
      HUD.ts                # top bar stub (static values)
      BottomBar.ts          # bottom UI bar stub
```

`entities/`, `config/waves.ts`, `config/towers.ts`, etc. from the parent spec's planned structure are not created in this slice — they appear as they're needed in later slices.

---

## Key modules

### `config/constants.ts`
Pure constants only, no behavior. Exports:
- `CANVAS_WIDTH = 1280`, `CANVAS_HEIGHT = 720`
- `GRID_COLS = 13`, `GRID_ROWS = 7`, `CELL_SIZE = 72`
- `GRID_OFFSET_X`, `GRID_OFFSET_Y` (derived)
- `SCENE_KEYS = { MAIN_MENU, GAME, GAME_OVER, SHOP, STATS, CREDITS }`
- Color palette: background, grid cell, grid border, portal, castle, text

### `systems/GridManager.ts`
No game state yet — just geometry and classification. Responsibilities:
- `cellToPixel(col, row) → { x, y }` (cell center)
- `pixelToCell(x, y) → { col, row } | null` (null if outside grid)
- `getCellType(col, row) → 'portal' | 'castle' | 'buildable' | 'out-of-bounds'`
- `isPortalCell`, `isCastleCell` helpers

This module is a pure data/math class — it holds no Phaser objects. Slice 2 extends it to track tower occupancy and path validation.

### `scenes/GameScene.ts`
- Instantiates `GridManager`
- Draws grid lines, cell fills, portal/castle placeholders using Phaser Graphics
- Creates HUD and BottomBar UI components
- Adds Back button and dev-only "Trigger Defeat" button

### `ui/HUD.ts`, `ui/BottomBar.ts`
Dumb view components that accept their Phaser scene in the constructor and draw themselves. For this slice they display hardcoded text.

---

## Deployment

- `vite build` produces static output in `dist/`
- `vercel.json`: minimal — specify `outputDirectory: "dist"` and `framework: "vite"`
- README documents: `npm install`, `npm run dev`, `npm run build`, and either `vercel deploy` or Git-integrated deploy

---

## Acceptance criteria

1. `npm install && npm run dev` opens the game at localhost and renders the main menu.
2. Main menu shows: title "Roarer Defense", 5 buttons (Start Run, Endless Mode [locked], Shop, Stats, Credits). Endless Mode button is visibly greyed out with a lock indicator and is non-interactive.
3. Clicking Start Run → GameScene renders with grid (13×7, visible lines), portal (col 0 rows 2–4 in purple + left-margin art), castle (col 12 rows 2–4 in blue + right-margin art), HUD showing `Lives: 100 / Gold: 100 / Wave: 0`, bottom UI bar stub, and a Back button.
4. Clicking the dev-only "Trigger Defeat" button → GameOverScene with "DEFEAT" header and Back to Menu.
5. Clicking Shop, Stats, or Credits from the main menu → respective scene renders (with Credits showing real content, Shop/Stats showing "Under Construction"). Back button returns to main menu from each.
6. `npm run build` succeeds with zero errors and produces `dist/index.html` plus hashed JS/CSS assets.
7. `vercel deploy --prod` (or Vercel Git integration) serves the built site successfully; main menu loads; scene navigation works in the deployed build.
8. TypeScript strict mode passes with zero errors.

---

## Risks / open questions

- **Phaser + Vite ESM compatibility**: confirm the Phaser package imports cleanly with Vite's ESM pipeline. Mitigation: official Phaser-Vite template exists as reference.
- **Canvas crispness at non-native scale**: `Scale.FIT` may produce blurry output at non-integer scale factors. Acceptable for a placeholder build; revisit if it looks bad.

---

## Definition of done

All 8 acceptance criteria pass, code is committed to `main`, and a Vercel preview URL is shared that runs the build successfully.
