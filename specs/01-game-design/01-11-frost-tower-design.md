# Frost Tower Design — Cryolock

A third tower archetype to round out the crowd-control corner of the rock-paper-scissors triangle. Primary value is **slowing enemies in an area**, not damage.

Internal type: `'frost'` (added to `TowerType`). Player-facing name: **Cryolock** (matches the Firewall / Killswitch tech-compound naming).

Positions relative to the existing two towers:

| Tower | Role | Damage | AoE | Special |
|---|---|---|---|---|
| Splash (Firewall) | AoE damage | Low per hit, strong vs groups | Yes | — |
| Sniper (Killswitch) | Single-target burst | High per shot | No | Crit (shop) |
| **Frost (Cryolock, new)** | **Crowd control** | **Very low** | **Yes** | **Slow debuff** |

The frost tower must feel *different enough* from splash that it's not just "splash with extra words." The rule of thumb: **frost damage should never be the reason you build it** — if the slow were removed, it should be strictly worse than splash at every level.

---

## Mechanics

- **Projectile type**: splash (inherits from the existing `SplashProjectile` pattern). On impact, applies damage + slow to every enemy within splash radius.
- **Targeting**: nearest enemy in range — same rule as splash and sniper. Keeps `findClosestEnemyInRange` as the single shared code path. Revisit after playtest if frost feels underwhelming; not a pre-ship decision.
- **Targets all enemy types** including bosses. Per-type resistance (below) handles differentiation.
- **Slow effect**: multiplier applied to `Enemy.speedPxPerSec` for a fixed duration. See stats table below for per-level values.
- **Slow stacking rule**: hitting an already-slowed enemy **refreshes duration** but does **not stack strength**. Multiple frost towers hitting the same enemy keep the slow ongoing — they don't compound into a near-freeze. This keeps the tower a *force multiplier for your other towers*, not a solo-win button.
- **Slow visual feedback**: while an enemy is slowed, its circle is tinted toward cyan (blend between the enemy's base color and `0x66ffff`), reverting when the slow expires. Same implementation pattern as the existing hit-flash (`Enemy.playHitFlash`), but sustained over the slow's duration rather than a 120ms pulse. Clear from across the board, no extra UI elements, no new sprite work.
- **Per-enemy slow resistance**: every enemy type has a `slowResistance` value in `[0, 1]` (0 = full slow applies, 1 = immune). The effective slow multiplier is `1 - (1 - slowMultiplier) × (1 - slowResistance)`. Values:
  - `fast`: **0** — full slow.
  - `elite`: **0** — full slow.
  - `boss` (regular — wave 10, endless cycle): **0.5**. A frost L3 ×0.5 slow becomes ×0.75; transit 13s → ~17.3s.
  - `flying` (when this enemy type is introduced): **0.5**. Pre-committed so the flying spec doesn't need to re-decide this.
- **Final boss exception (wave 20, "ROOT ACCESS")**: the final boss is near-immune to slow. Resistance is **`0.9`** via a per-spec override on the wave-20 `EnemySpec` (not a new enemy type — it reuses `boss`). A frost L3 hit becomes ×0.95 speed: transit goes from 13s to ~13.7s, roughly a 5% fire-window bonus. Still *something* (so frost isn't a dead tower on the final fight), but nowhere near enough to carry the clear. The `01-06-tower-balance-sheet.md` solvability analysis for wave 20 stays intact.
- **These starting numbers ship as-is.** Regular-boss `0.5`, final-boss `0.9`, flying `0.5` — all tunable in config post-playtest without code changes.

---

## Base stats (L1 → L3, no shop upgrades)

These are the values that ship in v1. They're calibrated starting points — expect to retune in config after playtest against the campaign wave table in `01-06-tower-balance-sheet.md`, no code changes required.

| Level | Cost | Damage | Interval | DPS | Range | Splash radius | Slow multiplier | Slow duration |
|---|---|---|---|---|---|---|---|---|
| L1 | 12g | 2 | 1.0s | **2.0** | 2.5 | 1.0 | ×0.60 | 1.5s |
| L2 | 18g | 3 | 0.9s | **3.3** | 3.0 | 1.2 | ×0.55 | 1.8s |
| L3 | 28g | 4 | 0.8s | **5.0** | 3.5 | 1.5 | ×0.50 | 2.2s |

Rationale:
- **DPS is intentionally ~1/4 of Firewall** at every level. Frost is a utility tower; the slow is the whole value proposition.
- **Cost is slightly higher than Firewall L1** (12g vs 10g) to discourage spam-frost-only openings. Players should still build damage towers.
- **Range matches Firewall** so frost and firewall can share placement logic (same tile footprint, same zone coverage).
- **Slow at L3 hits ×0.5** — halving a fast enemy's speed doubles the firing window for every other tower. That's the headline upgrade reason.

---

## How this reshapes gameplay

- **Swarm waves (fast enemies)**: a single L2 frost at a chokepoint turns a 3.0 tiles/s swarm into 1.65 tiles/s — effectively buying the player ~45% more time-in-range for all adjacent splash/sniper towers. This is the scenario where frost earns its slot.
- **Regular bosses (wave 10, endless-cycle bosses)**: frost L3 extends their 13-second transit to ~17.3s — a 33% fire-window bonus. Bosses still feel like bosses; frost earns its slot.
- **Final boss (wave 20 / ROOT ACCESS)**: near-immune. Frost L3 extends transit from 13s to ~13.7s (~5%). The final fight is still meant to be a test of raw DPS and tower placement, not a slow-lock — frost contributes, but doesn't trivialize the solvability wall.
- **Elite waves**: modest effect. Elites are already slow (1.5 t/s); dropping them to 0.75 t/s makes them arrive at the same time as pre-frost fast enemies, which is fine and doesn't break anything.

---

## Shop upgrade integration

Cryolock uses the **existing global shop upgrades** — no new row in the shop. The 10-row layout in `01-09-shop-progression.md` is unchanged. Specifically:

- **Tower Damage+**, **Tower Speed+**, **Tower Range+** — apply to Cryolock the same way they apply to other towers, via `RunContext.getTowerStats`. No branching needed.
- **Splash Radius+** — **applies to Cryolock** (it has `splashRadiusTiles`, so the current `RunContext` code adds the bonus automatically). This is intentional: a player investing in splash-radius buys more value, and frost damage is low enough that a wider splash isn't balance-breaking.
- **Discount Towers / Discount Upgrades** — apply automatically.
- **Sniper Crit** and **Extra Lives / Starting Gold / Kill Bounty** — don't interact with frost; no change.

No frost-specific upgrade (duration, slow strength) in v1. Revisit post-playtest if the slow feels too weak at low shop levels.

---

## Assets

**Placeholder only for initial implementation.** Use a cyan-toned rectangle matching the splash/sniper placeholder style (`TOWER_CONFIGS.frost.color = 0x66ccff` or similar). Real visual assets (sprite, icon, projectile art, SFX) are deferred to the visual-design track — a follow-up entry in `02-01-visual-design-reference.md` when that pass happens.

The only per-enemy art consequence is the **cyan tint** on slowed enemies (see Mechanics). That's driven by a color-blend at runtime, not a new sprite.

---

## Implementation pointers

When the implementation plan is written, expect to touch:

- `src/config/towers.ts` — add `'frost'` to `TowerType`. Add `TOWER_CONFIGS.frost` with `displayName: 'Cryolock'`, a cyan `color` (e.g. `0x66ccff`) and matching `projectileColor`, and the L1/L2/L3 level table above. Extend `TowerLevelStats` with optional `slowMultiplier?: number` + `slowDurationMs?: number` (only frost sets these).
- `src/config/enemies.ts` — add `slowResistance: number` to `EnemyTypeConfig`. Values: `fast: 0`, `elite: 0`, `boss: 0.5`. When `flying` is added later, set it to `0.5`.
- `src/entities/Enemy.ts` — add optional `slowResistance?: number` to `EnemySpec` for per-wave overrides (used by the wave-20 final boss at `0.9`). Add `slowUntilMs: number` and `activeSlowMultiplier: number` fields; apply in the speed calculation inside `update()` (use base speed when `now >= slowUntilMs`). Add `applySlow(multiplier, durationMs)` that computes the effective multiplier via `1 - (1 - multiplier) × (1 - effectiveResistance)` where `effectiveResistance = spec.slowResistance ?? ENEMY_CONFIGS[this.type].slowResistance`. Refresh-not-stack rule: on re-application, pick the stronger multiplier (lower number) and extend duration to `max(current remaining, new durationMs)`.
- **Slow tint on Enemy**: add `applySlowTint()` / `clearSlowTint()` helpers that blend the base `cfg.color` toward `0x66ffff` while slowed. Wire up in `update()` using the same pattern as `hitFlashTween`, but sustained for the slow duration instead of 120ms. Revert when the slow expires.
- `src/config/waves.ts` — extend the wave-20 final boss spec with `slowResistance: 0.9`. Add an optional `slowResistance` param to `makeEnemySpec` and pass it through.
- `src/entities/Projectile.ts` — extend `SplashProjectile` via composition, not a new class: add optional `slow?: { multiplier: number; durationMs: number }` on the constructor, carry it onto `ProjectileHit.slow`. `SniperProjectile` is untouched.
- `src/scenes/GameScene.ts` — add a `'frost'` branch in `fireTowers()` alongside the splash branch; spawn a `SplashProjectile` with the `slow` payload populated from the tower's current level stats. Extend `applySplashDamage` to call `enemy.applySlow(...)` on every enemy in the splash radius when the hit payload carries a slow.
- `src/ui/BottomBar.ts` — add the third tower button (Cryolock). Verify the three-button layout fits the bar width; adjust spacing if needed. Tooltip should include slow multiplier and duration.
- `src/systems/RunContext.ts` — **no changes needed**. Global shop upgrades already flow through `getTowerStats`; `splashRadiusBonusTiles` already applies to any tower with `splashRadiusTiles`.
- **No save-schema bump** needed (no new shop upgrade).

---

## Not in scope for this spec

- Wave rebalancing to account for frost's existence — handled separately in `01-06-tower-balance-sheet.md` after frost is in code and has been playtested.
- Real visual assets / sound effects — placeholder ships in v1; authored assets land via the visual-design track.
- Implementation plan (step-by-step task list) — will be written as a separate `03-xx-frost-tower-plan.md` under `specs/03-implementation/` when we're ready to build.
- Flying enemy type itself — this spec only pre-commits its `slowResistance` value (`0.5`). The rest of the flying enemy (HP, speed, cost, visuals, which waves use it) is owned by its own future spec.
