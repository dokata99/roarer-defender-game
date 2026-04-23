# Roarer Defense -- Visual Design Reference

Comprehensive design reference for the cyber/neon aesthetic of Roarer Defense.
Based on research of Geometry Wars, Data Wing, TRON, Neon Ascending, Cyberpunk 2077 UI,
and established cyberpunk/neon game design principles.

---

## 1. Color Palette

### Core Philosophy

Cyberpunk color works through **extreme contrast**: near-black backgrounds with 1-2 vibrant
neon accent colors. Large neon panels look cheap; neon should be reserved for edges, outlines,
small highlights, and focal points. The rest is dark neutrals.

**Rule of thumb:** One warm neon + one cool neon + dark foundation. If two saturated colors
fight, separate them with a dark panel or border.

### Primary Palette for Roarer Defense

| Role            | Color Name         | Hex       | 0x (Phaser)  | Usage                                       |
|-----------------|--------------------|-----------|--------------|----------------------------------------------|
| Background      | Deep Void          | `#0B0C10` | `0x0B0C10`   | Scene backgrounds, large fills               |
| Surface         | Dark Surface       | `#141726` | `0x141726`   | Grid cells, panels, card backgrounds         |
| Surface Light   | Elevated Surface   | `#1A1F36` | `0x1A1F36`   | Hovered cells, active panels                 |
| Grid Line       | Grid Trace         | `#2A2F4A` | `0x2A2F4A`   | Grid borders, circuit traces                 |
| Signal Primary  | Electric Cyan      | `#00E5FF` | `0x00E5FF`   | Primary accent: UI highlights, friendly glow |
| Signal Second.  | Neon Magenta       | `#FF3CF2` | `0xFF3CF2`   | Secondary accent: alerts, enemy highlights   |
| Hazard          | Acid Yellow        | `#F7FF4A` | `0xF7FF4A`   | Warnings, gold/currency, hazard indicators   |
| Success         | Matrix Green       | `#00FF6A` | `0x00FF6A`   | Health, build phase, positive feedback       |
| Danger          | Threat Red         | `#FF2E63` | `0xFF2E63`   | Low health, damage, enemy attacks            |
| Text Primary    | Pale Gray          | `#C9D1D9` | `0xC9D1D9`   | Body text, readable content                  |
| Text Secondary  | Muted Blue-Gray    | `#667788` | `0x667788`   | Labels, secondary info                       |

### Alternative / Extended Neons (for variety across enemy types, effects)

| Color Name       | Hex       | 0x            | Suggested Use                    |
|------------------|-----------|---------------|-----------------------------------|
| Plasma Purple    | `#7C4DFF` | `0x7C4DFF`    | Boss glow, special abilities      |
| Holo Blue        | `#3A86FF` | `0x3A86FF`    | Sniper tower, precision effects   |
| Toxic Green      | `#B7FF00` | `0xB7FF00`    | Worm/virus enemies, poison        |
| Hot Orange       | `#FF6B35` | `0xFF6B35`    | Elite enemies, fire/heat          |
| Deep Purple      | `#6A00FF` | `0x6A00FF`    | Portal glow, dimensional effects  |

### TRON Color Rule (relevant for tower/enemy faction distinction)

In TRON, **blue = good, orange = evil**, with orange being twice as bright as blue,
creating a natural 1:2 brightness ratio. For Roarer Defense:
- **Towers/Defenses:** Cool tones (cyan, blue, green)
- **Enemies/Threats:** Warm tones (orange, red, magenta)
- **Neutral/Environment:** Purple sits between, good for portals and dimensional effects

### Current Code Changes Needed

The current palette uses:
- Grid: `0x1a1a2e` (close to new Dark Surface -- keep or shift to `0x141726`)
- Grid border: `0x333355` at 0.6 alpha (shift to `0x2A2F4A`)
- Background: `0x0a0a0a` (shift to `0x0B0C10`)
- Portal: `0x9933ff` (shift to `0x6A00FF` or `0x7C4DFF`)
- Castle/Server: `0x3366ff` (shift to `0x00E5FF`)
- Splash tower: `0x3366ff` (shift to `0x00E5FF` -- firewall cyan)
- Sniper tower: `0xcc3333` (shift to `0x3A86FF` -- towers should be cool-toned, not red)
- Fast enemy: `0x33cc33` (shift to `0xB7FF00` -- toxic green worm)
- Elite enemy: `0xff8833` (shift to `0xFF6B35` -- hot orange trojan)
- Boss enemy: `0xcc0000` (shift to `0xFF2E63` with `0xFF3CF2` magenta glow)

---

## 2. Tower Designs

### Design Philosophy

Towers are **defensive security tools**. They should look clean, geometric, and structured --
like engineered systems. Cool-toned palette (cyan, blue, white).

Each tower should have:
1. A distinct **silhouette** (outer shape)
2. A visible **core** (inner element that pulses/rotates)
3. A **level indicator** (rings, dots, or brightness increase)
4. A subtle **idle animation** (rotation, pulse, scan)

### Splash Tower --> "FIREWALL"

**Cyber metaphor:** A firewall that blocks and neutralizes threats in an area.

**Visual design (top-down, simple shapes):**
- **Outer shape:** Octagon (stop-sign shape, suggests "blocking")
- **Color:** Electric Cyan (`#00E5FF`)
- **Core:** Small rotating square inside, representing a scanning engine
- **Level indicators:** 1-3 concentric rings around the octagon, one per level
- **Size:** 70% of cell size (current), outer ring at 85% for level 3

**Idle animation:**
- Core square rotates slowly (360deg per 4 seconds)
- Faint pulse on the outer edge (opacity 0.3 -> 0.5, 1.5s cycle)

**Attack animation:**
- Core flashes white for 100ms
- Ripple ring expands outward from tower (like a firewall "burst")
- Splash explosion: expanding ring of cyan that fades (already partially implemented)

**Projectile:** Small cyan orb with a trailing glow, speed 400px/s

### Sniper Tower --> "KILLSWITCH" or "PATCHER"

**Cyber metaphor:** A targeted security patch or precision kill command.

**Visual design (top-down, simple shapes):**
- **Outer shape:** Diamond/rhombus (suggests precision, a targeting reticle)
- **Color:** Holo Blue (`#3A86FF`)
- **Core:** Thin crosshair lines (+ shape) inside, representing targeting
- **Level indicators:** Small dots at each diamond corner, lighting up with level (1=1 dot, 3=3 dots per corner)
- **Size:** 70% of cell size

**Idle animation:**
- Crosshair slowly rotates (360deg per 6 seconds -- slower than firewall, implies patience)
- Faint scanning beam sweeps in a circle (thin line from center to range edge, 10% opacity)

**Attack animation:**
- Crosshair snaps to target direction (instant rotation)
- Brief "lock-on" flash (white outline on target for 50ms)
- Thin beam/tracer line from tower to target (fades in 200ms)

**Projectile:** Thin bright white streak (not a circle -- a short line segment), speed 600px/s

### Drawing Towers Programmatically in Phaser

```
// Firewall (Octagon)
graphics.lineStyle(2, 0x00E5FF, 1);
graphics.beginPath();
for (let i = 0; i < 8; i++) {
  const angle = (Math.PI / 4) * i - Math.PI / 8;
  const px = Math.cos(angle) * outerRadius;
  const py = Math.sin(angle) * outerRadius;
  if (i === 0) graphics.moveTo(px, py);
  else graphics.lineTo(px, py);
}
graphics.closePath();
graphics.strokePath();

// Killswitch (Diamond)
graphics.lineStyle(2, 0x3A86FF, 1);
graphics.beginPath();
graphics.moveTo(0, -outerRadius);          // top
graphics.lineTo(outerRadius * 0.7, 0);     // right
graphics.lineTo(0, outerRadius);            // bottom
graphics.lineTo(-outerRadius * 0.7, 0);    // left
graphics.closePath();
graphics.strokePath();
```

### Level Progression Visual

| Level | Effect                                                         |
|-------|----------------------------------------------------------------|
| 1     | Base shape, single outline, dim core                           |
| 2     | +1 concentric ring, brighter core, slightly faster rotation    |
| 3     | +2 rings, brightest core, fastest rotation, outer glow effect  |

At level 3, apply `postFX.addGlow(color, 4, 0, false)` for a visible neon halo.

---

## 3. Enemy Designs

### Design Philosophy

Enemies are **cyber threats** -- they should look organic, chaotic, and menacing compared
to the clean geometric towers. Warm-toned palette (green, orange, red, magenta).

Differentiation beyond color:
1. **Silhouette/shape** -- each type has a unique outline
2. **Size** -- bigger = more dangerous
3. **Animation pattern** -- fast=jittery, elite=steady, boss=pulsing
4. **Inner detail** -- distinct internal pattern
5. **Trail/particles** -- unique motion trail

### Fast Enemy --> "WORM"

**Cyber metaphor:** A computer worm -- self-replicating, fast-spreading, lightweight.

**Visual design:**
- **Shape:** Small circle with 3-4 short trailing segments (like a worm body)
  - Main body: circle, radius 8px
  - Trail: 3 smaller circles (radius 5, 4, 3) following behind with 6px spacing, decreasing opacity
- **Color:** Toxic Green (`#B7FF00`)
- **Inner detail:** Two small dark dots (eyes) offset toward movement direction
- **Outline:** 1px stroke, slightly brighter than fill

**Animation:**
- Slight side-to-side wobble as it moves (sinusoidal offset, amplitude 2px, period 0.3s)
- Trail segments follow with a small delay (lerp toward previous position)

**Death animation:**
- Fragments into 4-6 small green particles that scatter outward and fade (300ms)
- Brief green flash at death position

### Elite Enemy --> "TROJAN"

**Cyber metaphor:** A trojan horse -- disguised, powerful, deceptive.

**Visual design:**
- **Shape:** Hexagon (6 sides -- suggests complexity, mimics a "package")
  - Radius 12px
- **Color:** Hot Orange (`#FF6B35`)
- **Inner detail:** Small triangle inside pointing downward (download arrow -- "trojan package")
- **Outline:** 2px stroke, slightly brighter orange
- **Shield effect:** Faint outer hexagon at 120% radius, 20% opacity (suggests hidden armor)

**Animation:**
- Slow, steady rotation (360deg per 8 seconds -- rotates the outer hexagon only)
- Occasional "glitch" -- every 2-3 seconds, briefly offset its position by 2px in a random direction for 50ms (like a visual stutter/corruption)

**Death animation:**
- Hexagon "cracks" -- outline fragments into 6 line segments that fly outward
- Inner triangle dissolves into pixel-like squares (6-8 small rectangles, random directions)
- Orange flash, 400ms total

### Boss Enemy --> "ZERO-DAY"

**Cyber metaphor:** A zero-day exploit -- unknown, devastating, nearly unstoppable.

**Visual design:**
- **Shape:** Large irregular polygon (7-9 sides, slightly asymmetric -- suggests unknown/unpredictable)
  - Radius 18px (current), rendered as a deformed circle or irregular polygon
- **Color:** Threat Red core (`#FF2E63`) with Neon Magenta (`#FF3CF2`) outer glow
- **Inner detail:** "0" character rendered inside (zero-day) or a skull-like pattern from simple shapes
- **Outline:** 3px stroke, pulsing between `#FF2E63` and `#FF3CF2`
- **Glow:** Constant outer glow (postFX.addGlow), radius pulsing

**Animation:**
- Constant pulsing (scale 1.0 to 1.15, 500ms cycle -- already implemented)
- Color shift: outline hue slowly cycles between red and magenta
- "Glitch aura": small rectangles randomly appear and disappear around it (2-3 at a time, 100ms lifespan, within 8px of edge)
- Screen shake when it spawns (very subtle, 2px amplitude, 300ms)

**Death animation:**
- Large explosion: expanding ring of magenta, chromatic aberration flash on camera
- Body "disintegrates" into 12-16 pixel fragments that scatter with physics
- Screen flash (white overlay, 50ms, 30% opacity)
- 600ms total duration

### Enemy Visual Summary Table

| Type  | Shape              | Radius | Color     | Outline | Trail/Effect         |
|-------|--------------------|--------|-----------|---------|----------------------|
| Worm  | Circle + segments  | 8px    | `#B7FF00` | 1px     | Following body parts |
| Trojan| Hexagon            | 12px   | `#FF6B35` | 2px     | Glitch stutter       |
| Boss  | Irregular polygon  | 18px   | `#FF2E63` | 3px     | Glow aura + glitch   |

---

## 4. Grid & Environment Design

### Making the Grid Look Like a Circuit Board

The current grid is flat rectangles with borders. To sell the "digital network" theme:

**Layer 1 -- Base Grid (already exists)**
- Cell fill: `#141726` (Dark Surface)
- Cell border: `#2A2F4A` (Grid Trace) at full opacity (not 0.6)

**Layer 2 -- Circuit Traces (new)**
Draw thin lines connecting certain grid intersections to suggest circuit board traces:
- Line color: `#2A2F4A` at 40% opacity, 1px wide
- Pattern: Every 3rd intersection has a horizontal or vertical "trace" extending 1-2 cells
- Small filled circles (3px radius) at some intersections: "solder points" / "nodes"
- Node color: `#2A2F4A` at 60% opacity

Implementation approach (in `drawGrid()`):
```
// After drawing cells, add deterministic circuit traces
// Uses a seed derived from grid position so traces are stable across redraws
for (let row = 0; row <= GRID_ROWS; row++) {
  for (let col = 0; col <= GRID_COLS; col++) {
    const seed = row * 17 + col * 31;  // deterministic pseudo-random
    const ix = gm.offsetX + col * gm.cellSize;
    const iy = gm.offsetY + row * gm.cellSize;

    // Node dot at some intersections
    if (seed % 3 === 0) {
      gridGraphics.fillStyle(0x2A2F4A, 0.5);
      gridGraphics.fillCircle(ix, iy, 1.5);
    }

    // Horizontal trace segment
    if (seed % 5 === 0 && col < GRID_COLS) {
      gridGraphics.lineStyle(0.5, 0x2A2F4A, 0.3);
      gridGraphics.lineBetween(ix, iy, ix + gm.cellSize, iy);
    }

    // Vertical trace segment
    if (seed % 7 === 0 && row < GRID_ROWS) {
      gridGraphics.lineStyle(0.5, 0x2A2F4A, 0.3);
      gridGraphics.lineBetween(ix, iy, ix, iy + gm.cellSize);
    }
  }
}
```

**Layer 3 -- Ambient Data Flow (subtle, optional)**
Periodically spawn a small bright dot that travels along a grid line (like a data packet):
- Color: `#00E5FF` at 20% opacity
- Size: 2px circle
- Speed: 50px/s
- One active at a time, spawns every 3-5 seconds
- Travels along grid edges, turns at intersections

**Layer 4 -- Background Atmosphere**
Behind the grid, add extremely subtle background elements:
- Faint hex grid pattern at 5% opacity (large hexagons, 200px across)
- Or faint radial gradient from center: slightly lighter (`#141726`) fading to edges (`#0B0C10`)
- 20-30 tiny dots (1-3px) floating with slow alpha tween (0.05 to 0.2) -- already implemented in MainMenuScene

### The Portal ("WWW")

Transform from a plain rectangle to an iconic gateway:

**Design:**
- Shape: Rounded rectangle or arch shape
- Color: Deep Purple (`#6A00FF`) core with Neon Magenta (`#FF3CF2`) edge glow
- Label: "WWW" in monospace, Electric Cyan (`#00E5FF`) -- stands out against purple
- Size: 50x(cellSize*3) -- keep current dimensions

**Animation:**
- Constant pulsing glow (outer glow oscillates outerStrength 2 to 6, 2s cycle)
- "Data stream" particles flowing OUT of the portal (toward right):
  - Small 2x2 rectangles, random green/magenta/cyan
  - Spawn rate: 1-2 per second during waves, 0 during build phase
  - Travel 30-40px then fade
- Faint horizontal scan line sweeping down across the portal (like a loading bar)

**Portal Cells (spawn area):**
- Instead of `0x9933ff` at 0.3 alpha, use `0x6A00FF` at 0.15 alpha
- Add a subtle animated border: dashed line effect (alternating lit segments)

### The Server (Castle)

Transform from a plain rectangle to a recognizable server rack:

**Design:**
- Shape: Rectangle with horizontal internal lines (like a server rack with drives)
  - 3-4 horizontal lines dividing the rectangle into "bays"
  - Small blinking dots on the left of each bay (status LEDs)
- Color: Electric Cyan (`#00E5FF`) outline, Dark Surface (`#141726`) fill
- Label: "SERVER" in monospace, `#00E5FF`
- Status LEDs: Small circles (2px), green when healthy, shift toward red as lives decrease

**Animation:**
- LEDs blink at different rates (staggered timers, 0.5-1.5s intervals)
- When hit (enemy reaches castle), brief flash red + screen shake (2px, 200ms)
- If lives < 30%, LEDs change to `#FF2E63` and blink faster

**Server Cells (destination area):**
- Color: `#00E5FF` at 0.1 alpha
- Subtle pulse (alpha 0.08 to 0.15, 3s cycle)

---

## 5. UI Design

### Design Language

The HUD should look like a **security operations center (SOC) dashboard** or **terminal interface**.

Key principles:
- Dark panels with thin neon borders (1-2px)
- Monospace font for data, geometric font for headers
- Cut corners on panels (chamfered rectangles -- "tech panel" look)
- Consistent 4-8px padding
- Neon accent colors used sparingly on text and borders, not fills

### Font Choices

**Primary (data/body):** `'Courier New', monospace` (already in use -- good)

**Recommended upgrade:** Load Google Font **"Orbitron"** for headers/titles and **"Rajdhani"**
or **"Chakra Petch"** for body UI text. All are free on Google Fonts.

For now, sticking with `monospace` is fine. When ready to enhance:
```html
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">
```

Then in Phaser text:
```
fontFamily: "'Orbitron', sans-serif"   // for titles
fontFamily: "'Rajdhani', sans-serif"   // for UI body
fontFamily: "monospace"                // for data/numbers (keep)
```

### HUD Bar (Top)

Current: simple text labels on a dark bar.

**Enhanced design:**
- Background: `#0B0C10` at 90% opacity, bottom border 1px `#2A2F4A`
- Height: 36px (up from 30)
- Layout: Left-to-right: Wave | Lives | Gold | Phase | [spacer] | Game Timer

**Wave Counter:**
```
WAVE 03/10
```
- "WAVE" in `#667788` (muted), number in `#00E5FF` (bright cyan)
- During wave phase, number pulses slightly

**Lives Display:**
```
[shield icon] 85
```
- Represented as a bar that depletes:
  - Background: `#1A1F36`, 120px wide, 14px tall
  - Fill: gradient from `#00FF6A` (high) to `#FF2E63` (low)
  - Numeric value overlaid in white
  - When lives < 30%, bar pulses red

**Gold Counter:**
```
[coin icon] 150
```
- Coin icon: small circle, Acid Yellow (`#F7FF4A`)
- Number in `#F7FF4A`
- When gold changes, number does a brief scale-up tween (1.0 -> 1.2 -> 1.0, 200ms)

**Phase Indicator:**
```
[ BUILD PHASE ] or [ WAVE ACTIVE ]
```
- Build phase: `#00FF6A` text with subtle green glow
- Wave phase: `#FF6B35` text with subtle orange glow
- Transition: brief flash white, then new color fades in (300ms)

### Tower Panel (Bottom Bar)

Current: dark bar with rectangle buttons.

**Enhanced design:**
- Background: `#0B0C10` at 95% opacity, top border 1px `#2A2F4A`
- Buttons: Dark Surface fill, 1px border in tower's accent color
  - Hover: border brightens to full neon, fill lightens slightly (`#1A1F36`)
  - Selected: border 2px, fill `#1A1F36`, small glow effect on border
  - Can't afford: entire button at 40% opacity, border dimmed

**Button layout (each button):**
```
+-------------------+
|  [tower shape]    |  <- actual tower silhouette drawn small
|    FIREWALL       |  <- name in accent color
|     10g           |  <- cost in yellow
+-------------------+
```

### Tooltip Styling

- Background: `#0B0C10` at 95% opacity
- Border: 1px `#2A2F4A` (or tower's accent color)
- Padding: 8px
- Text: `#C9D1D9` for labels, accent color for values
- Shadow/glow: subtle drop shadow (2px, `#000000` at 40%)

### Start Wave Button

- Background: `#0B0C10`, border 2px `#00FF6A`
- Text: "DEPLOY" (better than "START WAVE" -- more thematic) in `#00FF6A`
- Hover: fill shifts to `#0A1F0A`, border glows
- Click: flash white, text changes to "DEPLOYING..." during wave
- Disabled: gray out entire button, border `#2A2F4A`

### Tower Info Panel (selected tower)

- Floating panel near selected tower (or fixed position on right side)
- Dark panel with tower-colored border
- Content:
  ```
  FIREWALL Lv.2
  DMG: 8    RNG: 3.0
  SPD: 0.71s
  [UPGRADE 25g] [SELL 19g]
  ```
- Upgrade button: border in `#F7FF4A`, text in yellow
- Sell button: border in `#FF2E63`, text in red

---

## 6. VFX and Juice

### Post-Processing Effects (Camera-level)

Apply these to the main camera for scene-wide atmosphere:

```javascript
// In GameScene.create(), after all setup:
const cam = this.cameras.main;

// Subtle bloom -- makes all bright elements glow slightly
cam.postFX.addBloom(0xffffff, 1, 1, 1, 0.8, 4);

// Vignette -- darkens edges, focuses attention on center
cam.postFX.addVignette(0.5, 0.5, 0.9, 0.3);
```

**Bloom parameters explained:**
- Color: `0xffffff` (white -- bloom all colors)
- OffsetX/Y: `1, 1` (slight spread)
- BlurStrength: `1` (moderate blur)
- Strength: `0.8` (subtle -- not overpowering)
- Steps: `4` (quality)

**Geometry Wars reference values:**
- Bloom threshold: 0.25
- Blur amount: 4
- Bloom intensity: 2
- Bloom saturation: 1.5 (this is key -- glow is MORE saturated than source)
- Base saturation: 1

### Scanline Effect (Optional, Subtle)

For a CRT/terminal feel, consider using the Horri-fi plugin:

```javascript
// Install: npm install phaser3-rex-plugins
import HorrifiPipelinePlugin from 'phaser3-rex-plugins/plugins/horrifipipeline-plugin.js';

// Apply to camera
const pipeline = this.plugins.get('rexHorrifiPipeline').add(this.cameras.main, {
  scanlinesEnable: true,
  scanStrength: 0.03,        // very subtle
  vignetteEnable: true,
  vignetteStrength: 0.3,
  bloomEnable: true,
  bloomIntensity: 0.3,
  bloomThreshold: 0.5,
  noiseEnable: true,
  noiseStrength: 0.02,       // barely visible grain
  chromaticEnable: false,    // chromatic aberration off by default
  chabIntensity: 0,
});
```

Enable chromatic aberration briefly (100ms) on boss spawn or big impacts for dramatic effect.

### Particle Effects

**Tower firing (Firewall):**
- 3-5 tiny cyan squares (2x2px) burst outward from tower on each shot
- Lifespan: 200ms, fade out, random velocity

**Tower firing (Killswitch):**
- Brief muzzle flash: white circle at tower center, 30ms, radius 4px
- Thin tracer line persists for 150ms along projectile path

**Splash explosion (enhanced):**
- Current: expanding circle. Keep this.
- Add: 8-12 small rectangles (1x3px) scattered outward from impact point
- Color: mix of cyan and white
- Lifespan: 300ms, fade + shrink
- Brief screen shake on large splash (1px amplitude, 100ms)

**Enemy death -- Worm:**
- 4-6 small green circles scatter outward
- Lifespan: 300ms
- Brief green flash at center (50ms)

**Enemy death -- Trojan:**
- Hexagon outline fractures into 6 line segments that fly outward and fade
- 6-8 small orange rectangles (pixel fragments) scatter
- Lifespan: 400ms

**Enemy death -- Zero-Day Boss:**
- Large expanding ring (magenta, similar to splash but bigger)
- 12-16 mixed red/magenta particle fragments
- Brief camera chromatic aberration (100ms)
- Brief white screen flash (30% opacity, 50ms)
- Screen shake (3px amplitude, 300ms)
- Lifespan: 600ms total

**Enemy hit flash (enhanced):**
- Current: fill turns red for 100ms. Keep this.
- Add: 1-2 tiny white sparks at hit position
- Brief white outline flash (the enemy's stroke goes white for 50ms)

**Gold pickup (enhanced):**
- Current: floating "+2g" text. Keep this.
- Add: 2-3 tiny yellow diamond particles rising from death position
- Lifespan: 400ms

### Geometry Wars Style Techniques (Adapted)

**Grid warping** -- The iconic Geometry Wars background uses a spring-mass system:
- Each grid intersection is a mass point with springs to neighbors
- Stiffness: 0.28, Damping: 0.06
- Border points are anchored (stiffness 0.1, damping 0.1)
- Explosions push the grid outward; impacts pull it inward

For Roarer Defense, a simplified version:
- When a splash explosion happens, briefly displace nearby grid line intersections outward
- When a boss dies, create a larger ripple
- Spring back to rest over 500ms
- This is an advanced feature -- implement last, as it requires redrawing grid each frame

**Alternative to full grid warp:** Just animate the opacity or brightness of grid cells near
impacts. Cheaper and still effective:
```javascript
// On splash impact at (x, y):
// Find nearby grid cells
// Tween their fill alpha from 0.6 to 1.0 and back over 300ms
// Tween their border color brightness up then down
```

### Screen Effects for Game Events

| Event                   | Effect                                        | Duration |
|-------------------------|-----------------------------------------------|----------|
| Wave starts             | Brief green pulse on HUD phase text           | 300ms    |
| Boss spawns             | Screen shake 2px + brief magenta vignette     | 400ms    |
| Boss dies               | Screen shake 3px + chromatic aberration flash  | 600ms    |
| Enemy reaches server    | Red flash on server + screen shake 1px        | 200ms    |
| Lives < 30%             | Persistent subtle red vignette                | Ongoing  |
| Tower placed            | Brief white flash on cell                     | 100ms    |
| Tower upgraded to Lv.3  | Brief glow burst on tower                     | 300ms    |
| Victory                 | Bloom intensity ramps up + cyan color wash    | 1000ms   |
| Defeat                  | Color desaturation + red vignette intensifies | 1000ms   |

---

## 7. Animation Timing Reference

Consistent timing creates cohesive feel. Use these as baseline:

| Animation              | Duration | Easing           |
|------------------------|----------|-------------------|
| Tower idle rotation    | 4-6s     | Linear            |
| Tower pulse            | 1.5s     | Sine.InOut        |
| Boss pulse             | 0.5s     | Sine.InOut (yoyo) |
| Hit flash              | 100ms    | None (instant)    |
| Death particles        | 300-600ms| Power2.Out        |
| Gold text float        | 800ms    | Power1.Out        |
| Splash explosion ring  | 300ms    | Power2.Out        |
| Screen shake           | 100-300ms| Sine.Out (decay)  |
| UI transition          | 200-300ms| Power2.Out        |
| Hover highlight        | Instant  | None              |
| Glow pulse             | 2s       | Sine.InOut        |
| Grid cell flash        | 300ms    | Power2.Out        |

---

## 8. Implementation Priority

Ordered by visual impact vs effort:

### Phase 1 -- Config & Color Overhaul (High impact, Low effort)
1. Change renderer to `Phaser.WEBGL` in `main.ts` (required for postFX)
2. Add `id` field to `TowerConfig` and `EnemyConfig` for thematic names
3. Update all colors in `towers.ts`, `enemies.ts` to new palette
4. Update grid drawing colors in `GameScene.drawGrid()`
5. Update portal and castle colors
6. Update all UI text colors in `HUD.ts`, `TowerPanel.ts`, `WavePreview.ts`

### Phase 2 -- Camera FX (High impact, Low effort)
1. Add bloom to main camera (`cam.postFX.addBloom(...)`)
2. Add vignette to main camera (`cam.postFX.addVignette(...)`)
3. These two alone will transform the look dramatically

### Phase 3 -- Tower Shape Upgrade (Medium impact, Medium effort)
1. Replace tower rectangles with octagon (firewall) and diamond (killswitch) shapes
2. Add rotation animation to tower cores
3. Add level-based visual progression

### Phase 4 -- Enemy Shape Upgrade (Medium impact, Medium effort)
1. Replace enemy circles with distinct shapes (worm trail, hexagon, irregular polygon)
2. Add movement animations (worm wobble, trojan glitch, boss pulse)
3. Enhanced death animations with particles

### Phase 5 -- Grid Enhancement (Medium impact, Medium effort)
1. Add circuit trace overlay
2. Add node dots at intersections
3. Redesign portal and server visuals

### Phase 6 -- UI Polish (Medium impact, Medium effort)
1. Styled HUD bar with proper layout
2. Enhanced tower buttons with silhouettes
3. Better tooltip styling
4. Start wave button retheme to "DEPLOY"

### Phase 7 -- Advanced VFX (Low-medium impact, Higher effort)
1. Particle effects for shots, deaths, impacts
2. Screen effects (shake, flash)
3. Grid warping on impacts
4. Horri-fi scanlines (optional)
5. Data flow ambient particles

---

## 9. Technical Notes for Phaser Implementation

### Applying Glow to Individual Objects

```javascript
// Only works in WebGL mode (default for most browsers)
// For a tower at level 3:
tower.postFX.addGlow(0x00E5FF, 4, 0, false);

// For the boss enemy:
enemy.postFX.addGlow(0xFF3CF2, 6, 0, false);
```

**Caveat:** `postFX` works on GameObjects, not on Graphics primitives directly.
Towers and enemies are Containers, and postFX on containers affects all children.
This should work for the current Container-based approach.

### Drawing Custom Shapes

Replace `scene.add.rectangle(...)` and `scene.add.circle(...)` with `Graphics` objects
for more shape flexibility:

```javascript
// Inside Tower constructor, replace rectangle with:
const gfx = scene.add.graphics();
gfx.lineStyle(2, config.color, 1);
// Draw octagon, diamond, etc.
this.add(gfx);
```

### Performance Considerations

- Camera postFX (bloom, vignette) have negligible cost on modern GPUs
- Per-object postFX (glow) is more expensive -- limit to level 3 towers and bosses
- Particle counts: keep under 50 active particles at any time
- Grid warp: only attempt if running at 60fps consistently
- Scanlines via Horri-fi: adds a full-screen shader pass -- test on low-end devices

---

## Sources

Research compiled from:
- [20+ Cyberpunk Color Palette Combinations](https://www.media.io/color-palette/cyberpunk-color-palette.html)
- [How To Create a Cyberpunk Color Palette](https://pageflows.com/resources/cyberpunk-color-palette/)
- [Neon Color Palette: HEX Codes & Cyberpunk Design](https://coloruxlab.com/colors/neon-colors)
- [Cyberpunk Color Palettes - ColorMagic](https://colormagic.app/palette/explore/cyberpunk)
- [Geometry Wars Sensible Aesthetic - Game Developer](https://www.gamedeveloper.com/pc/the-color-and-the-shape-bizarre-creations-on-i-geowars-i-sensible-aesthetic)
- [Neon Vector Shooter: Bloom and Black Holes](https://code.tutsplus.com/make-a-neon-vector-shooter-in-xna-bloom-and-black-holes--gamedev-9877t)
- [Neon Vector Shooter: The Warping Grid](https://code.tutsplus.com/make-a-neon-vector-shooter-in-xna-the-warping-grid--gamedev-9904t)
- [Visual Hierarchy in Tower Defense Design](https://www.wesplays.com/wes-plays/from-chaos-to-clarity-visual-hierarchy-in-tower-defense-design)
- [Phaser FX Documentation](https://docs.phaser.io/phaser/concepts/fx)
- [Phaser Built-in Shader Effects](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-builtin/)
- [Horri-fi Shader Plugin](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-horrifi/)
- [RetroZone: CRT and Scanline Effects for Phaser](https://phaser.io/news/2026/03/retrozone-open-source-retro-display-engine-phaser)
- [Cyberpunk UI Font Tips](https://www.wendyzhou.se/blog/4-best-cyberpunk-ui-font-tips-examples/)
- [Cyberpunk 2077 Fonts In Use](https://fontsinuse.com/uses/60926/cyberpunk-2077-video-game)
- [Cyberpunk UI Dashboard Aesthetics](https://www.wendyzhou.se/blog/cyberpunk-ui-dashboard-aesthetics-inspiration-and-ai/)
- [Orbitron - Google Fonts](https://fonts.google.com/specimen/Orbitron)
- [3D Cyber Tower Defence Game](https://sites.google.com/pnw.edu/3dgames/vr-games/3d-cyber-tower-defence-game)
- [Cyberpunk 80s Tower Defense - ArtStation](https://www.artstation.com/artwork/ylOe8)
- [Data Wing - Glitchwave](https://glitchwave.com/game/data-wing/)
- [Cyberpunk Neon Color Palette](https://www.color-hex.com/color-palette/61235)
- [15 Cyberpunk Aesthetic Color Palettes](https://blog.depositphotos.com/15-cyberpunk-color-palettes-for-dystopian-designs.html)
