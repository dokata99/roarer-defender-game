# Roarer Defense - Game Design Specification

## Overview

**Roarer Defense** is a browser-based tower defense game with a cyber/digital theme. Players defend their server (castle) from waves of internet threats (viruses, malware, trojans) spawning from a WWW portal. The core loop is: play a run, earn Roarer Points based on waves survived, spend points in the shop for permanent upgrades, repeat.

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Game Engine | **Phaser 3** | Purpose-built for 2D browser games; scene management, sprites, tilemaps, tweens, input all built-in |
| Language | **TypeScript** | Type safety, IDE support, better maintainability |
| Build Tool | **Vite** | Fast HMR, simple config, official Phaser template available |
| Pathfinding | **easystarjs** | Lightweight A* library, integrates cleanly with grid data |
| Data Persistence | **localStorage** | Simple, no backend needed. Stores Roarer Points and shop upgrades |
| Deployment | **Vercel** (static deploy) | Vite `build` output deployed as a static site; no SSR needed since Phaser is client-only |

### Platform Target
- **Desktop browsers only** (Chrome, Firefox, Edge, Safari)
- Mobile is explicitly **not supported** — no touch optimization, no responsive portrait layout
- Minimum resolution: 1280x720

---

## Screens & Navigation

```
Main Menu
  |--- Start Run -------> Game Screen (20 waves) -----> Run Complete / Game Over -> Main Menu
  |--- Endless Mode* ----> Game Screen (infinite) -----> Game Over -> Main Menu
  |--- Shop -------------> Shop Screen ----------------> Main Menu
  |--- Stats ------------> Stats Screen ---------------> Main Menu
  |--- Credits ----------> Credits Screen --------------> Main Menu

* Endless Mode is visible but locked until the player beats all 20 waves.
```

### Main Menu
- **Start Run** button - begins a new 20-wave run
- **Endless Mode** button - visible but locked (greyed out with lock icon). Unlocked permanently after first full 20-wave clear. Saved in localStorage
- **Shop** button - opens the upgrade shop
- **Stats** button - opens the player stats screen
- **Credits** button - shows credits
- Game title "Roarer Defense" prominently displayed
- Cyber/digital themed background

### Shop Screen
- Spend **Roarer Points** (RP) on permanent upgrades
- Display current RP balance
- Grid/list of upgrades with name, description, current level, cost, and buy button
- Back button to return to main menu

### Stats Screen
- Displays lifetime player statistics from `SaveData.stats`:
  - Total runs played
  - Total waves cleared
  - Total enemies killed
  - Best wave reached (campaign)
  - Best wave reached (endless)
- Back button to return to main menu

### Game Screen
- The grid arena (see Grid & Arena section)
- **Top bar**: Wave counter, Lives, Gold, current wave info
- **Wave preview**: Small display near the "Start Wave" button showing upcoming wave info (enemy count, enemy type, e.g., "Wave 3: 4 Elite enemies")
- **Bottom bar**: Tower selection panel (2 tower types), Sell button (build phase only)
- **Start Wave** button (top-right or bottom-right) - only active during build phase
- **Pause** button (top-right, next to or near Start Wave) - pauses the game during wave phase, shows a pause overlay with "Resume" and "Quit Run" options
- Build phase / Wave phase indicator
- **First build phase hint**: On the very first build phase of a run, a small centered text reads **"Build towers, defend the castle!"** — fades out after a few seconds or when the player places their first tower
- **Tower tooltips**: Hovering over a tower type in the selection panel shows a small tooltip with: name, cost, damage, attack interval, range
- **During Wave Phase**: The bottom bar only shows the **Upgrade** button for the selected tower. Place and Sell buttons are hidden (not greyed out — hidden entirely) to keep the UI clean

### Game Over / Defeat Screen
- Triggered when lives reach 0 or below
- Game **freezes immediately** (all movement, spawning, and firing stop)
- Overlay appears on the frozen game showing:
  - "DEFEAT" header
  - Waves survived
  - Enemies killed
  - Roarer Points earned
  - "Back to Menu" button

### Victory Screen
- Triggered after surviving wave 20 (final boss, "ROOT ACCESS")
- Shows:
  - "VICTORY" header (see `02-01` §5 Non-Gameplay Scenes for thematic "INCIDENT CONTAINED" layout)
  - Bonus Roarer Points
  - Enemies killed, towers placed
  - "Back to Menu" button

### Credits Screen
- "Made with love by Nemetschek Bulgaria" text, centered
- Back button to return to main menu

---

## Grid & Arena

### Dimensions
- **13 columns x 7 rows** (landscape orientation)
- Grid is centered horizontally with **free space on the left** (portal/WWW asset) and **free space on the right** (castle asset)
- Grid extends to the **top of the screen** (no top margin)
- **Small space at the bottom** for UI elements (tower panel, buttons)
- Grid lines are rendered programmatically (not part of background image)
- Each cell is a square of equal size, scaled to fit the available screen space

### Screen Layout
```
[Portal Asset] | [====== 13x7 Grid ======] | [Castle Asset]
  (WWW art)    |  (playable tower area)    |  (castle art)
               |                           |
               |___________________________|
               [______ Bottom UI Bar ______]
```

### Grid Layout
```
Col:  0    1    2    3    4    5    6    7    8    9   10   11   12
Row 0: [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]
Row 1: [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]
Row 2: [P]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [C]
Row 3: [P]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [C]
Row 4: [P]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [C]
Row 5: [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]
Row 6: [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]

[P] = Portal (enemy spawn, 3 tiles centered vertically on left edge, col 0)
[C] = Castle (player base, 3 tiles centered vertically on right edge, col 12)
```

- **Portal tiles** (column 0, rows 2-4): Enemies spawn from these tiles. Cannot place towers here. Visually themed as a "WWW / Internet" portal. A larger portal asset is displayed in the free space to the left of the grid.
- **Castle tiles** (column 12, rows 2-4): Player's base/server. Cannot place towers here. Enemies reaching these tiles deal damage to lives. A larger castle asset is displayed in the free space to the right of the grid.
- **Buildable tiles** (all other tiles): Player can place towers on any of these, provided it does not fully block the path.

### Path Blocking Rules
- Towers occupy exactly 1 grid cell and block movement through it
- Before placing a tower, the game must run a pathfinding check (BFS/A*) to verify at least one valid path still exists from every portal tile to at least one castle tile
- If placement would fully block all paths, the placement is **rejected** with visual/audio feedback ("Path blocked!")
- Enemies always take the **shortest available path** (recalculated via A* when towers are placed or sold)

---

## Towers

### Tower Types

#### 1. Splash Tower
| Stat | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Cost | 10 gold | +15 gold | +25 gold |
| Damage | 5 | 8 | 12 |
| Attack Interval | 0.83s | 0.71s | 0.63s |
| Range | 2.5 tiles | 3 tiles | 3.5 tiles |
| Splash Radius | 1 tile | 1.2 tiles | 1.5 tiles |

- Fires a projectile at the closest enemy in range
- On impact, deals damage to all enemies within the splash radius around the impact point
- Lower single-target DPS than Sniper, but effective against groups
- Placeholder visual: **Blue square** with level indicator

#### 2. Sniper Tower
| Stat | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Cost | 15 gold | +20 gold | +30 gold |
| Damage | 20 | 35 | 55 |
| Attack Interval | 2.0s | 1.67s | 1.43s |
| Range | 4 tiles | 5 tiles | 6 tiles |

- Fires a projectile at the **closest enemy** in range
- If the target dies before the projectile arrives, the **projectile vanishes** (shot is wasted)
- High single-target damage, slow fire rate, long range
- Placeholder visual: **Red square** with level indicator

### Tower Mechanics
- **Placing**: Click tower type in bottom panel, then click a valid grid cell. Costs gold. Validated against path-blocking rules. **Only allowed during Build Phase.**
- **Upgrading**: Click an existing tower, click "Upgrade" button. Costs gold. Max level 3. Improves damage, range, and attack interval. **Allowed during both Build Phase and Wave Phase.**
- **Selling**: Click an existing tower, click "Sell" button. Refunds **100%** of total gold invested (purchase price + all upgrade costs). **Only allowed during Build Phase.**
- **Targeting**: All towers target the **closest enemy** within range. Towers only fire during wave phase.

### Tower Placement UX
- Click a tower type in the bottom panel to enter **placement mode**
- While in placement mode:
  - A **range indicator** (semi-transparent circle) is shown around the cursor/hovered cell, previewing the tower's attack range
  - Valid cells highlight on hover; invalid cells (occupied, portal, castle, would block path) show a red tint
  - **Left-click** on a valid cell to place the tower
  - **Cancel placement** via any of:
    - **Right-click** anywhere
    - **ESC** key
    - **Click the tower icon again** in the bottom panel — when in placement mode, the selected tower's icon changes to an **X** to indicate clicking it will cancel
- After placing, placement mode ends (player must re-select to place another)

### Tower Projectiles
- Projectiles are visible and travel toward the target
- Splash tower: projectile hits target location, explosion visual plays, AoE damage applied. If the target dies mid-flight, the projectile continues to the last known position and still deals AoE damage on impact
- Sniper tower: fast projectile, tracks single target, damage applied on impact. If the target dies mid-flight, the **projectile vanishes** (shot is wasted — rewards precise targeting and good tower placement)
- Placeholder visuals: small circles (yellow for splash, white for sniper).
  **Note:** `02-01` supersedes the yellow splash placeholder with a **cyan orb** to keep
  the Firewall cyan-coded end-to-end; the yellow reference survives here for historical
  context only.

---

## Enemies

### Theme: Cyber Threats
All enemies are internet/digital themed - viruses, malware, spam bots, trojans, worms, DDoS packets.

### Enemy Types

The full stat blocks, theme, and counter strategy for each enemy live in
**`01-08-enemy-bestiary.md`** (single source of truth). Numbers below are the summary;
`01-08` + `src/config/enemies.ts` win on conflict.

#### Worm — Fast Ground (`type: fast`, `id: worm`)
| Stat | Value |
|------|-------|
| Base HP | 20 (scales per-wave via `waves.ts`) |
| Speed | 3.0 tiles/sec |
| Gold on Kill | 5 |
| Lives Lost on Reach | 10 |

- Small, fast, comes in large numbers. The "vocabulary" enemy — ~80% of ground spawns
- Themed as: Self-replicating worm malware (Conficker, ILOVEYOU)

#### Trojan — Elite Ground (`type: elite`, `id: trojan`)
| Stat | Value |
|------|-------|
| Base HP | 100 (scales per-wave) |
| Speed | 1.5 tiles/sec |
| Gold on Kill | 5 |
| Lives Lost on Reach | 20 |

- Fewer per wave, tanky, slower. Tests focus-fire / Killswitch investment
- Themed as: Trojan horse — looks harmless until it cracks open

#### Packet — Flying (`type: flying`, `id: packet`) *(proposed, per `01-04` / `01-08`)*
| Stat | Value |
|------|-------|
| Base HP | 30 |
| Speed | 2.0 tiles/sec |
| Gold on Kill | 5 |
| Lives Lost on Reach | 5 |

- Straight-line flight above the grid, ignores A*/towers, **only Killswitch can target**
- Forces dual-tower builds so players can't win the campaign with pure Firewall splash
- Themed as: A routed network packet traveling layer-3 — above application-layer defense

#### Zeroday — Boss (`type: boss`, `id: zeroday`)
| Stat | Value |
|------|-------|
| Base HP | 500 (multiplied 4-20x in campaign) |
| Speed | 1.0 tiles/sec |
| Gold on Kill | 5 |
| Lives Lost on Reach | 999 (instant game over) |

- Single enemy, massive HP pool. Appears on waves **10 and 20** in campaign,
  every 5 waves in endless starting wave 25
- Wave 10 boss is alone with no escort; wave 20 ("ROOT ACCESS") is the final boss
- Themed as: A zero-day exploit — unknown vulnerability, no patch

**Gold reward note (per `01-08`):** All enemies reward a **flat 5g** — intentional, to
prevent players from farming bosses for gold runaway. Difficulty is driven by wave-by-wave
throughput, not per-kill value.

### Enemy Pathfinding
- Uses A* (via easystarjs) on the grid
- Path is recalculated whenever a tower is placed or sold (during build phase only, since selling/placing is disabled during waves)
- Enemies always follow the shortest valid path from their spawn portal tile to the nearest castle tile
- Enemies move smoothly along the path (interpolated between grid cells)

### Spawn Behavior
- Enemies spawn one by one at **timed intervals** from the portal tiles
- Spawn interval varies by wave (faster waves = shorter interval)
- Enemies **cycle through the 3 portal rows** in order: row 2 → row 3 → row 4 → row 2 → ... (deterministic, not random)

---

## Wave System

### 20 Waves (Campaign)

Campaign is hand-tuned across **20 waves** grouped into four 5-wave arcs (tutorial,
upgrade pressure, strategy required, max investment). Boss waves land at **10 and 20**.

The authoritative per-wave table (archetypes, counts, HP, spawn intervals, wave names
and flavor) lives in:

- **`01-04-campaign-mode-design.md`** — arc structure, archetype catalog, and the
  concrete alternative wave table
- **`01-05-wave-flavor-script.md`** — wave names (e.g. "PING SWEEP", "ROOT ACCESS") and
  pre-wave flavor subtitles
- **`src/config/waves.ts`** — the actual code source of truth

This file is not duplicated here to prevent drift. If you need the numbers, read `01-04`.

**Arc summary:**

| Arc   | Waves | Theme                    | Wall at                          |
|-------|-------|--------------------------|----------------------------------|
| Arc 1 | 1-5   | Tutorial + first wall    | Wave 5 (first real swarm)        |
| Arc 2 | 6-10  | Upgrade pressure         | Wave 10 (first boss: ZERO-DAY)   |
| Arc 3 | 11-15 | Strategy required        | Wave 13 (hard elite push)        |
| Arc 4 | 16-20 | Max investment           | Wave 20 (final boss: ROOT ACCESS) |

### Wave Flow
1. **Build Phase**: Player places/sells/upgrades towers. "Start Wave" button is active. Wave preview shows upcoming enemies.
2. Player clicks **"Start Wave"** button.
3. **Wave Phase**: Enemies spawn at intervals. Tower **placing and selling are disabled**. Tower **upgrading is allowed**. Towers fire automatically.
4. Wave ends when all enemies are either killed or have reached the castle.
5. Lives are checked **after each enemy reaches the castle**. If lives reach 0 or below at any point: **game freezes immediately**, defeat overlay shown.
6. Return to **Build Phase** for next wave.
7. After wave 20 (final boss), if player survives: **Victory screen** with bonus Roarer Points.

### Pause
- Available during **Wave Phase** only (build phase is already a natural pause)
- Pause button in the top-right area of the HUD
- Pausing freezes all game logic: enemy movement, tower firing, projectile travel, spawn timers
- Pause overlay shows:
  - "PAUSED" text
  - **Resume** button — unpauses
  - **Quit Run** button — ends the run, awards RP for waves cleared so far, returns to main menu

### Endless Mode (Post-Game Unlock)

Unlocked permanently after first full 20-wave campaign clear. Continues from the
campaign's base difficulty with scaling formulas applied from wave 21 onward.
See `01-03-endless-mode-design.md` for the authoritative formulas — the numbers below
are reproduced for overview only and `01-03` / `src/config/endless.ts` win on conflict.

#### Wave Pattern (Repeating 5-Wave Cycle)
Starting at wave 21, the pattern repeats every 5 waves:

The concrete formulas, tables, and boss cadence live in **`01-03-endless-mode-design.md`**
and **`src/config/endless.ts`**. Core shape:

- 5-wave repeating cycle: Normal, Mixed, Elite, Mixed, Boss
- Bosses appear **every 5 waves** (25, 30, 35, ...) in endless (campaign bosses are 10 and 20)
- HP grows compound per wave; gold grows slower than HP so the player is slowly starved
- Enemy counts grow linearly, capped at 50 for browser performance
- Speeds grow logarithmically with hard caps

#### Roarer Points in Endless
- RP earned = total waves cleared (including the 20 campaign waves)
- e.g., dying on wave 33 = 32 RP

---

## Economy

### In-Run Currency: Gold
- **Starting gold**: 100 (enough for 10 splash towers at 10g each)
- Earned by **killing enemies** (amount per enemy type listed above)
- **Gold reward feedback**: When an enemy dies, a floating **"+Xg"** text (e.g., "+2g", "+8g") rises from the enemy's position and fades out over ~0.8 seconds. Color: gold/yellow. This gives satisfying visual feedback for each kill
- Spent on: placing towers, upgrading towers
- 100% refunded when selling towers (full refund)
- Gold does NOT carry over between runs

### Meta Currency: Roarer Points (RP)
- Earned at the **end of each run** based on waves cleared
- **Formula: RP earned = number of waves cleared** (e.g., cleared 6 waves = 6 RP, cleared all 20 = 20 RP)
- Spent in the **Shop** on permanent upgrades
- Persisted in localStorage

---

## Shop Upgrades (Permanent / Meta-Progression)

All upgrades have multiple levels. Costs increase per level.

### Upgrade List

| Upgrade | Description | Max Level | Effect per Level | Cost (RP) per Level |
|---------|-------------|-----------|-----------------|-------------------|
| **Starting Gold+** | More gold at run start | 5 | +20 gold per level | 3, 6, 10, 15, 22 |
| **Tower Damage+** | All towers deal more damage | 5 | +10% damage per level | 4, 8, 13, 19, 27 |
| **Tower Speed+** | All towers attack faster | 5 | -8% attack interval per level | 4, 8, 13, 19, 27 |
| **Tower Range+** | All towers have more range | 3 | +0.5 tile range per level | 5, 10, 17 |
| **Discount Towers** | Towers cost less gold | 3 | -10% tower cost per level | 5, 11, 18 |
| **Discount Upgrades** | Tower upgrades cost less gold | 3 | -10% upgrade cost per level | 5, 11, 18 |
| **Extra Lives** | Start with more lives | 5 | +20 lives per level | 2, 5, 9, 14, 20 |
| **Kill Bounty+** | Enemies drop more gold | 5 | +15% gold per kill per level | 4, 9, 15, 22, 30 |
| **Splash Radius+** | Splash tower AoE is larger | 3 | +0.3 tile splash radius per level | 6, 12, 20 |
| **Sniper Crit** | Sniper has chance to crit (2x dmg) | 3 | +10% crit chance per level | 7, 14, 22 |

> **Balance note**: With RP = waves cleared (max 20 per run), early upgrades are affordable in 1-2 runs, while maxing everything requires many successful runs. Total RP to max all upgrades: ~509 RP (~26 full clears).

---

## Player Stats

| Stat | Starting Value | Affected by Shop |
|------|---------------|-----------------|
| Lives | 100 | Extra Lives upgrade |
| Starting Gold | 100 | Starting Gold+ upgrade |

- **Lives**: When an enemy reaches the castle, the player loses lives equal to the enemy's "Lives Lost on Reach" value. Lives are checked **after each individual enemy** reaches the castle (not batched per frame).
- When lives reach **0 or below**: **Game freezes immediately** — all movement, spawning, and projectiles stop. Defeat overlay is shown. Run ends, RP earned based on waves survived.

---

## Game Loop Summary

```
1. MAIN MENU
   -> Player chooses "Start Run" (or "Endless Mode" if unlocked)

2. GAME SCREEN - BUILD PHASE (Wave 1)
   -> Player has starting gold (100 + shop bonuses)
   -> Wave preview shows: "Wave 1: 8 Fast enemies"
   -> Player places towers on the grid
   -> Range indicator shown when hovering with tower selected
   -> Path validation ensures enemies can always reach the castle
   -> Player clicks "Start Wave"

3. GAME SCREEN - WAVE PHASE
   -> Enemies spawn from portal cycling rows 2→3→4
   -> Enemies follow shortest path (A*) to castle
   -> Towers auto-fire projectiles at enemies in range
   -> Player can upgrade existing towers but cannot place or sell
   -> Player can pause the game
   -> Enemies take damage, die (drop gold), or reach castle (lose lives)
   -> If lives hit 0: FREEZE → defeat overlay
   -> Wave ends when all enemies resolved

4. BETWEEN WAVES
   -> Return to BUILD PHASE
   -> Player can place more towers, upgrade, sell
   -> Wave preview updates to show next wave info
   -> If lives > 0 and waves remain: repeat from step 3
   -> If all 20 waves cleared: VICTORY

5. RUN END
   -> Show summary: waves survived, enemies killed, towers placed
   -> Award Roarer Points based on performance
   -> If first time beating wave 20: unlock Endless Mode
   -> Return to Main Menu

6. SHOP (from Main Menu)
   -> Spend Roarer Points on permanent upgrades
   -> Upgrades apply to all future runs
```

---

## Placeholder Visuals

Since real assets will be created later (Gemini AI image gen), the initial build uses simple shapes:

| Element | Placeholder |
|---------|------------|
| Grid cells | Dark grey squares with light grey borders |
| Portal | Purple/magenta rectangle with "WWW" text |
| Castle | Blue rectangle with "SERVER" text |
| Splash Tower | Blue filled square, level number inside |
| Sniper Tower | Red filled square, level number inside |
| Fast Enemy | Small green circle |
| Elite Enemy | Medium orange circle |
| Boss | Large red circle, pulsing |
| Splash Projectile | Small yellow circle |
| Sniper Projectile | Small white circle |
| Splash Explosion | Expanding yellow circle (fades) |
| HP Bar | Small red/green bar above enemies |
| Range Indicator | Semi-transparent circle around cursor during placement |
| Background | Dark themed (dark grey/near black) |

---

## Animations (Asset Integration)

When real assets replace placeholders, the following animation approaches will be used:

### Sprite Sheet Animations
- **Enemy walk cycles**: Sprite sheet frames for movement animation, direction-aware if assets support it
- **Tower attack animations**: Sprite sheet frames for firing sequence (wind-up → fire → return to idle)
- **Enemy death**: Sprite sheet death animation or tween-based (shrink + fade)

### Tween-Based Animations (Phaser Tweens)
- **Tower idle bobbing**: Gentle `scaleX`/`scaleY` tween with `yoyo: true` for breathing/idle feel
- **Tower attack telegraph**: Brief scale-up or color flash before firing (tween on scale or tint)
- **Enemy hit flash**: `setTint(0xff0000)` for ~100ms on damage taken
- **Boss pulse**: Continuous scale tween to make the boss feel threatening
- **Projectile trails**: Phaser particle emitter following projectile position

### Implementation Notes
- Both sprite sheet and tween animations can coexist — use sprite sheets for complex multi-frame animations, tweens for simple transform effects
- All animation timings should respect pause state (freeze when paused)
- Tower attack animation duration should roughly match attack speed to feel responsive

---

## localStorage Data Structure

```typescript
interface SaveData {
  roarerPoints: number;
  endlessModeUnlocked: boolean;
  shopUpgrades: {
    startingGold: number;      // 0-5
    towerDamage: number;       // 0-5
    towerSpeed: number;        // 0-5
    towerRange: number;        // 0-3
    discountTowers: number;    // 0-3
    discountUpgrades: number;  // 0-3
    extraLives: number;        // 0-5
    killBounty: number;        // 0-5
    splashRadius: number;      // 0-3
    sniperCrit: number;        // 0-3
  };
  stats: {
    totalRuns: number;
    totalWavesCleared: number;
    totalEnemiesKilled: number;
    bestWaveReached: number;
    endlessBestWave: number;
  };
}
```

---

## Project Structure (Planned)

```
Gamecheck/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.ts                    # Phaser game config & entry point
    scenes/
      MainMenuScene.ts         # Main menu screen
      ShopScene.ts             # Shop/upgrades screen
      StatsScene.ts            # Player stats screen
      GameScene.ts             # Main gameplay scene
      CreditsScene.ts          # Credits screen
      GameOverScene.ts         # Defeat overlay / run end summary
      VictoryScene.ts          # Victory screen after wave 20
    entities/
      Tower.ts                 # Base tower class
      SplashTower.ts           # Splash tower
      SniperTower.ts           # Sniper tower
      Enemy.ts                 # Base enemy class
      Projectile.ts            # Projectile class
    systems/
      GridManager.ts           # Grid state, tower placement, path validation
      WaveManager.ts           # Wave spawning, progression, endless scaling
      PathfindingManager.ts    # A* pathfinding via easystarjs
      EconomyManager.ts        # Gold & Roarer Points management
      UpgradeManager.ts        # Shop upgrade application
      SaveManager.ts           # localStorage read/write
    config/
      waves.ts                 # Wave definitions (enemy types, counts, timing)
      towers.ts                # Tower stat tables
      enemies.ts               # Enemy stat tables
      upgrades.ts              # Shop upgrade definitions & costs
      constants.ts             # Grid size, starting values, etc.
      endless.ts               # Endless mode scaling formulas & wave patterns
    ui/
      HUD.ts                   # In-game HUD (lives, gold, wave counter)
      TowerPanel.ts            # Tower selection UI with tooltips
      TowerInfoPanel.ts        # Selected tower info (upgrade/sell)
      WavePreview.ts           # Wave preview display
      PauseOverlay.ts          # Pause screen overlay
      RangeIndicator.ts        # Tower range circle preview
  public/
    assets/                    # Placeholder assets (if any sprite sheets later)
```

---

## Key Technical Challenges

1. **Path validation on tower placement**: Must run BFS/A* before confirming placement to ensure no full blockage. Needs to be fast (<16ms) to feel instant.
2. **Pathfinding recalculation**: When towers change during build phase, all paths need recalculation. Cache paths and only recalculate when grid changes.
3. **Projectile tracking**: Splash projectiles travel to a position (where the target was), sniper projectiles track their target. Handle cases where target dies mid-flight.
4. **Smooth enemy movement**: Enemies follow grid paths but move smoothly with interpolation between cell centers.
5. **Shop upgrade stacking**: All percentage-based upgrades must apply correctly and stack multiplicatively or additively (defined per upgrade).
6. **Endless mode scaling**: Formulas must produce challenging but fair difficulty curves. HP grows faster than gold rewards to ensure eventual player loss.
7. **Pause state consistency**: All timers, tweens, physics, and spawn schedules must respect pause. Phaser's `scene.pause()` handles most of this but custom timers need explicit handling.
8. **Tower placement UX**: Range indicator, cancel modes (right-click / ESC / icon re-click), and path validation feedback must all feel responsive and clear.

---

## Out of Scope (For Now)

- Sound effects / music
- Multiple maps
- More than 2 tower types
- Online leaderboards
- Multiplayer
- Mobile / touch support
- Achievements system
- Difficulty settings
- Speed controls (1x/2x/3x)
