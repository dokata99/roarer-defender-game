# Asset Implementation Plan -- Roarer Defense

Complete technical plan for creating all game assets programmatically using
Phaser 3's Canvas API, PostFX, and particle system. No external image files needed.

Companion to: `02-01-visual-design-reference.md` (design targets)

---

## Architecture Overview

### AssetFactory System

All textures are generated at runtime in a centralized `AssetFactory` class.
This runs once during scene boot and registers reusable texture keys.

```
src/
  assets/
    AssetFactory.ts          -- orchestrator, called from BootScene or GameScene.create()
    textures/
      TowerTextures.ts       -- generates tower sprites + animation frames
      EnemyTextures.ts       -- generates enemy sprites + animation frames
      ProjectileTextures.ts  -- generates projectile + impact sprites
      EnvironmentTextures.ts -- generates grid tiles, portal, server textures
      ParticleTextures.ts    -- generates soft-glow, spark, fragment particle textures
      UITextures.ts          -- generates icons (coin, heart, tower silhouettes)
```

### Core Utility: `createCanvasTexture`

Every texture generator uses this pattern:

```typescript
export function createCanvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): void {
  const tex = scene.textures.createCanvas(key, width, height);
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, width, height);
  draw(ctx, width, height);
  tex.refresh();
}
```

### Core Utility: `createSpritesheet`

For animated textures (tower rotation, enemy pulse, boss glow):

```typescript
export function createSpritesheet(
  scene: Phaser.Scene,
  key: string,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
  drawFrame: (ctx: CanvasRenderingContext2D, frame: number, x: number, y: number, w: number, h: number) => void
): void {
  const totalWidth = frameWidth * frameCount;
  const tex = scene.textures.createCanvas(key, totalWidth, frameHeight);
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, totalWidth, frameHeight);

  for (let i = 0; i < frameCount; i++) {
    ctx.save();
    const x = i * frameWidth;
    ctx.beginPath();
    ctx.rect(x, 0, frameWidth, frameHeight);
    ctx.clip();
    drawFrame(ctx, i, x, 0, frameWidth, frameHeight);
    ctx.restore();
  }

  tex.refresh();

  // Register frames for Phaser animation system
  const texture = scene.textures.get(key);
  for (let i = 0; i < frameCount; i++) {
    texture.add(i, 0, i * frameWidth, 0, frameWidth, frameHeight);
  }
}
```

### Core Utility: `registerAnim`

After generating a spritesheet, register a Phaser animation so sprites can `.play()` it:

```typescript
export function registerAnim(
  scene: Phaser.Scene,
  key: string,           // animation key, e.g. 'firewall-spin'
  textureKey: string,    // spritesheet texture key
  frameCount: number,
  frameRate: number,
  repeat: number = -1    // -1 = loop forever
): void {
  const frames: Phaser.Types.Animations.AnimationFrame[] = [];
  for (let i = 0; i < frameCount; i++) {
    frames.push({ key: textureKey, frame: i });
  }
  scene.anims.create({ key, frames, frameRate, repeat });
}

// Usage in AssetFactory after generating spritesheets:
// registerAnim(scene, 'firewall-spin', 'tower-firewall-core', 8, 10);      // 0.8s loop
// registerAnim(scene, 'killswitch-spin', 'tower-killswitch-core', 12, 8);  // 1.5s loop
// registerAnim(scene, 'zeroday-pulse', 'enemy-zeroday-body', 6, 10);       // 0.6s loop
```

---

## Phase 1: Particle Textures (Dependency -- needed by everything else)

Generate tiny reusable textures that particles, effects, and glow layers reference.

### Textures to Generate

| Key                | Size   | Description                                    |
|--------------------|--------|------------------------------------------------|
| `particle-dot`     | 4x4    | White filled square -- simplest particle        |
| `particle-circle`  | 8x8    | White filled circle, anti-aliased               |
| `particle-glow`    | 32x32  | Radial gradient: white center -> transparent    |
| `particle-spark`   | 16x8   | Elongated diamond -- for directional sparks     |
| `particle-fragment`| 6x6    | Small square with 1px bright edge -- data chunk |
| `particle-ring`    | 32x32  | Hollow circle with soft edges                   |

### Drawing Techniques

**Soft glow (most important -- used everywhere):**
```typescript
// particle-glow (32x32)
const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, 32, 32);
```

**Spark (directional):**
```typescript
// particle-spark (16x8)
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.moveTo(0, 4);     // left point
ctx.lineTo(6, 0);     // top
ctx.lineTo(16, 4);    // right point (elongated)
ctx.lineTo(6, 8);     // bottom
ctx.closePath();
ctx.fill();
```

These are white. Color is applied at runtime via Phaser's `tint` property on particles.

---

## Phase 2: Tower Textures

Each tower has 3 levels x multiple animation frames = multiple spritesheet textures.

### Firewall (Splash Tower)

**Texture keys:**
- `tower-firewall-1` through `tower-firewall-3` (static base per level)
- `tower-firewall-core` (8-frame spritesheet: rotating inner square)

**Size:** 64x64 pixels

**Drawing the base (per level):**

```
Level 1: Octagon outline (2px, #00E5FF), dark fill (#141726)
          Single ring at 85% radius
          Dim inner circle

Level 2: + second concentric ring at 75% radius
          Brighter inner glow (radial gradient more intense)
          Slightly brighter outline

Level 3: + third ring at 65% radius
          Brightest core (white center fading to cyan)
          Outline with canvas shadowBlur=6 for neon effect
```

**Layer stack (bottom to top):**
1. Ambient glow -- radial gradient, cyan at 15% opacity, extends to full 64x64
2. Octagon fill -- `#141726` with subtle gradient (darker at edges)
3. Octagon stroke -- 2px `#00E5FF`, with `shadowBlur` for neon glow
4. Level rings -- 1px strokes, `#00E5FF` at 30-60% opacity
5. Core -- radial gradient, white center -> cyan edge

**Core animation (8 frames, 10fps = 0.8s per rotation):**
Each frame draws a small rotated square (8x8) at the center, rotated by `frame * 45deg`.

**Phaser integration:**
```typescript
// In Tower.ts, replace rectangle creation:
const base = scene.add.image(0, 0, `tower-firewall-${level}`);
const core = scene.add.sprite(0, 0, 'tower-firewall-core');
core.play('firewall-spin');
this.add(base);
this.add(core);

// Level 3: add postFX glow to the container
if (level === 3) {
  this.postFX.addGlow(0x00E5FF, 4, 0, false);
}
```

### Killswitch (Sniper Tower)

**Texture keys:**
- `tower-killswitch-1` through `tower-killswitch-3`
- `tower-killswitch-core` (12-frame spritesheet: rotating crosshair, slower)

**Size:** 64x64 pixels

**Layer stack:**
1. Ambient glow -- radial gradient, holo blue at 10% opacity
2. Diamond fill -- `#141726` via Path2D diamond
3. Diamond stroke -- 1.5px `#3A86FF`, with `shadowBlur=5`
4. Level dots -- small circles at diamond corners (1-3 per corner per level)
5. Crosshair -- two thin lines (+ shape), `#3A86FF` at 50% opacity, rotated per frame
6. Targeting reticle -- small circle stroke at center
7. Core dot -- radial gradient, white center -> blue edge

**Core animation (12 frames, 8fps = 1.5s per rotation):**
The crosshair (+ shape) rotates slowly. At attack time, a separate tween snaps rotation.

---

## Phase 3: Enemy Textures

Enemies are smaller and need distinct silhouettes.

### Worm (Fast Enemy)

**Texture keys:**
- `enemy-worm` (single static frame, 24x24)
- `enemy-worm-segment` (single frame, 16x16 -- trail body piece)

**Size:** 24x24 (head), 16x16 (segments)

**Head drawing:**
```
1. Circle fill with radial gradient: bright #B7FF00 center -> darker #6B8F00 edge
2. 1px stroke #CCFF44
3. Two small dark dots (2px) as "eyes" -- offset toward top
4. Canvas shadowBlur=3, shadowColor=#B7FF00 for subtle glow
```

**Segment drawing (3 segments follow the head):**
```
Segment 1: circle radius 5, same color, 80% opacity
Segment 2: circle radius 4, 60% opacity
Segment 3: circle radius 3, 40% opacity
```

**Movement in code (not texture):**
- Store last 3 positions of the head (sampled every 60ms)
- Each segment lerps toward its target position
- Add sinusoidal offset perpendicular to movement direction (amplitude 2px, period 300ms)

### Trojan (Elite Enemy)

**Texture keys:**
- `enemy-trojan` (single frame, 32x32)
- `enemy-trojan-shield` (single frame, 40x40 -- outer faint hexagon, rotates separately)

**Size:** 32x32 (body), 40x40 (shield overlay)

**Body drawing:**
```
1. Hexagon fill: radial gradient #FF6B35 center -> #884400 edge
2. Hexagon stroke: 2px #FFAA55, shadowBlur=4 shadowColor=#FF6B35
3. Inner triangle (download arrow): small filled triangle pointing down, #FFDD88
4. Small square at bottom of arrow: 3x3px, same color
```

**Shield drawing:**
```
1. Hexagon stroke only, 1px, #FF6B35 at 20% opacity
2. Slightly larger than body (radius * 1.2)
3. Rotates independently in code (tween, 8s per revolution)
```

### Zero-Day (Boss Enemy)

**Texture keys:**
- `enemy-zeroday-body` (6-frame spritesheet, 48x48 -- pulsing glow aura)
- `enemy-zeroday-core` (single frame, 36x36)

**Size:** 48x48 (with glow), 36x36 (inner body)

**Core drawing:**
```
1. Irregular polygon (7-sided, slightly random radii):
   For each vertex: radius = baseRadius + sin(i * 2.7) * 3
   This creates a consistently "jagged" shape from a seed
2. Fill: radial gradient #FF2E63 center -> #660022 edge
3. Stroke: 2.5px #FF3CF2, shadowBlur=6 shadowColor=#FF0000
4. Inner detail: "0" character drawn with ctx.fillText, white, centered
   OR: two small ellipses (eye slits) for menacing look
5. Four spike protrusions at cardinal directions (small triangles)
```

**Pulsing aura animation (6 frames):**
Each frame varies the outer glow radius and opacity:
```
Frame 0: glow radius 20, opacity 0.15
Frame 1: glow radius 22, opacity 0.20
Frame 2: glow radius 24, opacity 0.30  (peak)
Frame 3: glow radius 24, opacity 0.30
Frame 4: glow radius 22, opacity 0.20
Frame 5: glow radius 20, opacity 0.15
```

Drawn as a radial gradient from `#FF3CF2` -> transparent at each frame's radius.

---

## Phase 4: Projectile & Impact Textures

### Firewall Projectile (Splash)

**Key:** `proj-firewall` (16x16)

```
1. Outer glow: radial gradient, #FFFF00 at 0.4 -> transparent, radius 8
2. Core: filled circle radius 3, white
3. Mid ring: filled circle radius 5, #00E5FF at 0.6
```

### Killswitch Projectile (Sniper)

**Key:** `proj-killswitch` (20x8)

Elongated shape suggesting speed:
```
1. Diamond shape: Path2D, 20px wide, 6px tall
2. Fill: white
3. Trail: linear gradient from left edge, #3A86FF -> transparent
4. shadowBlur=3, shadowColor=#3A86FF
```

This texture is rotated in code to face the target direction.

### Splash Impact

**Key:** `fx-splash-ring` (64x64)

```
1. Circle stroke only, 2px, white
2. shadowBlur=4, shadowColor=#00E5FF
3. Drawn at radius 28 (centered in 64x64)
```

Used as a sprite that scales up from 0.2 to 1.0 and fades out over 300ms.

### Sniper Hit Flash

**Key:** `fx-sniper-hit` (16x16)

```
1. Star/cross shape: two overlapping rectangles at 45deg, white
2. shadowBlur=6, shadowColor=#3A86FF
3. Small radial glow underneath
```

Appears at impact point, scales down from 1.5 to 0 over 150ms.

---

## Phase 5: Environment Textures

### Grid Tile

**Key:** `tile-grid` (generated per-cell at runtime, NOT as a reusable texture)

The grid is better drawn directly with Graphics objects because:
- Each cell can have unique circuit trace variation
- Hover/selection highlights need per-cell control
- Drawing 91 cells with Graphics is not expensive

**Enhancement approach:**
Keep the current `drawGrid()` approach but add layers:

```typescript
// After base cell drawing, add circuit details:
function drawCircuitOverlay(gfx: Phaser.GameObjects.Graphics, gridManager: GridManager) {
  gfx.lineStyle(0.5, 0x2A2F4A, 0.4);

  for (let row = 0; row <= GRID_ROWS; row++) {
    for (let col = 0; col <= GRID_COLS; col++) {
      const x = gridManager.offsetX + col * gridManager.cellSize;
      const y = gridManager.offsetY + row * gridManager.cellSize;
      const seed = row * 17 + col * 31;  // deterministic pseudo-random

      // Node dot at some intersections
      if (seed % 3 === 0) {
        gfx.fillStyle(0x2A2F4A, 0.5);
        gfx.fillCircle(x, y, 1.5);
      }

      // Horizontal trace segment
      if (seed % 5 === 0 && col < GRID_COLS) {
        gfx.lineBetween(x, y, x + gridManager.cellSize, y);
      }

      // Vertical trace segment
      if (seed % 7 === 0 && row < GRID_ROWS) {
        gfx.lineBetween(x, y, x, y + gridManager.cellSize);
      }
    }
  }
}
```

### Portal Texture

**Key:** `env-portal` (64x192 -- tall, covers 3 cells)

```
1. Background: rounded rect, #1A0A30 fill
2. Border: 2px stroke, radial gradient #6A00FF -> #FF3CF2
3. Inner glow: radial gradient from center, #6A00FF at 0.3 -> transparent
4. "WWW" text: drawn with ctx.fillText, #00E5FF, bold monospace, centered
5. Horizontal scan line: 1px bright line at varying Y (animated in code, not texture)
```

The portal is drawn once as a static texture. Animation (glow pulse, scan line, particles)
is handled in code with tweens and the particle system.

### Server Texture

**Key:** `env-server` (64x192)

```
1. Background: rect, #141726 fill
2. Border: 2px stroke, #00E5FF
3. Horizontal bay dividers: 3 lines at 25%, 50%, 75% height, 1px #2A2F4A
4. Status LEDs: 4 small circles (3px) on the left of each bay
   - Drawn as white; tinted in code based on health
5. "SERVER" text: ctx.fillText, #00E5FF, bold monospace, centered
6. Subtle gradient overlay: linear, top-to-bottom, slight lightening at top
```

LED blinking is handled in code (tween the alpha of small overlay sprites or Graphics).

---

## Phase 6: UI Icon Textures

Small icons used in the HUD and tower panel.

### Gold Coin Icon

**Key:** `icon-gold` (16x16)

```
1. Circle fill: radial gradient #F7FF4A center -> #AA9900 edge
2. Circle stroke: 1px #FFFF88
3. Inner highlight: small arc at top-left, white at 0.4 opacity (specular)
```

### Heart / Shield Icon (Lives)

**Key:** `icon-lives` (16x16)

```
1. Shield shape via Path2D:
   M8,2 C3,2 1,5 1,8 C1,12 4,15 8,16 C12,15 15,12 15,8 C15,5 13,2 8,2 Z
2. Fill: gradient #00FF6A -> #008835
3. Stroke: 1px #44FF88
```

### Tower Silhouette Icons (for panel buttons)

**Keys:** `icon-firewall` (24x24), `icon-killswitch` (24x24)

Simplified mini versions of the tower shapes:
- Firewall: small octagon, filled cyan
- Killswitch: small diamond, filled holo blue

---

## Phase 7: Camera & Scene-Level Effects

These don't require textures -- applied directly in code.

### Bloom + Vignette (GameScene)

```typescript
// In GameScene.create(), at the end:
const cam = this.cameras.main;
cam.postFX.addBloom(0xffffff, 1, 1, 1, 0.8, 4);
cam.postFX.addVignette(0.5, 0.5, 0.9, 0.3);
```

### Danger Vignette (when lives < 30%)

```typescript
// Store reference to toggle:
this.dangerVignette = cam.postFX.addVignette(0.5, 0.5, 0.6, 0.5);
this.dangerVignette.setActive(false);  // enable when lives drop

// Color the danger vignette red using a color matrix:
this.dangerColorFX = cam.postFX.addColorMatrix();
this.dangerColorFX.setActive(false);
// When activating:
this.dangerColorFX.brightness(0.9);
this.dangerColorFX.saturate(-0.2);  // slight desaturation
```

### Screen Shake Utility

```typescript
function screenShake(scene: Phaser.Scene, intensity: number = 0.005, duration: number = 200) {
  scene.cameras.main.shake(duration, intensity);
}
```

### Flash Utility

```typescript
// Note: Phaser's camera.flash() does not accept an alpha parameter.
// For a softer flash, use a shorter duration or overlay a semi-transparent rectangle.
function screenFlash(scene: Phaser.Scene, color: number = 0xffffff, duration: number = 100) {
  scene.cameras.main.flash(duration, 
    (color >> 16) & 0xff,
    (color >> 8) & 0xff,
    color & 0xff
  );
}

// For alpha-controlled flashes (e.g. 30% opacity white), use an overlay instead:
function screenFlashWithAlpha(scene: Phaser.Scene, color: number = 0xffffff, duration: number = 100, alpha: number = 0.3) {
  const overlay = scene.add.rectangle(
    scene.cameras.main.centerX, scene.cameras.main.centerY,
    scene.cameras.main.width, scene.cameras.main.height,
    color, alpha
  ).setDepth(999).setScrollFactor(0);
  scene.tweens.add({
    targets: overlay,
    alpha: 0,
    duration,
    onComplete: () => overlay.destroy(),
  });
}
```

---

## Phase 8: Particle System Setup

### Particle Emitter Configs

All configs reference the particle textures from Phase 1.

**Tower fire (Firewall):**
```typescript
const firewallFireConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  speed: { min: 30, max: 80 },
  scale: { start: 0.8, end: 0 },
  alpha: { start: 0.8, end: 0 },
  tint: 0x00E5FF,
  lifespan: 200,
  quantity: 3,
  frequency: -1,  // explode mode (call emitter.explode() on each shot)
  blendMode: 'ADD',
};
```

**Tower fire (Killswitch):**
```typescript
const killswitchFireConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  speed: { min: 10, max: 30 },
  scale: { start: 1.2, end: 0 },
  alpha: { start: 1, end: 0 },
  tint: 0xffffff,
  lifespan: 80,
  quantity: 1,
  frequency: -1,
  blendMode: 'ADD',
};
```

**Splash explosion:**
```typescript
const splashExplosionConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  speed: { min: 40, max: 120 },
  scale: { start: 0.6, end: 0 },
  alpha: { start: 0.8, end: 0 },
  tint: [0x00E5FF, 0xffffff],
  lifespan: 300,
  quantity: 8,
  frequency: -1,
  angle: { min: 0, max: 360 },
  blendMode: 'ADD',
};
```

**Enemy death (Worm):**
```typescript
const wormDeathConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  speed: { min: 50, max: 150 },
  scale: { start: 0.5, end: 0 },
  alpha: { start: 1, end: 0 },
  tint: 0xB7FF00,
  lifespan: 300,
  quantity: 5,
  frequency: -1,
  blendMode: 'ADD',
};
```

**Enemy death (Trojan):**
```typescript
const trojanDeathConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  speed: { min: 30, max: 100 },
  scale: { start: 0.8, end: 0 },
  alpha: { start: 1, end: 0 },
  tint: 0xFF6B35,
  lifespan: 400,
  quantity: 8,
  frequency: -1,
  blendMode: 'ADD',
};
```

**Enemy death (Zero-Day Boss):**
```typescript
const bossDeathConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  speed: { min: 60, max: 200 },
  scale: { start: 1.0, end: 0 },
  alpha: { start: 1, end: 0 },
  tint: [0xFF2E63, 0xFF3CF2, 0xffffff],
  lifespan: 600,
  quantity: 14,
  frequency: -1,
  blendMode: 'ADD',
};
```

**Hit spark (on any enemy hit):**
```typescript
const hitSparkConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  speed: { min: 20, max: 60 },
  scale: { start: 0.4, end: 0 },
  alpha: { start: 1, end: 0 },
  tint: 0xffffff,
  lifespan: 100,
  quantity: 2,
  frequency: -1,
  blendMode: 'ADD',
};
```

**Gold pickup sparkle:**
```typescript
const goldSparkleConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  speed: { min: 10, max: 40 },
  angle: { min: -120, max: -60 },  // upward
  scale: { start: 0.6, end: 0 },
  alpha: { start: 1, end: 0 },
  tint: 0xF7FF4A,
  lifespan: 400,
  quantity: 3,
  frequency: -1,
};
```

### Particle Manager

Create particle emitters once and reuse them:

```typescript
export class ParticleManager {
  private scene: Phaser.Scene;
  private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.emitters = new Map();
    this.createEmitters();
  }

  private createEmitters() {
    // One emitter per effect type, all using explode() mode
    this.emitters.set('firewall-fire',
      this.scene.add.particles(0, 0, 'particle-circle', firewallFireConfig).setDepth(60));
    this.emitters.set('killswitch-fire',
      this.scene.add.particles(0, 0, 'particle-glow', killswitchFireConfig).setDepth(60));
    this.emitters.set('splash-explode',
      this.scene.add.particles(0, 0, 'particle-fragment', splashExplosionConfig).setDepth(60));
    this.emitters.set('worm-death',
      this.scene.add.particles(0, 0, 'particle-circle', wormDeathConfig).setDepth(60));
    this.emitters.set('trojan-death',
      this.scene.add.particles(0, 0, 'particle-fragment', trojanDeathConfig).setDepth(60));
    this.emitters.set('boss-death',
      this.scene.add.particles(0, 0, 'particle-glow', bossDeathConfig).setDepth(60));
    this.emitters.set('hit-spark',
      this.scene.add.particles(0, 0, 'particle-spark', hitSparkConfig).setDepth(60));
    this.emitters.set('gold-sparkle',
      this.scene.add.particles(0, 0, 'particle-circle', goldSparkleConfig).setDepth(60));
  }

  emit(key: string, x: number, y: number, count?: number) {
    const emitter = this.emitters.get(key);
    if (emitter) {
      emitter.emitParticleAt(x, y, count);
    }
  }
}
```

---

## Integration Plan: How Entities Change

### Config Rename (Prerequisite)

The current codebase uses `'splash'`/`'sniper'` as tower type keys and `'fast'`/`'elite'`/`'boss'`
as enemy type keys. The visual overhaul renames these to thematic names. This must be done
**before** wiring up textures, since texture keys are derived from type names.

**towers.ts changes:**
- Add `id: string` field to `TowerConfig` interface
- `splash` entry: add `id: 'firewall'`, rename `name` to `'Firewall'`
- `sniper` entry: add `id: 'killswitch'`, rename `name` to `'Killswitch'`
- The record keys (`splash`, `sniper`) and `type` field stay unchanged for gameplay logic
- Texture keys use `config.id` (e.g. `tower-firewall-1`), NOT `config.type`

**enemies.ts changes:**
- Add `id: string` field to `EnemyConfig` interface
- `fast` entry: add `id: 'worm'`
- `elite` entry: add `id: 'trojan'`
- `boss` entry: add `id: 'zeroday'`
- Texture keys use `config.id` (e.g. `enemy-worm`), NOT `enemyType`

This keeps all existing gameplay code working (it uses `type`/`enemyType`) while giving
the visual layer clean thematic names.

### Tower.ts Changes

**Before (current):**
```typescript
// Rectangle body + text level
const body = scene.add.rectangle(0, 0, size, size, config.color);
const levelText = scene.add.text(0, 0, `${level}`, ...);
this.add(body);
this.add(levelText);
```

**After:**
```typescript
// Sprite from generated texture + animated core sprite
// config.id is the thematic name ('firewall' or 'killswitch')
const base = scene.add.image(0, 0, `tower-${config.id}-${level}`);
const core = scene.add.sprite(0, 0, `tower-${config.id}-core`);
core.play(`${config.id}-spin`);
this.add(base);
this.add(core);

if (level === 3) {
  this.postFX.addGlow(config.color, 4, 0, false);
}
```

**On upgrade:** Destroy old base image, create new one with next level texture key.

### Enemy.ts Changes

**Before (current):**
```typescript
const body = scene.add.arc(0, 0, config.radius, 0, 360, false, config.color);
```

**After (Worm example):**
```typescript
const head = scene.add.image(0, 0, 'enemy-worm');
this.add(head);

// Trailing segments (managed in update loop)
// Segments are world-space objects (NOT in the container) so they can trail behind
this.segments = [];
for (let i = 0; i < 3; i++) {
  const seg = scene.add.image(0, 0, 'enemy-worm-segment');
  seg.setAlpha(0.8 - i * 0.2);
  seg.setScale(1 - i * 0.15);
  this.segments.push(seg);
}

// IMPORTANT: Override destroy() to clean up segments, since they are not
// children of the container and won't be auto-destroyed:
const origDestroy = this.destroy.bind(this);
this.destroy = (fromScene?: boolean) => {
  this.segments.forEach(seg => seg.destroy());
  this.segments = [];
  origDestroy(fromScene);
};
```

**After (Trojan):**
```typescript
const body = scene.add.image(0, 0, 'enemy-trojan');
const shield = scene.add.image(0, 0, 'enemy-trojan-shield');
shield.setAlpha(0.2);
this.add(body);
this.add(shield);

// Rotate shield independently
scene.tweens.add({
  targets: shield,
  angle: 360,
  duration: 8000,
  repeat: -1,
});
```

**After (Zero-Day Boss):**
```typescript
const body = scene.add.sprite(0, 0, 'enemy-zeroday-body');
body.play('zeroday-pulse');
this.add(body);

this.postFX.addGlow(0xFF3CF2, 6, 0, false);

// Screen shake on spawn
scene.cameras.main.shake(300, 0.003);
```

### Projectile.ts Changes

**Important:** Projectile currently extends `Phaser.GameObjects.Arc`, not `Container`.
To use sprite-based projectiles, refactor Projectile to extend `Phaser.GameObjects.Container`
(matching the Tower/Enemy pattern), then add the image as a child.

**Before:**
```typescript
// Projectile extends Phaser.GameObjects.Arc
const body = scene.add.arc(0, 0, radius, 0, 360, false, color);
```

**After:**
```typescript
// Projectile must be refactored to extend Phaser.GameObjects.Container
// Move position tracking, velocity, and collision logic from Arc properties
// to container-level x/y with manual movement in update()
const body = scene.add.image(0, 0, `proj-${towerType}`);
// Rotate sniper projectile to face target
if (towerType === 'killswitch') {
  body.setRotation(Phaser.Math.Angle.Between(startX, startY, targetX, targetY));
}
this.add(body);
```

**Migration notes:**
- Arc's built-in `radius` was used for collision checks -- replace with a `hitRadius` property
- Arc's fill/stroke color was set directly -- no longer needed with sprites
- Ensure `setActive(false).setVisible(false)` still works on the Container for pooling

### GameScene.ts Changes

**In create():**
```typescript
// Generate all textures first
AssetFactory.generateAll(this);

// After all setup, add camera effects
const cam = this.cameras.main;
cam.postFX.addBloom(0xffffff, 1, 1, 1, 0.8, 4);
cam.postFX.addVignette(0.5, 0.5, 0.9, 0.3);

// Create particle manager
this.particles = new ParticleManager(this);
```

**In drawGrid():**
```typescript
// After existing cell drawing, add circuit overlay
drawCircuitOverlay(this.gridGraphics, this.gridManager);
```

---

## Implementation Order (Work Phases)

### Step 1: Config & Renderer Prerequisites
1. Change `main.ts` game config from `Phaser.AUTO` to `Phaser.WEBGL` (required for postFX)
2. Add `id: string` field to `TowerConfig` in `towers.ts` (`'firewall'`, `'killswitch'`)
3. Add `id: string` field to `EnemyConfig` in `enemies.ts` (`'worm'`, `'trojan'`, `'zeroday'`)
4. Update color constants to new palette (towers.ts, enemies.ts, main.ts background)
5. Update tower/enemy `name` fields to thematic names (`'Firewall'`, `'Killswitch'`, etc.)

### Step 2: Foundation
1. Create `src/assets/AssetFactory.ts` with utility functions (`createCanvasTexture`, `createSpritesheet`, `registerAnim`)
2. Create `src/assets/textures/ParticleTextures.ts` -- generate the 6 particle textures
3. Test: verify textures appear in `scene.textures.list`

### Step 3: Camera Effects (biggest visual impact, smallest code change)
1. Add bloom + vignette to GameScene camera
2. Add screen shake utility
3. Add screen flash utility (use overlay approach for alpha-controlled flashes)

### Step 4: Tower Textures + Integration
1. Create `TowerTextures.ts` -- Firewall base (3 levels) + core spritesheet
2. Create `TowerTextures.ts` -- Killswitch base (3 levels) + core spritesheet
3. Register animations via `registerAnim()` in AssetFactory
4. Refactor `Tower.ts` to use sprites instead of rectangles (reference `config.id` for texture keys)
5. Test: towers render with new art, animations play

### Step 5: Enemy Textures + Integration
1. Create `EnemyTextures.ts` -- Worm head + segments
2. Create `EnemyTextures.ts` -- Trojan body + shield
3. Create `EnemyTextures.ts` -- Zero-Day body spritesheet + core
4. Register animations via `registerAnim()` for Zero-Day pulse
5. Refactor `Enemy.ts` to use sprites, add trail/shield/pulse logic
6. Add segment cleanup in Worm `destroy()` override
7. Test: enemies render with distinct shapes and animations

### Step 6: Projectile + Impact Textures
1. Create `ProjectileTextures.ts` -- both projectile types
2. Create impact/hit effect textures
3. Refactor `Projectile.ts`: change base class from `Arc` to `Container` (see migration notes)
4. Update collision detection to use `hitRadius` property instead of Arc radius
5. Add impact effects on hit
6. Test: projectiles and impacts look correct

### Step 7: Particle System
1. Create `ParticleManager.ts`
2. Wire up tower fire particles
3. Wire up enemy death particles
4. Wire up hit sparks and gold sparkles
5. Wire up splash explosion particles
6. Test: all particle effects trigger correctly

### Step 8: Environment Polish
1. Add circuit trace overlay to grid drawing (deterministic seed, no Math.random)
2. Create portal texture or enhanced drawing
3. Create server texture or enhanced drawing
4. Add ambient data-flow particles (optional)
5. Test: environment looks cohesive

### Step 9: UI Polish
1. Create icon textures (gold, lives, tower silhouettes)
2. Update HUD with icons and enhanced styling
3. Update tower panel buttons with silhouettes
4. Update tooltip styling
5. Rename "START WAVE" to "DEPLOY"
6. Test: UI reads clearly and fits theme

### Step 10: Advanced Effects (optional, last)
1. Danger vignette when lives < 30%
2. Boss spawn screen effects
3. Boss death screen effects (chromatic aberration flash)
4. Grid cell flash on nearby impacts
5. Victory/defeat screen effects

---

## Performance Budget

| Category              | Budget                          | Notes                          |
|-----------------------|---------------------------------|--------------------------------|
| Texture memory        | ~500KB total                    | Includes spritesheets (48-64px, multi-frame, RGBA) |
| Camera postFX         | 2 effects (bloom + vignette)    | Negligible on modern GPUs      |
| Per-object postFX     | Max 3-4 (Lv3 towers + boss)    | Avoid on many objects           |
| Active particles      | Max 50 at any time              | Monitor during wave phases      |
| Spritesheet frames    | Max 12 per entity type          | Low memory overhead             |
| Draw calls            | Each unique texture = 1 batch   | ~15-20 texture keys total       |

### Fallback for Low-End Devices

If performance is an issue:
1. Disable camera bloom (biggest GPU cost)
2. Reduce particle quantities by 50%
3. Disable per-object glow
4. Skip animated spritesheets, use static frames only

Can detect via: if FPS drops below 45 for 3+ seconds, auto-disable effects tier by tier.

---

## Key Technical Constraints

1. **WebGL is required** -- `postFX` (bloom, vignette, glow) only works with the
   WebGL renderer. The game config (`main.ts`) currently uses `Phaser.AUTO` which
   may fall back to Canvas. Change to `type: Phaser.WEBGL` to guarantee postFX
   support, or gracefully skip postFX calls when `renderer.type !== Phaser.WEBGL`.

2. **`postFX` on Graphics objects works** but only `postFX`, never `preFX`

3. **`postFX` on Containers works** -- this is how tower/enemy glow will work
   since entities are Containers

4. **Particles require a texture key** -- cannot be purely procedural. Generate
   white particle textures and tint at runtime

5. **Each `textures.createCanvas()` call = one WebGL texture upload** -- batch
   all generation in a single init pass, not on-demand

6. **`canvasTexture.refresh()` is mandatory** after drawing -- without it,
   the WebGL texture won't update

7. **`Path2D` accepts SVG path data** -- complex shapes can be defined as
   compact strings: `new Path2D('M10,0 L20,10 L10,20 L0,10 Z')`

8. **`fillGradientStyle` on Graphics does NOT survive `generateTexture()`** --
   this plan uses `textures.createCanvas()` with Canvas 2D API instead, which
   supports gradients natively via `ctx.createRadialGradient()` / 
   `ctx.createLinearGradient()`. Do not mix approaches.
