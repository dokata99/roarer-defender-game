# Splash Bear Art — Implementation Plan

> **For agentic workers:** Execute task-by-task. **Do not auto-commit** — per user preference, staging/committing is user-driven. Skip any "commit" step unless the user explicitly asks.

**Goal:** Replace the splash tower's placeholder rectangle with `public/assets/towers/Splash_Bear_Nemetschek.png` and its projectile's placeholder circle with `public/assets/projectiles/Splash_Bear_Projectile.png`. Scope is **splash tower only** — sniper and frost keep their current procedural shapes (they'll be addressed in a later art pass).

**Assets on disk:**
- `public/assets/towers/Splash_Bear_Nemetschek.png` — ~512×512 cyan bear with orange "N" medallion
- `public/assets/projectiles/Splash_Bear_Projectile.png` — ~600×600 orange "N" orb with cyan glow/motion-blur trail

**Design intent:** the bear is the hero piece; the projectile clearly reads as the same orb shot by the bear. Both sprites already have built-in glow, so we want to **let the art speak** — strip back procedural trail/glow effects that would compete with it.

---

## File map

| File | Action |
|---|---|
| `src/config/towers.ts` | **Modify** — add optional `art: { bodyKey, projectileKey }` to `TowerTypeConfig`, populate for `splash` |
| `src/scenes/GameScene.ts` | **Modify** — preload the two PNGs in `preload()` |
| `src/entities/Tower.ts` | **Modify** — if `config.art?.bodyKey` is set, render as `Image` sized to fit the cell; otherwise keep the rectangle path. Keep level text legible on top. |
| `src/entities/Projectile.ts` | **Modify** — `SplashProjectile` uses `Image` when a projectile art key is set; rotate to face travel direction; suppress the per-frame `emitTrail` dots (the sprite has its own trail) |

No new files. No config rename (stays `'splash'`).

---

## Task 1 — Config: attach art keys to splash tower

**File:** `src/config/towers.ts`

- [ ] Add texture-key constants at the top of the file:
  ```typescript
  export const TOWER_ART_KEYS = {
    splashBody: 'tower-splash-bear',
    splashProjectile: 'proj-splash-bear',
  } as const;
  ```
- [ ] Extend `TowerTypeConfig`:
  ```typescript
  export interface TowerArt {
    bodyKey: string;        // loaded image texture key
    projectileKey?: string; // optional — falls back to circle if absent
  }

  export interface TowerTypeConfig {
    displayName: string;
    color: number;
    projectileColor: number;
    art?: TowerArt;          // NEW
    levels: TowerLevelStats[];
  }
  ```
- [ ] Populate `art` on the `splash` entry only:
  ```typescript
  splash: {
    displayName: 'Splash',
    color: 0x3f6bff,
    projectileColor: 0xffdd55,
    art: {
      bodyKey: TOWER_ART_KEYS.splashBody,
      projectileKey: TOWER_ART_KEYS.splashProjectile,
    },
    levels: [ /* unchanged */ ],
  },
  ```
- [ ] Leave `sniper` and `frost` untouched (no `art` — they render as today).

**Why config-driven:** keeps Tower.ts and Projectile.ts free of per-type string literals, and future tower art drops in the same way.

---

## Task 2 — Preload the images

**File:** `src/scenes/GameScene.ts`

- [ ] In `preload()` (around line 105), add two lines alongside the existing path-tile loads:
  ```typescript
  this.load.image(TOWER_ART_KEYS.splashBody, 'assets/towers/Splash_Bear_Nemetschek.png');
  this.load.image(TOWER_ART_KEYS.splashProjectile, 'assets/projectiles/Splash_Bear_Projectile.png');
  ```
- [ ] Import `TOWER_ART_KEYS` from `../config/towers`.
- [ ] **404 behaviour:** Phaser logs a console 404 but does not throw. Tower.ts and Projectile.ts must fall back to the current primitive shape when `scene.textures.exists(key)` is false, so the game keeps running.

---

## Task 3 — Tower.ts: render splash as image

**File:** `src/entities/Tower.ts`

Current state: `this.rect = scene.add.rectangle(0, 0, size, size, color)` + `levelText` on top, both added to a container (lines 39–50).

- [ ] Swap the concrete field for a union:
  ```typescript
  private body: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  ```
- [ ] In the constructor, pick the render path based on config + texture availability:
  ```typescript
  const config = TOWER_CONFIGS[type];
  const size = CELL_SIZE - 12;
  const artKey = config.art?.bodyKey;

  if (artKey && scene.textures.exists(artKey)) {
    const img = scene.add.image(0, 0, artKey).setDisplaySize(size, size);
    this.body = img;
  } else {
    const rect = scene.add.rectangle(0, 0, size, size, config.color);
    rect.setStrokeStyle(2, 0x000000, 0.6);
    this.body = rect;
  }
  ```
- [ ] Replace every `this.rect` reference with `this.body`:
  - `playFireTelegraph()` — `scene.tweens.killTweensOf(this.body)`, scale bump still works on Image.
  - Container children list: `scene.add.container(centerX, centerY, [this.body, this.levelText])`.
- [ ] **Level text legibility.** The bear's belly medallion sits near the center, so the white `1`/`2`/`3` currently overlaps the orange "N". Two cheap options — pick one in implementation and verify in-browser:
  - (A) Offset the level text to bottom-right: `.setPosition(size * 0.32, size * 0.32)` and add a 1px dark stroke (`setStroke('#000000', 3)`) for contrast.
  - (B) Draw a small dark pill behind the level text (`scene.add.circle(…, 10, 0x000000, 0.6)`) at bottom-right, with the text centered on it.
  - Leave sniper/frost level text in its current center position (their shapes don't conflict).
- [ ] **Upgrade tiering.** Keep gameplay-visible cues without fighting the art:
  - Level 1: plain image.
  - Level 2: `this.container.postFX.addGlow(config.color, 3, 0, false)`.
  - Level 3: stronger glow (`addGlow(config.color, 6)`) + a slow idle pulse tween on `this.body.scale` between 0.97 ↔ 1.03 over 1.5s. Store the tween handle and kill it in `destroy()`.
  - Requires WebGL renderer — if `scene.renderer.type !== Phaser.WEBGL`, skip `addGlow` calls silently (see `02-02` Key Technical Constraint #1).
- [ ] `destroy()` still destroys the container, which takes the image and level text with it; nothing else to clean up besides the pulse tween from Level 3.

---

## Task 4 — Projectile.ts: SplashProjectile as image

**File:** `src/entities/Projectile.ts`

Current state: base `Projectile` holds `this.circle: Phaser.GameObjects.Arc` and an `emitTrail()` helper that drops fading dots (lines 27–64). `SplashProjectile` calls `emitTrail(deltaSec, 4)` each frame and draws an expanding ring on impact (`spawnExplosion`).

- [ ] Generalize the body field on the base class so a sprite works without restructuring every subclass:
  ```typescript
  protected body: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
  ```
  The base `Projectile` constructor still creates the `Arc` by default (so sniper/frost behavior is unchanged). Rename references to `this.circle` → `this.body` throughout the base class and subclasses. `destroy()` calls `this.body.destroy()`.

- [ ] In `SplashProjectile`, after `super(...)`, swap the body to an image **when the texture exists** and a key is provided:
  ```typescript
  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    damage: number,
    targetX: number, targetY: number,
    splashRadiusTiles: number,
    color: number,
    opts?: { slow?: ProjectileSlowPayload; canHitFlying?: boolean; textureKey?: string },
  ) {
    super(scene, color, 6, x, y, damage);
    // ...
    const key = opts?.textureKey;
    if (key && scene.textures.exists(key)) {
      this.body.destroy(); // drop the Arc created by super()
      const img = scene.add.image(x, y, key).setDisplaySize(18, 18).setDepth(PROJECTILE_DEPTH);
      this.body = img;
    }
  }
  ```
  Size `18` ≈ a tad larger than the current 6px-radius circle; tune in-browser. The sprite's own glow provides visual weight, so we don't need the circle underneath.

- [ ] **Rotation.** In `update()`, after advancing position, set image rotation to the travel angle so the built-in motion-blur streak points backward:
  ```typescript
  if (this.body instanceof Phaser.GameObjects.Image) {
    this.body.setRotation(Math.atan2(dy, dx));
  }
  ```

- [ ] **Suppress the procedural trail for the sprite path.** The PNG already has a glow/trail. Guard `emitTrail`:
  ```typescript
  // in SplashProjectile.update() — only when using the Arc fallback:
  if (this.body instanceof Phaser.GameObjects.Arc) {
    this.emitTrail(deltaSec, 4);
  }
  ```
  Alternatively, add a `protected useProceduralTrail = true` flag and flip it to `false` in the image branch. The guard inline is simpler and keeps all changes local to `SplashProjectile`.

- [ ] **Impact explosion.** Keep the existing expanding cyan ring in `spawnExplosion()` — it still reads as an AoE even with the new art, and sniper/frost don't call this method. No change needed.

- [ ] In `GameScene.fireTowers()` (around line 531), pass the projectile key through:
  ```typescript
  const artKey = TOWER_CONFIGS[tower.type].art?.projectileKey;
  this.projectiles.push(
    new SplashProjectile(
      this, center.x, center.y,
      stats.damage, target.x, target.y,
      splashRadius, color,
      { slow, canHitFlying: tower.type === 'frost', textureKey: artKey },
    ),
  );
  ```
  `artKey` is `undefined` for frost (no `art` in its config), so frost keeps its current cyan circle projectile automatically.

---

## Task 5 — QA checklist (manual, in browser)

Start the dev server, place a splash tower, start a wave, observe:

- [ ] Splash tower renders the bear, roughly filling the tile, centered.
- [ ] Level text `1`/`2`/`3` is readable against the bear at all three levels.
- [ ] Fire telegraph (scale bump) still fires on each shot.
- [ ] Level 2 tower has a subtle cyan glow; Level 3 has stronger glow + visible idle pulse.
- [ ] Projectile renders as the orange orb with cyan trail, oriented so the trail points back toward the tower.
- [ ] Impact still shows the expanding cyan ring.
- [ ] Sell/upgrade cycles the art cleanly with no dangling sprites.
- [ ] Sniper and frost towers/projectiles look **unchanged** (regression check).
- [ ] With WebGL disabled (force Canvas via `type: Phaser.CANVAS` temporarily): bear still renders, glow is skipped, no console errors.
- [ ] With the PNG files renamed on disk to simulate a 404: game still runs, falls back to rectangle + circle with only a console warning.

---

## Out of scope (explicit non-goals)

- Sniper and frost tower art — separate asset drops.
- Tower panel / shop button icons — the panel still uses color swatches; swapping those to the bear thumbnail is a follow-up.
- Range-indicator, placement-highlight, or HUD changes.
- Particle-system overhaul from `02-02-asset-implementation-plan.md` — that plan is the broader procedural-art vision and is **not** what this task implements. This task is a narrow image-asset swap for splash only.

---

## Open questions (flag to user before implementing if unsure)

1. **Display size tuning.** `size = CELL_SIZE - 12 = 67px` for the tower; `18px` for the projectile. These are starting guesses — confirm in-browser that the bear doesn't look cramped and the orb isn't too small against enemies.
2. **Level text option A vs B.** Offset + stroke is simpler; pill background is more readable. Default to A unless the user prefers B.
3. **Idle pulse at Level 3.** Nice-to-have; can be cut if it clashes with the fire telegraph or feels busy.
