# Enemy Bestiary

Single source of truth for every enemy type. Each entry has theme, stats, behavior, visual direction, design role, and counter strategy. Points back to `enemies.ts`, `waves.ts`, and `01-04`/`01-06` for numbers.

---

## Roster at a glance

| # | Name | Type ID | Lane | Base HP | Speed | Lives cost | Counter |
|---|---|---|---|---|---|---|---|
| 01 | **Worm** | `fast` | Ground | 20 | 3.0 tile/s | 10 | Any tower |
| 02 | **Trojan** | `elite` | Ground | 100 | 1.5 tile/s | 20 | Killswitch (focus), Firewall (chip) |
| 03 | **Zeroday** | `boss` | Ground | 500 | 1.0 tile/s | **999** | Everything you own |
| 04 | **Packet** | `flying` *(proposed)* | Air | 30 | 2.0 tile/s | 5 | **Killswitch only** |

"Base HP" is the reference stat in `enemies.ts`. Actual per-wave HP comes from `waves.ts` and always overrides base. Base is only used as a reference when tuning endless.

---

## 01 — Worm `fast`

### Theme
A self-replicating worm malware. The generic, cheap-to-produce threat. Think Conficker, ILOVEYOU. If the attacker is "the internet," this is what it throws when it's not trying very hard.

### Stat block

| Field | Value | Config source |
|---|---|---|
| `type` / `id` | `fast` / `worm` | `enemies.ts` |
| `baseHP` | 20 | `enemies.ts` |
| `speed` | 3.0 tiles/sec (fastest ground unit) | `enemies.ts` |
| `goldReward` | 5g | `enemies.ts` |
| `livesLost` on reach | 10 | `enemies.ts` |
| `color` | `0xB7FF00` Toxic Green | `visual-design-reference` |
| `radius` | 8 px | `enemies.ts` |

### Behavior
- Follows the shortest A* path from portal to castle.
- **Wobbles perpendicular to motion** (sine wave, ±2px at ~3Hz) — visual life.
- Has **3 trailing segments** in world space (not in the container) that lag behind with 0.3 lerp. Segments destroy on death.
- No special abilities. Pure throughput.

### Visual direction
- Thin, segmented, green. Looks vaguely biological — not a polygon, not a bug.
- Segments get progressively smaller (0.85, 0.70 scale) and more transparent (0.8, 0.6, 0.4 alpha).
- On hit: white-tint flash (100ms).
- On death: green particle burst (`worm-death` emitter).

### Role in design
- The **vocabulary enemy**. 80% of ground waves are worms. Wave count × HP per worm is the game's primary difficulty dial.
- Teaches placement (wave 1), teaches range (wave 4-5), tests DPS throughput at walls (wave 5, 13).
- Cheap goldReward + low HP = many-per-wave, high per-second gold when the player does well.

### Counter strategy
- **Firewall splash** is the optimal answer. 3-enemy splash turns Firewall L3's 19 DPS into ~57 DPS against worm clusters.
- Low HP means Killswitch L1 (20 dmg) one-shots them up to wave 2, and L2 (35 dmg) one-shots through wave 5.
- Worms follow the path → predictable choke points work.

### HP curve across campaign
From `waves.ts` (current) and `01-04`'s alternative table:

| Wave | Current `waves.ts` | Alt table |
|---|---|---|
| 1 | 50 | 40 |
| 2 | 70 | 65 |
| 4 | 100 | 95 |
| 5 | 140 | 135 |
| 7 | 200 | — (now flying) |
| 8 | 260 | 220 |
| 11 | 360 | 340 |
| 12 | 460 | — (now elite) |
| 13 | 600 | 440 |
| 14 | 600 | — (now flying) |
| 15 | 760 | — (now elite) |
| 17 | 960 | — (now gauntlet) |
| 18 | 1200 | 900 |

Endless base HP for scaling: **2400**. HP grows `1.20^(w-20)` beyond that.

---

## 02 — Trojan `elite`

### Theme
A trojan horse — looks harmless until it cracks open. Slow because it's carrying something heavy, armored because it's trying to survive long enough to deliver its payload. Theme-cousin of the Zeroday (both "something nasty inside").

### Stat block

| Field | Value | Config source |
|---|---|---|
| `type` / `id` | `elite` / `trojan` | `enemies.ts` |
| `baseHP` | 100 | `enemies.ts` |
| `speed` | 1.5 tiles/sec (half worm speed) | `enemies.ts` |
| `goldReward` | 5g | `enemies.ts` |
| `livesLost` on reach | 20 (2× worm) | `enemies.ts` |
| `color` | `0xFF6B35` Hot Orange | `visual-design-reference` |
| `radius` | 12 px | `enemies.ts` |

### Behavior
- Follows A* path like worms.
- **Rotating shield overlay** at 0.3 alpha, one full rotation every 8 seconds.
- **Glitch stutter**: every 2–3 seconds, jitters ±2px for 50ms. Visual flavor only — doesn't affect pathing or hitboxes.
- No actual damage reduction or shield mechanic — the "armor" is pure HP.

### Visual direction
- Bulkier than worms, **roughly hexagonal silhouette** (6-sided "package" shape, per
  `02-01` §3) with a rotating outer-hexagon ring at 20% opacity around it.
- Hot orange says "warning, slow, dangerous" without being red (which is reserved for Zeroday).
- Glitch stutter should be subtle — on hit, the stutter is ambient motion, the hit flash is the real feedback.

### Role in design
- The **focus-fire test**. Players with only spray tools (L1 splash everywhere) get ground down. Players with Killswitch snipers burn trojans fast.
- Introduced wave 3 at low count (3 enemies) so players learn "these take longer to kill." First stress test is wave 6 (4 enemies at 420 HP).
- Boss waves are technically elites at extreme HP — mini-boss archetype uses trojan stats for waves 9 and 19.

### Counter strategy
- **Killswitch L2+ is the clean answer.** L2 35-damage shots drop trojans in 3–6 shots vs. Firewall's 12+ shots.
- Firewall still valuable for chip damage while snipers focus, and for when trojans cluster.
- Live placement tip: put Killswitches where trojans spend the most time (long straight stretches of path), not at the portal entrance.

### HP curve across campaign

| Wave | Current | Alt |
|---|---|---|
| 3 | 240 | 220 |
| 6 | 440 | 420 |
| 9 | 700 | 1100 (mini-boss) |
| 13 | 1100 | 440 → *not elite in alt* |
| 16 | 1600 | — |
| 19 | 2400 | 2400 (mini-boss) |

Endless base HP: **4800**.

---

## 03 — Zeroday `boss`

### Theme
An unknown vulnerability — a "zero-day" exploit with no patch. In cybersec this is the nightmare: the thing nobody's prepared for. It's slow, it's huge, and if it reaches you, you're done.

### Stat block

| Field | Value | Config source |
|---|---|---|
| `type` / `id` | `boss` / `zeroday` | `enemies.ts` |
| `baseHP` | 500 (multiplied 4–20× in campaign) | `enemies.ts` |
| `speed` | 1.0 tiles/sec (slowest) | `enemies.ts` |
| `goldReward` | 5g — intentionally low, you don't farm the boss | `enemies.ts` |
| `livesLost` on reach | **999** (instant game over) | `enemies.ts` |
| `color` | `0xFF2E63` Threat Red | `visual-design-reference` |
| `radius` | 18 px | `enemies.ts` |

### Behavior
- Follows A* path.
- **Pulsing aura sprite** underneath core (animated frames).
- **Core pulse animation** every 500ms (scale 1.0 → 1.15 → 1.0).
- **Glow postFX** at `0xFF3CF2` (magenta), radius 6px.
- **Screen shake on spawn** (300ms, 0.003 intensity).
- **Camera shake + flash on death** (300ms / 0.005 shake, 50ms white flash).

### Visual direction
- Pulsing red/magenta orb. Feels like it's about to crack open.
- The glow and pulse must make it unmistakable — players should instantly know "this is the boss."
- Death should be celebratory — flash, shake, particle explosion. The player just won.

### Role in design
- The **arc climax**. Every 10th wave (10, 20 in campaign; every 5th wave in endless starting wave 25).
- `livesLost: 999` means a leak is an instant loss, no recovery. This is intentional — bosses are solvable puzzles, not attrition fights.
- Tests the player's *total loadout* — you can't solo a boss with one tower type.

### Counter strategy
- **Total DPS pool matters more than any single tower.** See `01-06`'s boss-solve analysis.
- Killswitch L3 + max shop is the single best anti-boss unit (74.5 DPS).
- Firewall splash is wasted on a lone boss, but *still contributes its single-target damage* (~20 DPS at L3 max).
- **Chokepoint placement** extends the boss's time-in-range — critical for late-campaign bosses.

### HP curve

| Wave | Current | Alt |
|---|---|---|
| 10 | 2400 | 2200 |
| 20 | 10000 | 9000 |

Endless base HP: **10000 × 2.5** (the ×2.5 boss multiplier on top of the 1.20^(w-20) curve). Flagged: wave 20 boss HP may be uncleanable even with max shop — see `01-06` balance notes.

### Gotchas / engineering notes
- Glow FX is added with `this.postFX.addGlow(...)` in the constructor — runs per-boss. Fine for 1 boss on screen; would need pooling if multiple bosses ever coexist.
- `pulseTimer` must be destroyed in `cleanup()` to prevent ghost tweens after death.
- Screen shake on spawn can disorient players building last-second — shake duration 300ms is intentionally short.

---

## 04 — Packet `flying` *(proposed, not yet implemented)*

### Theme
A network packet. Small, fast, routed at higher levels of the stack. Flies above the grid because it travels through network layer 3 — your ground towers (firewall, application-layer) can't reach it. You need a packet sniffer / deep-inspection tool: the Killswitch.

**Naming alternatives:** Ping, Drone, Bot, Payload, Signal. "Packet" fits cleanest alongside Worm/Trojan/Zeroday (all real security terms).

### Stat block (proposed)

| Field | Value | Rationale |
|---|---|---|
| `type` / `id` | `flying` / `packet` | Consistent with existing pattern |
| `baseHP` | 30 | Killswitch L2 (35 dmg) one-shots. L1 (20 dmg) two-shots. |
| `speed` | 2.0 tiles/sec | Slower than worm (3.0) — straight-line path makes up the gap |
| `goldReward` | 5g | Match other enemies |
| `livesLost` on reach | 5 | Half a worm — they're supposed to be fragile, leaks should sting but be recoverable |
| `color` | `0xFF3CF2` Neon Magenta or `0x3A86FF` Holo Blue | Pick one; magenta screams "threat," holo-blue feels technical |
| `radius` | 8 px | Same as worm |

### Behavior (design contract — not yet coded)
- **Straight-line movement** from spawn point to nearest castle tile. No A*, no pathfinding.
- **Ignores the grid.** Towers don't block them; they fly over.
- **Rendered at depth 25+** (above towers at depth 10) so they visibly pass over.
- Optional: small shadow on the ground beneath, low alpha, to read "this thing is airborne."
- **Only Killswitch targets them.** Firewall's targeting loop skips flying enemies.

### Visual direction
- Small, sharp, fast. Not biological like the worm — geometric, digital.
- Ideas: a glowing chevron with motion trail. A circuit-node with antenna. A mini-drone silhouette.
- Motion trail should be *longer* than the worm's — emphasizes speed.
- On hit: same white flash as other enemies for consistency.
- On death: short magenta burst, no lingering particles (they die too often for big effects).

### Role in design
- The **strategic gate between splash and sniper**. Forces dual-tower builds.
- Without flying enemies, a player can win the campaign with pure Firewall splash. Flying makes sniper investment *necessary*, not just optional.
- Also: visual variety. Three ground enemies all pathing the same route gets stale.

### Counter strategy
- **Killswitch, any level.** Firewall is useless against flying.
- Placement matters more than usual: snipers need 4-tile range coverage across the straight flight path from each portal. Three portals means three straight lines — a central sniper can cover all three if placed along the x-axis mid-grid.
- High count at low HP means spawn interval matters more than HP — tight snipers (short cooldown = L2/L3) beat long-range kit.

### HP curve (from `01-04` alt table)

| Wave | HP | Count | Notes |
|---|---|---|---|
| 7 (First Flight) | 35 | 12 | Teach wave. L1 sniper 2-shots. |
| 14 (Flight Swarm) | 140 | 22 | Stress test. L2 sniper 4-shots. |
| 18 (Flight + Ground) | 220 | 12 | Mixed with ground swarm. L3 sniper 4-shots. |

### Implementation dependencies (code work required)
Not in the code yet. See `01-04`'s implementation pointers for the full list. Blockers for using Packet in a wave:
1. `EnemyType` union must include `'flying'`
2. `Enemy.update()` must branch for straight-line motion
3. `Tower.update()` must skip flying enemies when `towerType === 'splash'`
4. `EnemyTextures.ts` must generate the flying sprite
5. UX signal: tooltip or visible air-altitude cue (otherwise players think splash towers are broken)

---

## Cross-cutting design notes

### Gold reward is flat at 5g across all enemies
Intentional. Rewarding players more for killing a boss would make bosses a farm target and let them over-buy for the next wave. Flat gold keeps the economy predictable and difficulty driven by wave-by-wave throughput.

### Lives lost scales with threat
Worm 10 / Packet 5 / Trojan 20 / Zeroday 999. Leaks feel proportional — losing a worm is recoverable, losing a trojan stings, losing the boss ends the run.

### Enemies never de-path
Once an enemy has been assigned a path (via `setPath()` in `Enemy`), it doesn't recompute when towers are placed or sold. New enemies use the current path; in-flight enemies finish their original one. This is intentional — live re-pathing would feel glitchy and break the placement puzzle.

### Visual consistency rules (from `visual-design-reference`)
- All enemies use warm tones (green/orange/red/magenta). Towers use cool tones (cyan/blue). TRON brightness rule applies.
- Hit flash is always 100ms white tint on the body sprite, consistently across all enemy types.
- Death emits a particle burst; the key is type-specific but the *pattern* (burst, fade, done) is shared.

---

## Future roster ideas (out of hackathon scope)

If endless mode ever needs more variety than the current 3 (+1 flying) types, here are candidates that fit the theme without overlapping:

| Working name | Theme | Role | Mechanic |
|---|---|---|---|
| **Botnet** | Coordinated swarm | Fast, spawns in bursts of 5 | Split-on-death or wave-leader |
| **Ransomware** | Slow, armored | Elite variant | "Freezes" a tower in range for 2s |
| **Phisher** | Disguised | Fast + tricky | Invisible for 50% of path |
| **DDoS** | Overwhelming | Ultra-light | Spawns 40+ in one burst, ultra low HP |
| **APT** | Persistent threat | Mini-boss | Regenerates HP if not hit for 3s |

None of these are planned — just theme-consistent extensions if the game grows.

---

## Implementation pointers

- **Stats live in `src/config/enemies.ts`** as `ENEMY_CONFIGS`. Adding a type = add the union member + config entry.
- **Visuals live in `src/entities/Enemy.ts`** as `createWorm`/`createTrojan`/`createZeroDay` methods. Adding a type = new `createXxx` + branch in constructor.
- **Textures live in `src/assets/textures/EnemyTextures.ts`**, drawn procedurally at scene boot.
- **Per-wave HP in `src/config/waves.ts`** — `enemyHP` overrides `baseHP` always.
- **Endless HP scaling in `src/config/endless.ts`** — uses the `getEndlessHP(baseHP, wave)` formula. Base values for endless are hardcoded in `generateEndlessWave()`, not pulled from `enemies.ts`.
