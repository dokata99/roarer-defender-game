# Roarer Defense — Visual Design Update (2026-04-23)

Supersedes the stale pieces of `02-01-visual-design-reference.md` and
`02-02-asset-implementation-plan.md`. The earlier docs were written before
the Frost tower (`01-11`), the Packet flying enemy shipped to config
(`01-08`), the path-tier texturing system (`03-05`), and several grid/portal
layout simplifications. This file is the current visual-design source of
truth; where it conflicts with 02-01/02-02, **this file wins**.

Read this alongside:

- `01-08-enemy-bestiary.md` — canonical enemy roster
- `01-11-frost-tower-design.md` — Cryolock mechanics
- `01-05-wave-flavor-script.md` — canonical wave/milestone copy
- `03-05-path-tier-visuals-design.md` — path surface + guide-line tiers
- `02-01-visual-design-reference.md` — still authoritative for color philosophy,
  UI chassis, SFX timing tables, non-gameplay scenes
- `02-02-asset-implementation-plan.md` — still authoritative for the
  AssetFactory / canvas-texture architecture, particle textures, spritesheet
  helpers. Use it as the *how*, this file as the *what*.

---

## 0. TL;DR — what changed since 02-01 / 02-02

### New things that must be visual-designed

1. **Cryolock (frost tower)** — a third tower archetype. 02-01 only designed
   Firewall and Killswitch. `01-11` ships Cryolock with a placeholder cyan
   rectangle. Needs a final shape + animation language. See §2.3.
2. **Slow-tint enemy state** — a sustained cyan blend on any enemy currently
   affected by a Cryolock slow. Pattern lives on `Enemy`, driven by
   `applySlow`. See §3.6.
3. **Path tiers (grass / cobblestone / bricks)** — `03-05` replaces the
   single flat red path line from 02-01 §4 ("Path Line") with tier-specific
   surface textures + tier-specific guide lines. Path tier visuals are now
   owned by `03-05`; 02-01's path-line section is deprecated. See §4.2.

### Things 02-01 got wrong about the current build

| 02-01 claim | Current reality | Action |
|---|---|---|
| "3 portal rows at `[0,2]/[0,3]/[0,4]`" | `PORTAL_CELLS` has **1 cell** at `{col:0,row:3}` | Design for 1 portal now; keep layout flex for future multi-portal (§4.3) |
| "Splash + Sniper only, 2 tower types" | 2 towers shipped, **Cryolock being added as #3** | §2 covers all 3 |
| "Packet (flying) is *proposed*" | Flying **is** in `enemies.ts` (`flying: true`), shipped with shadow + cyan stroke, no chevron | Finish packet visuals (§3.5) |
| "`CELL_SIZE` reference drawings at 64px" | `CELL_SIZE = 79` | All pixel specs below are re-derived at 79px |
| Path line is `0xFF0000` single red line | `03-05` replaces with per-tier surface + guide color | See §4.2, deprecate 02-01 §4 path-line section |
| Renderer should be `Phaser.WEBGL` | Still `Phaser.AUTO` in `main.ts` | Still a prereq for postFX — §8 |
| `displayName: 'Firewall' / 'Killswitch'` etc. | Code uses generic **`'Splash' / 'Sniper'`** in `TOWER_CONFIGS` | Decision in §2.1 — rename displayName or keep |

### Things 02-02 got wrong about the current build

| 02-02 claim | Current reality | Action |
|---|---|---|
| `AssetFactory.ts` orchestrator | **Does not exist**. `src/assets/` is absent; `src/ui/PathTextures.ts` is the only procedural-texture module | §9 — either build AssetFactory as spec'd, or keep the "per-system texture module" pattern `PathTextures` set. Recommendation: the latter. |
| Tower/Enemy should be `Container` with sprites | Both are `Arc`/`Rectangle`-based, no containers in Enemy, container-of-Rectangle in Tower | Refactor is still required for postFX — §9.3 |
| Projectile should be refactored from Arc → Container | Still `Arc`-based | Only required if we want sprite-based projectiles. Not a blocker. |
| `config.id` field for thematic name | Not present on `TowerTypeConfig` / `EnemyTypeConfig` | Decision in §2.1 |

### Things 02-01 got right and still apply

- Core color philosophy (cool towers / warm enemies / dark foundation) — §1
- Enemy roster (Worm, Trojan, Packet, Zero-Day) themes — §3
- Camera-level bloom + vignette plan — §8
- UI chassis, scene templates, non-gameplay scenes (Menu, Shop, Stats,
  Credits, Pause, Game Over, Victory) — 02-01 §5 stands unchanged
- Animation timing reference table — 02-01 §7 stands unchanged
- Milestone callouts and wave-banner language — 02-01 §5 + `01-05`

---

## 1. Color Palette — reconciled

02-01 proposed a fully neon palette. The current `src/config/constants.ts`
uses a *muted* version of the same palette. Rather than rewriting the code
today, this spec ships a **two-column reconciliation**: current code
constants in column A, the 02-01 aspirational target in column B. The
intent is gradual migration: shift one subsystem at a time, starting with
the highest-impact elements (tower + enemy colors).

| Role | Current code (A) | 02-01 target (B) | Migration priority |
|---|---|---|---|
| Background | `0x0b0f1a` | `0x0B0C10` | Low — close enough visually |
| Grid cell | `0x1a2033` | `0x141726` | Low |
| Grid border | `0x2a3a55` | `0x2A2F4A` | Low |
| Portal | `0x9933cc` | `0x6A00FF` + magenta edge | **High** — part of portal redesign (§4.3) |
| Castle | `0x3366cc` | `0x00E5FF` | **High** — castle becomes cyan server rack (§4.4) |
| Splash tower | `0x3f6bff` (blue) | `0x00E5FF` (cyan) | **High** — visual identity |
| Sniper tower | `0xff4455` (red) | `0x3A86FF` (holo blue) | **Critical** — red tower breaks the TRON rule (cool=defense) |
| Frost tower | *(does not exist yet — `01-11` suggests `0x66ccff`)* | `0x66ccff` or `0x7EF4FF` (ice-cyan) | Ship new |
| Fast (Worm) | `0x55dd66` | `0xB7FF00` (toxic green) | Medium |
| Elite (Trojan) | `0xff9933` | `0xFF6B35` (hot orange) | Medium |
| Boss (Zero-Day) | `0xff3333` | `0xFF2E63` (threat red) | Medium |
| Flying (Packet) | `0xff33ff` | `0xFF3CF2` (neon magenta) | Low — near identical |
| Slow-tint blend target | `0x66ffff` (from `01-11`) | `0x66ffff` | Agrees, ship as-is |

Extended neons (02-01 §1 alternative palette) still stand unchanged —
those are reserved for future enemy types and dimensional effects.

**Decision for this spec:** all subsequent visual specs below assume
**column B** hex values. The `constants.ts` / `towers.ts` / `enemies.ts`
color constants should be shifted as part of the visual overhaul work.

---

## 2. Towers

All towers are 63×63 px visible area (`CELL_SIZE − 16`, centered in the
79 px cell). Each tower is a `Container` at depth `TOWER_DEPTH`. postFX
glow is added at level 3 only (WebGL required).

### 2.1 Naming — Splash / Sniper / Frost (internal) vs. display names

The cyber theming from 02-01 was never wired into code. `TOWER_CONFIGS`
still uses `displayName: 'Splash'` / `'Sniper'`. Two options:

- **Option A — adopt the themed names.** Change `displayName` to
  `'Firewall'` / `'Killswitch'` / `'Cryolock'`. Keep the type union
  (`'splash' | 'sniper' | 'frost'`) unchanged so gameplay code doesn't
  move. **Recommended.** Uses the language `01-05`, `01-06`, `01-08`
  already speak. Tower panel shows `FIREWALL / KILLSWITCH / CRYOLOCK`.
- **Option B — stay generic.** Keep `'Splash'` etc. in UI. Themed names
  only appear in flavor text.

This spec uses the **Option A** names (Firewall / Killswitch / Cryolock)
when describing visuals, on the assumption the rename lands before art
does. If it doesn't, swap the words in the button labels.

**Texture key convention (if/when AssetFactory ships):** keys derive from
the internal type, not displayName: `tower-splash-1`, `tower-sniper-core`,
`tower-frost-2`. This keeps texture-key wiring independent of the
displayName choice above — no `id` field needed.

### 2.2 Firewall (Splash) — unchanged from 02-01

02-01 §2 Firewall design still stands. Octagon outline, cyan
(`0x00E5FF`), rotating square core, 1–3 concentric rings per level,
cyan projectile (superseding the old yellow `0xffdd55`). Air-blind state
(range ring goes muted gray `0x667788` @ 20% when only flying enemies
are in range) still applies — Firewall does not target flying (wave 7
introduces flying and this is the whole teaching moment).

### 2.3 Killswitch (Sniper) — unchanged from 02-01, color shift only

02-01 §2 Killswitch design still stands. Diamond/rhombus, slow rotating
crosshair, dots-at-corners per level, thin white streak projectile. The
only change is the color shift noted in §1: current `0xff4455` red needs
to move to `0x3A86FF` holo-blue before ship — a red "sniper tower" reads
as enemy, not defense.

### 2.4 Cryolock (Frost) — NEW

**Cyber metaphor:** A rate-limiter / throttling appliance. Chills
connections so the real defenses can land their shots.

**Design philosophy:** the third tower must be instantly distinguishable
from Firewall and Killswitch at a glance. Firewall is round-ish
(octagon), Killswitch is pointed (diamond). Cryolock gets **radial
spokes** — a snowflake/asterisk shape that reads "cold burst" and doesn't
collide with the other two silhouettes.

**Visual design (top-down):**

- **Outer shape:** 6-pointed snowflake / asterisk. Six thin tapered
  spokes radiating from a hexagonal hub. Spoke length equal to a
  Firewall octagon's outer radius so all three towers occupy the same
  visual footprint.
- **Color:** Ice Cyan `#7EF4FF` (brighter and cooler than Firewall's
  `#00E5FF`, avoids confusion at distance). Secondary accent `#B9F6FF`
  at hub highlight.
- **Core:** Small hexagon hub, radius 6 px, filled `#141726` with a
  cyan-white radial gradient center. A tiny inner snowflake glyph (3 px
  radius) pulses along with idle animation.
- **Level indicators:** Each level adds **one outer orbiting icicle**
  (small diamond, 4×8 px) rotating around the spoke tips.
  - L1: 0 icicles, 3 spokes visible + 3 faint spokes
  - L2: 3 orbiting icicles at 60° offsets, 6 full-opacity spokes
  - L3: 6 orbiting icicles, spokes thicker and brighter, `postFX.addGlow`
    at `0x7EF4FF`
- **Size:** 70% of cell size for outer spoke tips (same as Firewall).

**Idle animation:**

- Spokes rotate slowly (360° per 6 seconds — slower than Firewall's 4s,
  gives it a "patient/lingering" feel).
- Hub pulses opacity 0.6 → 1.0 over 1.8s (sine yoyo).
- Orbiting icicles (L2/L3) rotate opposite direction from spokes (360°
  per 8s) — the counter-rotation reads as "cold mechanism working."

**Attack animation (each shot):**

- Hub flashes white for 60 ms.
- A **frost ring** expands outward from tower (similar to Firewall's
  splash ring but ice-cyan `#7EF4FF` and slightly *slower* — 350 ms vs
  Firewall's 300 ms). Use `proj-frost-ring` sprite, same geometry as
  Firewall's splash ring, recolored.
- Affected enemies get slow-tint applied (§3.6) for the slow duration.

**Projectile:** Cryolock projectiles are **splash-type** (same pattern
as Firewall in code). Visually: small ice-cyan hexagon core (`#7EF4FF`)
with a trailing white particle wake. Speed 350 px/s (slightly slower
than Firewall's 400 px/s — the slow ammo has weight). On impact spawns
the frost ring described above.

**Level 3 glow:** `postFX.addGlow(0x7EF4FF, 4, 0, false)` at level 3 —
same pattern as other towers' level 3 treatment.

**Drawing snippet (Phaser, programmatic):**

```typescript
// Cryolock (snowflake) at level L, size s
const cx = 0, cy = 0;
const tipRadius = s * 0.35;
gfx.lineStyle(2, 0x7EF4FF, 1);
for (let i = 0; i < 6; i++) {
  const a = (Math.PI / 3) * i;
  gfx.lineBetween(cx, cy, cx + Math.cos(a) * tipRadius, cy + Math.sin(a) * tipRadius);
}
// Hexagonal hub
gfx.beginPath();
for (let i = 0; i < 6; i++) {
  const a = (Math.PI / 3) * i;
  const px = cx + Math.cos(a) * 6;
  const py = cy + Math.sin(a) * 6;
  if (i === 0) gfx.moveTo(px, py); else gfx.lineTo(px, py);
}
gfx.closePath();
gfx.fillStyle(0x141726, 1);
gfx.fillPath();
gfx.strokePath();
```

### 2.5 Tower level progression — summary table

| Tower     | L1 silhouette          | L2 adds              | L3 adds                                   |
|-----------|-------------------------|----------------------|-------------------------------------------|
| Firewall  | Octagon + 1 ring       | +1 inner ring        | +1 outer ring, postFX glow, bright core   |
| Killswitch| Diamond + 1 dot/corner | +1 dot/corner        | +1 dot/corner, postFX glow, scanning beam |
| Cryolock  | 6 spokes + hub         | +3 orbiting icicles  | +3 more icicles (6 total), postFX glow    |

At level 3, `postFX.addGlow(color, 4, 0, false)` is applied to the
container, where `color` is the tower's primary accent hex.

### 2.6 Range indicator on placement / select

Unchanged from 02-01 §5 "Range Indicator." Three tower-specific strokes:

- Firewall: `#00E5FF`, 1 px dashed, fill 8% opacity
- Killswitch: `#3A86FF`, 1 px dashed, fill 8% opacity
- **Cryolock:** `#7EF4FF`, 1 px dashed, fill 8% opacity. Because Cryolock
  is splash-based, the range ring is paired with a **secondary splash
  ring** (the splash radius) drawn inside, dashed 0.5 px at 40% opacity.
  This is the same pattern Firewall gets.

Air-blind indicator (Firewall + flying-only enemy in range) stays. Does
**not** apply to Cryolock — Cryolock *can* target flying (though flying
has `slowResistance: 0.5`, so the slow lands at half strength). Does
**not** apply to Killswitch — Killswitch specifically targets flying.

---

## 3. Enemies

Current roster: Worm, Trojan, Zero-Day, Packet (all present in
`ENEMY_CONFIGS`, all used by `waves.ts` — Packet appears in waves 7, 14,
18). The visual target for each is still what 02-01 §3 described. The
table below is a reality check.

### 3.1 Implementation status snapshot

| Enemy     | Code status                                | Visuals shipped          | Gap vs 02-01 target                                                      |
|-----------|--------------------------------------------|--------------------------|--------------------------------------------------------------------------|
| Worm      | `fast` type, radius 10, green, no segments | Circle + HP bar          | Needs segmented trail + wobble + toxic-green color shift                 |
| Trojan    | `elite` type, radius 16, orange, no shield | Circle + HP bar          | Needs hexagon shape + rotating shield + glitch stutter + hot-orange shift |
| Packet    | `flying` type, radius 11, shadow + cyan stroke, **still follows grid path** | Circle + ellipse shadow | Needs chevron shape + motion trail + straight-line motion + depth 25+    |
| Zero-Day  | `boss` type, radius 26, pulses (scale yoyo tween live) | Pulsing circle + HP bar | Needs irregular polygon + "0" glyph + magenta glow postFX + glitch aura + spawn screen-shake |

### 3.2 Worm — unchanged from 02-01, plus color shift

02-01 §3 Worm design stands. Circle + 3 trailing segments (radii 5/4/3,
alpha 0.8/0.6/0.4). Toxic green `#B7FF00`. Wobble ±2 px perpendicular,
period ~300 ms. Segments live in world-space (not in the Enemy's
container — they need to lag). Green particle burst on death.

**Implementation note for `Enemy.ts`:** the segments trail pattern is
not yet wired; `Enemy.ts` creates only a single `Arc`. When adding
segments, track the head's last N positions at 60 ms intervals and lerp
each segment toward its sample. Override `destroy()` to clean up
segments (they're not container children).

### 3.3 Trojan — unchanged from 02-01, plus color shift

02-01 §3 Trojan design stands. Hexagon (radius 12 px) + rotating outer
hexagon shield at 20% opacity (1 rev / 8s), hot orange `#FF6B35`,
download-arrow triangle inside. Glitch stutter ±2 px every 2–3s for
50 ms. Current code: still a circle, needs the full redesign.

### 3.4 Zero-Day Boss — unchanged from 02-01, plus wired up pieces

02-01 §3 Zero-Day design stands. Irregular 7–9 sided polygon, threat red
core (`#FF2E63`) with magenta outer glow (`#FF3CF2`), inner "0" glyph or
eye slits, glitch aura (2–3 ephemeral rectangles around edge), spawn
screen-shake (300 ms, 0.003 intensity), death explosion with chromatic
aberration flash. Current code has the scale-pulse tween working — the
remaining pieces (shape, glow postFX, glitch aura, spawn shake, death
effects) are the gap.

### 3.5 Packet (Flying) — now fully specified

02-01 called Packet "proposed." It has shipped in config. Final visual
spec:

- **Shape:** 3-vertex chevron arrow pointing along velocity vector
  (tip-forward). 24×24 canvas, drawn as filled path: tip at (20,12),
  tail split into two fins at (4,4) and (4,20), notch at (10,12). Inner
  bright white line along the axis from tip to notch (1 px).
- **Color:** Neon magenta `#FF3CF2` fill gradient to `#66004D` edge.
  1 px stroke same magenta, `shadowBlur=4`.
- **Shadow:** Flattened ellipse (16×6, 35% opacity black) drawn in world
  space 10 px below the packet. Tracks packet X each frame, stays at
  constant Y offset (it's a *ground* shadow, not a container child).
- **Motion trail:** 5–7 short line segments drawn as a `Graphics`
  polyline in the scene (depth 24, just below the packet at 25). Head
  position recorded each frame; trail segments fade from 0.9 alpha at
  the head to 0.15 at the tail.
- **Depth:** Packet renders at `ENEMY_DEPTH + 5` (current code already
  does this — `const depth = this.isFlying ? ENEMY_DEPTH + 5 : ENEMY_DEPTH`,
  `Enemy.ts` L77). Keep this.
- **Rotation:** `setRotation(Math.atan2(vy, vx))` each frame so chevron
  tip always points along motion vector.
- **Death:** Short magenta burst, 150 ms lifespan, 4–6 particles.
  Intentionally cheap — Packet waves can have 20+ enemies.

**Motion — currently wrong:** `Enemy.update()` walks the standard A*
`path` even for flying enemies. Per `01-08` and 02-01, Packet should fly
**straight-line** from spawn to nearest castle cell, ignoring grid and
towers. This is a gameplay bug (visible to player — packet "turns"
around corners instead of flying over them) and needs a branch in
`Enemy.update()`:

```typescript
if (this.isFlying) {
  // Straight line toward fixed target (nearest castle cell, set at construct time)
  const dx = this.targetX - this.x;
  const dy = this.targetY - this.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= step) { this.x = this.targetX; this.y = this.targetY; return 'reached-castle'; }
  this.x += (dx / dist) * step;
  this.y += (dy / dist) * step;
  this.refreshVisualPosition();
  return 'alive';
}
// ... existing path-walking for ground enemies
```

`01-08` §04 "Implementation dependencies" already flags this. Call it
out here because the visual impact (packets hugging corners) is
embarrassing.

### 3.6 Slow-tint state — NEW from `01-11`

Any enemy with an active Cryolock slow gets a **sustained cyan tint**
blended into its body. Same mechanism as the existing
`playHitFlash` (Enemy.ts L165–178) — set `circle.setFillStyle()` — but
sustained for the full slow duration instead of 120 ms.

**Tint color:** `0x66ffff` (ice-cyan, matches slow-projectile).

**Blend strength:** 50/50 blend between base enemy color and slow
color. Worm goes from `#B7FF00` to a pale minty green; Trojan from
hot orange to dusty cyan-orange; Zero-Day from threat red to a muted
purple-pink. The tint's job is just to tell the player "this one is
currently slowed."

**Drift (when the slow expires):** quick 100 ms tween back to base
color. Ideally revert *with* the slow expiry timestamp so there's no
stutter if the player is watching carefully.

**Refresh-not-stack rule** (from `01-11`): if a second Cryolock shot
lands while an enemy is already slowed, the tint just stays on and the
timer extends. Visually, no flicker. In code: clear any existing
`slowTintRevert` timer before starting a new one.

**Resistance hinting (optional polish):** enemies with partial
resistance (`boss: 0.5`, `flying: 0.5`, final boss: `0.9`) could show a
*dimmer* tint to hint at the reduced effect. Scale blend strength
linearly: `blend = 0.5 * (1 - effectiveResistance)`. Not required for v1
— flag as a tuning option if the slow-tint feels over-uniform in
playtest.

### 3.7 Enemy visual summary table (reconciled)

| Type   | Shape            | Radius | Fill color  | Outline color | Key anim          | Death FX particle tint |
|--------|------------------|--------|-------------|---------------|-------------------|------------------------|
| Worm   | Circle + trail   | 10 px  | `#B7FF00`   | brighter green| Wobble + trail    | `#B7FF00`              |
| Trojan | Hexagon + shield | 16 px  | `#FF6B35`   | `#FFAA55`     | Shield rotate + glitch | `#FF6B35` + fragments |
| Packet | Chevron + shadow | 11 px  | `#FF3CF2`   | `#FF3CF2`     | Rotation along vec, trail | `#FF3CF2`          |
| Zero-Day | Irregular polygon | 26 px | `#FF2E63` core, `#FF3CF2` glow | pulses red↔magenta | Scale pulse + glitch aura | `#FF2E63` + `#FF3CF2` + white |

(Radii updated from 02-01 table to match current `enemies.ts`.)

### 3.8 HP bar

Current code ships an HP bar on every enemy (green→red gradient, 4 px
tall). Keep. 02-01 §5 "Enemy HP Bar" had a visibility rule — hide at
full HP for Worms to reduce clutter when spawn counts exceed 30. Still
recommended; not currently implemented. Implementation sketch:

```typescript
const hideAtFull = this.type === 'fast';
this.hpBarBg.setVisible(!hideAtFull || this.hp < this.maxHp);
this.hpBarFill.setVisible(!hideAtFull || this.hp < this.maxHp);
```

---

## 4. Grid, Path, Portal, Castle

### 4.1 Grid background

02-01 §4 circuit-trace overlay stands — it has not shipped and is still
the right direction. Implement once the palette migration finishes.
Grid-warping on impact (02-01 §6 advanced section) remains out of scope.

### 4.2 Path line → path tiers (deprecates 02-01 §4 Path Line)

`03-05-path-tier-visuals-design.md` replaces 02-01's flat `0xFF0000`
path line. Current implementation already renders:

- **Grass** (normal waves): dark mossy green `0x2d4a2b` + blade strokes
- **Cobblestone** (elite waves): near-black mortar `0x23262a` + stone shapes
- **Bricks** (boss waves): dark mortar `0x1a0808` + red brick rows
- **Per-tier guide line** on top: `0xff4d4d` / `0xff8c42` / `0xff2e63`

No changes to the path system in this spec — `03-05` is the source of
truth. Note for future enemy types (e.g., if flying gets its own tier
visual): tier derivation in `03-05` picks the most-threatening spawn; a
flying-only wave currently maps to `'normal'`. If that ever stops
reading clearly, add a `'flying'` tier with a lightning-blue surface —
but not needed for current waves.

### 4.3 Portal — simpler than 02-01 imagined

02-01 drew a 3-row portal (`50 × cellSize * 3`) stretched across three
spawn cells. Current code has **one** portal cell
(`PORTAL_CELLS = [{col: 0, row: 3}]`). The portal visual should be
one cell tall, centered on row 3.

**Design (revised from 02-01):**

- **Shape:** Single rounded rectangle, `cellSize × cellSize` (79×79),
  inset 6 px for breathing room.
- **Color:** Deep purple `#6A00FF` core with magenta `#FF3CF2` edge glow
  (unchanged theme from 02-01).
- **Label:** "WWW" in monospace, Electric Cyan `#00E5FF`, 14 px
  (smaller than 02-01's design since the portal is now 1/3 the height).
  If the cell feels cramped, drop the label entirely and lean on the
  glow — the `03-05` path tier visuals already tell the player where
  enemies come from.
- **Animation:** Outer-glow pulse (outerStrength 2 → 6, 2s cycle).
  Horizontal scan line sweeping down across the portal cell, 2s period.
  Particle emitter (1–2 small 2×2 squares / sec) during wave phase only;
  0 during build phase. Particles drift 20–30 px rightward then fade.

**Forward-compatible:** structure the `renderPortals()` code to iterate
over `PORTAL_CELLS`, so adding back a 3-row layout later (if `01-02`'s
multi-row portal design ever returns) is just a config change. Don't
hard-code "there is one portal."

### 4.4 Castle / Server

02-01 §4 "The Server (Castle)" design stands. Cyan-outlined server rack
with horizontal bay dividers and blinking status LEDs. Current code has
a plain rectangle at `0x3366cc` (blue, wrong).

**Migrate:**

- Outline color: `#3366cc` → `#00E5FF` (Electric Cyan)
- Fill: `#141726` (Dark Surface)
- 3 horizontal bay dividers (1 px `#2A2F4A`)
- 4 status LED dots (3 px white circles, left side of each bay)
- "SERVER" label in `#00E5FF` monospace

**Hit feedback (when enemy reaches castle, per 02-01 §6):** 200 ms red
flash on the server + 1 px screen shake. Currently there's no feedback
at all beyond the lives counter decrementing.

---

## 5. UI — what stands, what changes

### 5.1 02-01 §5 still applies

- HUD bar layout (Wave / Lives / Gold / Phase / Timer)
- Gold counter scale-pulse on change (1.0 → 1.2 → 1.0, 200 ms)
- Phase indicator color-coded (green BUILD / orange WAVE ACTIVE)
- Tooltip chassis
- Wave Preview Card + Wave Banner during build/transition
- Pause Overlay, Game Over, Victory screen layouts
- Milestone Callouts (waves 5/10/15/19/20) — use `01-05` canonical copy

### 5.2 Changes and additions

**Tower panel (bottom bar):** must now hold **three** buttons instead
of two. Current `BottomBar.ts` layout likely needs width adjustment.
`01-11` flags this explicitly ("Verify the three-button layout fits the
bar width").

- Button 1: FIREWALL (cyan accent)
- Button 2: KILLSWITCH (holo-blue accent)
- Button 3: CRYOLOCK (ice-cyan accent) — include slow multiplier +
  duration in tooltip

**Deploy button rename:** 02-01 §5 "DEPLOY" button still stands.
Current button likely still says "START WAVE." Ship the rename as part
of the UI polish pass.

**Tower silhouette icons (for panel buttons):** now 3 icons needed —
add a small snowflake/asterisk (Cryolock) alongside the octagon
(Firewall) and diamond (Killswitch).

**Shop (02-01 §5.3.3 Shop Scene):** no new rows added. `01-11`
confirms Cryolock reuses existing shop upgrades (Tower Damage+, Tower
Speed+, Tower Range+, Splash Radius+ all already apply automatically
via `RunContext.getTowerStats`). The 10-row upgrade layout stands.

**Game Over screen copy:** `01-05` canonical text is
`SYSTEM COMPROMISED` / `"Breach at wave {N}."` / `"Patch the weakness.
Try again."`. 02-01 §5 had the older
`"Breach successful. Run terminated."` — use `01-05`'s version.

**Victory screen copy:** `01-05` canonical is
`INCIDENT CONTAINED` / `"The server is yours."` / `"Endless mode online. The attack never stops."`.
Use this over 02-01's `"Server secure. The breach is patched."`.

---

## 6. VFX — delta from 02-01 §6

All 02-01 VFX specs stand. Status update:

| VFX                              | 02-01 spec           | Current status       |
|----------------------------------|----------------------|-----------------------|
| Camera bloom + vignette          | `cam.postFX.addBloom`, `addVignette` | Not wired (AUTO renderer; will no-op in Canvas) |
| Boss spawn screen-shake          | 300 ms, 0.003        | Not wired            |
| Boss death chromatic flash       | 600 ms               | Not wired            |
| Red vignette @ lives < 30%       | persistent until recovered | Not wired        |
| Enemy hit-spark particles        | 2 white sparks/hit   | Not wired            |
| Gold pickup sparkles             | 2–3 yellow diamonds  | Partially (floating text exists) |
| Splash-explosion fragments       | 8–12 rectangles      | Basic expanding ring exists |
| **Cryolock frost ring**          | **NEW — §2.4**       | Not wired            |
| **Slow-tint on enemies**         | **NEW — §3.6**       | Not wired            |
| **Packet death burst (magenta)** | **NEW — §3.5**       | Not wired            |
| **Slow-expiry puff** (optional)  | **NEW — small cyan dissipation when slow wears off** | Not wired (polish) |

### 6.1 Cryolock-specific VFX

- **Shot emit:** Hub flash (60 ms white) + 3–4 tiny ice-cyan
  particles scattered from tower base.
- **Projectile wake:** 1–2 white pixel particles per 50 ms along
  projectile path, fade in 200 ms.
- **Impact frost ring:** Same shape as splash ring, color `#7EF4FF`,
  350 ms expand, `blendMode: 'ADD'`.
- **Impact frost shards:** 4–6 small diamond particles at impact
  point, 400 ms lifespan, tinted `#7EF4FF`.

### 6.2 Slow-tint VFX (on enemies)

Described in §3.6. Pure tint — no particles needed beyond the optional
slow-expiry puff.

---

## 7. Animation timing — still 02-01 §7

One addition to the timing table:

| Animation              | Duration | Easing           |
|------------------------|----------|-------------------|
| **Cryolock spoke rotation** | **6s** | **Linear** |
| **Cryolock hub pulse**  | **1.8s** | **Sine.InOut** |
| **Cryolock icicle orbit** (L2+) | **8s** (counter-rotating) | **Linear** |
| **Frost ring expand**  | **350 ms** | **Power2.Out** |
| **Slow-tint revert**   | **100 ms** | **Power2.Out** |

Everything else in 02-01 §7 stands.

---

## 8. Prerequisites (still required)

These are prereqs 02-02 called out and they're still outstanding:

1. **WebGL renderer.** `main.ts` still uses `Phaser.AUTO`. Change to
   `type: Phaser.WEBGL` OR gate all postFX calls behind
   `this.game.renderer.type === Phaser.WEBGL`. Without this, every
   `postFX.addGlow` / `addBloom` is a silent no-op on Canvas.
2. **Container-based entities.** Enemy currently uses `Arc` directly,
   not a Container. postFX on `Arc` has inconsistent support. For the
   Zero-Day glow, Worm segments (which need sibling objects outside
   the shape), and any future boss FX, refactor `Enemy` to extend
   `Phaser.GameObjects.Container` with the shape as a child. Tower is
   already a Container-of-Rectangle — just swap the child for a
   `Graphics` or `Image` when textures land.
3. **Texture-generation module.** 02-02 proposed an `AssetFactory`.
   None has been built. `src/ui/PathTextures.ts` is the only procedural
   texture module and it's tightly scoped to the path system. Two
   options:
   - **A (02-02 plan):** Build `src/assets/AssetFactory.ts` that
     orchestrates tower/enemy/projectile/UI texture generation at
     scene boot.
   - **B (smaller):** Per-subsystem modules: `src/ui/TowerTextures.ts`,
     `src/ui/EnemyTextures.ts`, `src/ui/ParticleTextures.ts`, each
     generating its own keys at `GameScene.create()`. Follows the
     existing `PathTextures.ts` pattern.

   **Recommendation: B.** It fits the codebase style, avoids the
   premature-abstraction of a central factory, and lets each subsystem
   ship independently. 02-02's central-AssetFactory section becomes
   aspirational reference rather than a blocker.

---

## 9. Implementation priority

Order by impact-per-hour of work. Each phase is independently shippable.

### Phase A — Cryolock mechanics + placeholder (1-2 days)

Just get the third tower into gameplay, even if the final visual lands
later. Everything in `01-11` §Implementation pointers.

- Add `'frost'` to `TowerType`, `TOWER_CONFIGS.frost`
- Placeholder: cyan rectangle at `0x66ccff`, same style as existing
  Splash/Sniper rects
- Add slow payload path (Projectile → Enemy.applySlow)
- Slow tint on enemies (§3.6)
- Third tower button in BottomBar
- **No final visual yet.** Everything functional.

### Phase B — Tower shape overhaul (2-3 days)

All three towers get their final shapes + level progression at the same
time, so the visual language ships coherent.

- Firewall octagon (02-01 §2)
- Killswitch diamond (02-01 §2) + color shift red → holo-blue
- Cryolock snowflake (§2.4)
- Level progression (rings / dots / icicles) (§2.5)
- Range indicator tints updated (§2.6)

### Phase C — Camera FX + color migration (0.5–1 day)

High visual impact, small code change.

- Switch `main.ts` to `Phaser.WEBGL`
- Add `cam.postFX.addBloom` + `addVignette` to GameScene
- Shift `COLORS` constants toward 02-01 palette (§1 column B)
- Add postFX glow to level-3 towers + Zero-Day boss

### Phase D — Enemy shape overhaul (2-3 days)

- Worm trail + wobble (§3.2)
- Trojan hexagon + rotating shield + glitch stutter (§3.3)
- Zero-Day irregular polygon + glow + glitch aura + spawn shake (§3.4)
- Packet chevron + motion trail + straight-line motion fix (§3.5)
- Enemy color migration (§1)

### Phase E — Environment + UI polish (1-2 days)

- Portal redesign (§4.3)
- Server/castle redesign (§4.4)
- Circuit-trace overlay on grid (02-01 §4)
- Deploy button rename, tower silhouette icons, updated game-over /
  victory copy from `01-05`

### Phase F — Particle system + SFX hooks (2-3 days)

- ParticleTextures module (from 02-02 §1)
- Tower fire particles (Firewall + Killswitch from 02-02 §8, Cryolock
  from §6.1)
- Enemy death particles (all 4 enemy types)
- Gold pickup sparkles, hit sparks, splash fragment particles
- Red vignette when lives < 30%
- Boss death chromatic flash

Each phase is independent and can ship to main without depending on
later phases. Visual quality improves monotonically.

---

## 10. What this spec does not cover

- **SFX / audio.** Still out of scope across 02-series; tracked
  separately when it's its own workstream.
- **Real-asset pipeline.** If we ever move off procedural textures to
  authored PNGs / spritesheets, that's a new spec.
- **Multi-portal return.** If `01-02`'s 3-portal layout ever comes
  back, §4.3 has a forward-compatibility note; the rest of the visual
  spec doesn't need changes.
- **Endless-mode special visuals.** Endless currently reuses campaign
  art. If endless waves past wave 30 need unique visuals (e.g., a
  "corrupted" palette tier), that's a separate design pass.
- **Accessibility / colorblind mode.** Flagged for a future pass —
  current palette leans heavily on hue to differentiate enemies and
  towers.

---

## 11. Open questions

1. **Option A vs B for tower displayName** (§2.1). Default assumption:
   Option A (themed names). Flag if not.
2. **Resistance-hinted slow tint** (§3.6 — dimmer tint on partially
   resistant enemies)? Worth it for clarity or visual noise?
3. **Packet alt color** (magenta vs holo-blue, 02-01 §3 footnote).
   Current code picks magenta `0xff33ff`. Keep magenta. Holo-blue
   collides with Killswitch, which is confusing.
4. **Cryolock icicle count at L3** — 6 around the outside may be
   visually busy at 63 px tall. If it crowds, drop to 3 larger
   icicles for L3. Decide during implementation.
5. **Portal label "WWW"** at single-cell size — keep or drop? Depends
   on readability. Trial both.
