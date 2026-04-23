# Security Meter Design

Reworks the "Lives" system into a **Security** meter (0–100%) representing the company's defense integrity. Leaks take bigger bites, so each mistake matters, but clearing a wave perfectly regenerates a small amount — rewarding skill without making mistakes unrecoverable.

---

## Summary of changes

| Aspect | Before | After |
|---|---|---|
| Meter name | Lives | **Security** |
| Display unit | Integer (e.g. "42 Lives") | Percentage (e.g. "42%") |
| Start value | 100 lives | **100%** |
| Fast leak penalty | −1 | **−5%** |
| Flying leak penalty | −5 | **−10%** |
| Elite leak penalty | −5 | **−15%** |
| Boss leak penalty | −999 (instant) | **−90%** (near-instant; 10% left) |
| Wave-clear regen | None | **+5% on a perfectly-cleared wave** (capped at 100%) |
| Shop "Extra Lives" upgrade | +20 lives per level, 5 levels | **Removed** — security is not buyable |
| Game-over condition | `lives <= 0` | `security <= 0` |

---

## Mechanics

### Meter

- Integer-valued percentage in `[0, 100]`. No fractional values — all penalties are whole integers, and the regen is +5 integer.
- Starts every run at **100** regardless of shop state (the "Extra Lives" upgrade is removed).
- Game over triggers when `security <= 0`, same semantics as the current lives check in `GameScene.update`.

### Leak penalties (per enemy type)

Flat per-type penalties — no wave scaling. Values live in `ENEMY_CONFIGS` (rename field from `livesLostOnReach` to `securityLostOnReach`):

| Enemy | Penalty | Leaks until 0% |
|---|---|---|
| Fast | 5 | 20 |
| Flying | 10 | 10 |
| Elite | 15 | 6–7 |
| Boss | 90 | 1 (leaves 10%, effectively one more hit = game over) |

Boss penalty is **90 (not 100)** so a boss leak doesn't necessarily end the run on its own — if the player is at 100% security when the boss leaks, they're at 10%, alive, and any single additional leak ends the run. Keeps the boss as a near-instant fail without removing the "you *might* survive if you absorbed no prior damage" drama.

### Wave-clear regen

- On wave completion, **if zero enemies reached the castle during that wave**, the player regenerates **+5% security**, clamped to a maximum of 100%.
- A wave counts as "perfectly cleared" only when *no* enemy of *any* type leaked. One fast leak disqualifies the bonus for the whole wave.
- No regen on a wave that had any leak, even if the player survived.
- Tracked via a simple `leakedThisWave: boolean` flag on `GameScene`, reset at wave start.
- UI feedback: a brief floating text in the center of the arena at wave end: **"PERFECT WAVE — +5% Security"** (same text-tween pattern as the existing gold-drop text).

### Why this shape

- **Perfect-wave regen rewards skill without being a hand-out.** Players who play sloppily can't recover via regen — they have to live with the damage. Players who play well can effectively bank security for the harder late waves.
- **The regen cap of 100% means regen never makes a player *safer than they started*.** It's a recovery mechanic, not a compounding one.
- **Not buying security with RP preserves the skill-expression nature of the meter.** The meta-progression layer still has plenty of power knobs (damage, speed, range, gold, crit, discounts) — security is the one skill-gated stat.

---

## Gameplay impact

- **Wave 1 (8 fast)**: one leak costs 5%. A "leaky but survivable" wave 1 (say 3 leaks) costs 15% and foregoes the perfect bonus — net −15%. Tight but not fatal. New players will feel the pressure compared to the current "lose 3 lives out of 100" (which is basically free).
- **Elite waves (3, 6, 9)**: one elite leak = 15%. Two elite leaks = 30%. Elite waves meaningfully threaten the run, matching their "medium-boss" design intent.
- **Wave 10 boss**: a boss leak is −90% → 10% remaining. Any additional leak on the same wave (e.g., a boss escort in endless) ends the run. In campaign the boss is the only spawn, so a boss leak is effectively "game over on the next mistake" — but that mistake rarely exists, so the leaked boss wave is *technically recoverable* (10% security + the run is over because wave 10 is the last). In endless, boss + escorts = a leaked boss usually ends the run.
- **Perfect-wave runs**: a player who never leaks gains +5% per wave, capped at 100%. Over 10 campaign waves that's +50% theoretical; in practice clamped whenever the player is already at 100%. The regen is a *recovery* tool, not a *growth* one — its value scales inversely with how well you're already playing.
- **Endless pressure**: the compounding late-wave enemy count ensures regen stops mattering around the difficulty wall. A wave-30+ player rarely scores a perfect clear, so regen quietly phases out — good. Nothing special needed in the endless config.

---

## Shop implications

- **Removed**: the `extraLives` upgrade is deleted from `UPGRADE_CONFIGS` in `src/config/upgrades.ts`, and `extraLives` is removed from the `ShopUpgrades` type.
- **Save-data migration**: existing saves with `extraLives` silently ignore the field (the `mergeWithDefaults` in `SaveManager.ts` only copies known keys). **Roarer Points already spent on `extraLives` are lost**, not refunded. That's acceptable — this is pre-release — but document it in a wave-0 patch note if there's a changelog surface.
- The shop drops from 10 rows to 9. `01-09-shop-progression.md` needs updating to reflect the new row count (or the empty slot gets filled by a future upgrade — separate decision).
- No other shop upgrades reference lives/security. `RunContext.startingLives` becomes `startingSecurity` and is a plain constant (`100`), no upgrade multiplier.

---

## UI

- **HUD**: replace the "Lives: N" text with "**Security: N%**" (or a simple bar + number). Minimum viable: just swap the format string; leave richer visualization for a polish pass.
- **Color threshold (optional polish)**: tint the security text red when `security <= 20` to give a clear low-security warning. Matches the `textDanger: '#ff4444'` color already in `COLORS`.
- **Perfect-wave feedback**: floating "PERFECT WAVE — +5% Security" text at wave end, using the existing `this.tweens.add` fade-and-rise pattern seen in `spawnGoldDropText` / `flashMessage`.
- **Game over screen**: existing "lives reach 0" language should read "security breached" or similar. One-line update to `GameOverScene` / `MainMenuScene` if they reference "lives" anywhere.

---

## Implementation pointers

- `src/config/gameplay.ts` — `STARTING_LIVES` → `STARTING_SECURITY = 100`.
- `src/config/enemies.ts` — rename `livesLostOnReach` → `securityLostOnReach` on `EnemyTypeConfig`. New values: `fast: 5`, `elite: 15`, `boss: 90`, `flying: 10`.
- `src/entities/Enemy.ts` — rename `livesLostOnReach` → `securityLostOnReach` on the instance. Keep the read through `ENEMY_CONFIGS[type].securityLostOnReach`.
- `src/scenes/GameScene.ts` —
  - Rename `this.lives` → `this.security`.
  - In `update()`, where an enemy reaches the castle: `this.security -= enemy.securityLostOnReach; if (this.security <= 0) { this.endRun('defeat'); }`.
  - Add `this.leakedThisWave: boolean`, reset to `false` in `onStartWave()` (and `resetState()`).
  - In the leak path, set `this.leakedThisWave = true`.
  - In `onWaveComplete()`, if `!this.leakedThisWave`, `this.security = Math.min(100, this.security + 5)` and spawn the "PERFECT WAVE" floating text.
  - The HUD setter call changes from `this.hud.setLives(this.lives)` to `this.hud.setSecurity(this.security)`.
- `src/ui/HUD.ts` — rename `setLives` → `setSecurity`, update the format string to `"Security: ${n}%"`.
- `src/systems/RunContext.ts` — remove `startingLives` entirely (no longer depends on shop), replace with a constant read of `STARTING_SECURITY`. Drop `extraLives` from the class. Remove its reference from the constructor.
- `src/config/upgrades.ts` — delete the `extraLives` entry from `UPGRADE_CONFIGS`.
- `src/types/save.ts` — remove `extraLives` from `ShopUpgrades` and from the default in `defaultSave()`. `mergeWithDefaults` in `SaveManager.ts` already tolerates missing/extra fields, so old saves don't break.
- `src/scenes/GameOverScene.ts`, `src/scenes/VictoryScene.ts`, `src/scenes/ShopScene.ts`, `src/scenes/StatsScene.ts` — scan for any string containing "lives" or "Lives" and replace with "Security"/"security". Result's `wavesCleared`, `enemiesKilled`, etc. stay the same.

---

## Not in scope for this spec

- Wave-scaled penalty (e.g., fast enemy doing 7% on wave 8) — rejected; flat-per-type is simpler and good enough.
- Security regen from any source other than perfect-wave clear.
- Shop upgrade replacing the deleted `extraLives` slot — left for a follow-up decision.
- Animated/bar-based security visualization — a polish pass, not needed for v1. The format-string swap is sufficient.
- Tutorial or UX text explaining the change to existing players — no live players yet.

---

## Assumptions to confirm

One intentional interpretation I've baked in: **"100% cleared" = zero enemies reached the castle during the wave.** Not "any wave the player survived." The stricter definition is what makes regen a skill reward. If the intent was the looser definition (regen after *every* survived wave), swap the condition in `onWaveComplete()` and drop the `leakedThisWave` tracking.
