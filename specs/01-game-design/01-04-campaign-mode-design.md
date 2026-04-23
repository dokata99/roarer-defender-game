# Campaign Mode Design Playbook

Design reference for authoring the 20 campaign waves in `src/config/waves.ts`. Unlike endless (which is formulas), campaign is *hand-tuned* — each wave is a deliberate beat. This doc is the playbook + one concrete alternative table.

See `01-03-endless-mode-design.md` for the endless counterpart.

---

## What campaign is for

Campaign is the player's **first and complete** experience. It has to do four things at once:

1. **Teach** — progressively introduce towers, enemy types, upgrading, and pathing strategy without tutorials.
2. **Test** — each arc ends with a difficulty check that validates the player has learned the mechanic.
3. **Unlock** — beating wave 20 permanently unlocks endless. This has to feel earned but reachable.
4. **Fit a session** — a full run should take **15–25 minutes** so players will try again after losing.

If campaign takes 45 minutes, players who lose at wave 17 won't retry. If it takes 8 minutes, the unlock is meaningless.

---

## Arc structure (5-wave arcs)

The wave budget is already grouped into four 5-wave arcs. Each arc should have a **theme** and a **wall**.

| Arc | Waves | Theme | Wall at |
|---|---|---|---|
| Arc 1 | 1–5 | **Tutorial + first wall** | Wave 5 (first real swarm) |
| Arc 2 | 6–10 | **Upgrade pressure** | Wave 10 (first boss) |
| Arc 3 | 11–15 | **Strategy required** | Wave 13 (first hard elite push) |
| Arc 4 | 16–20 | **Max investment** | Wave 20 (final boss) |

**Inside every arc, pace = teach → ease → test → breathe → wall.** If wave N introduces something, wave N+1 should be slightly easier so the player has time to absorb before being tested.

---

## Wave archetypes

Pick one archetype per wave. Don't repeat the same archetype more than twice in a row — that's what causes the "samey" feeling mid-campaign.

| Archetype | Shape | Use for |
|---|---|---|
| **Tutorial Swarm** | 8–10 fast, slow interval (0.9s+), low HP | Wave 1 only |
| **Basic Swarm** | 12–20 fast, medium interval (0.6–0.8s) | Filler between elite/boss waves |
| **Rush Swarm** | 25+ fast, tight interval (0.4–0.5s), lower HP | Arc walls; tests DPS throughput |
| **First Elite** | 3 elite, generous interval (1.8s+) | Introduce elite concept (wave 3) |
| **Elite Push** | 4–6 elite, tight interval (1.2–1.6s) | Mid-arc tests; punishes pure splash |
| **Mixed Assault** | Fast swarm + small elite pack | Arc 3–4 variety; uses `WaveDefinition[]` |
| **Gauntlet** | Two back-to-back archetypes (no breather) | Rare — once per campaign max |
| **Mini-Boss** | 1–2 elites with inflated HP | Telegraphs the real boss one wave later |
| **Boss** | 1 boss, no other spawns | Wave 10, wave 20 |
| **Boss + Escort** | 1 boss + light fast escorts | Alternative to pure boss for late endless flavor (skip for campaign) |
| **Flight Swarm** | 10–20 flying, low HP, straight-line path | Forces sniper investment; splash can't hit |
| **Flight + Ground** | Flying enemies during a ground swarm | Late-campaign pressure; tests dual-tower loadout |

---

## Flying enemies (air lane)

A fourth enemy type sits alongside fast / elite / boss: **flying**. Design contract:

- **Straight-line path** from portal to nearest castle tile. No A*, ignores towers on the grid.
- **Low HP, moderate speed.** Fragile but unblockable — the speed pays for the shortcut.
- **Sniper-only damage.** The splash tower (Firewall) cannot target flying; only the sniper tower (Killswitch) hits them. This is the core strategic hook.
- **Rendered above grid.** Drawn at a higher depth than towers, with a shadow below.

### Suggested stats (working name: *Packet* — fits the cyber theme alongside Worm/Trojan/Zeroday)

| Stat | Value | Why |
|---|---|---|
| `baseHP` | 30 | A L2 sniper (35 dmg) one-shots. A L1 sniper (20 dmg) two-shots. |
| `speed` | 2.0 tiles/sec | Slower than worm (3.0). Straight-line path makes this feel faster in practice. |
| `goldReward` | 5 | Match other enemies. |
| `livesLost` | 5 | Lower than worm (10) — they're fragile, losing a few should sting but not defeat. |
| `color` | magenta / cyan | Visually distinct from ground enemies. |
| Altitude | +depth vs. towers | Visual "these are in the air" read. |

### Design rules for flying waves

1. **Never introduce flying without warning.** First flying wave must be pure-flying and low count, so the player sees "my firewall isn't firing" clearly. Don't mix with ground on the introduction.
2. **Never gate wave 10 boss behind flying.** The first boss should be winnable with pure-splash builds. Flying punishes pure-splash *before* the boss, not at it.
3. **Dual-tower gate.** After the intro, every 4–6 waves should include some flying pressure so splash-only builds fall off. Don't let a player reach wave 20 without ever having been punished for ignoring sniper.
4. **Flying-only waves are short.** Straight-line path + fragile HP = fast wave. Keep count 10–25; don't pad to 40+ or the wave becomes a bullet-time drill.

---

## Design principles

1. **Every 5th wave has a distinct identity.** Wave 5 is the first arc-wall, wave 10 is the first boss, wave 15 is the "strategy confirmed" moment, wave 20 is the final. Never bury them in routine waves.
2. **Introduce a mechanic one wave before its first stress test.** Wave 3 introduces the elite at low density (3 enemies). Wave 6 is the first wave that *punishes* not upgrading.
3. **Gold math drives difficulty, not HP bloat.** Between wave N and N+1, the player kills ~20 enemies ≈ 100 gold. They need enough to buy one meaningful upgrade. If HP outpaces this, upgrades stop feeling useful.
4. **Boss waves start with a free breath.** The player gets a long build phase going into wave 10/20 (no pressure to sell/replace). Boss fights should feel ceremonial.
5. **Difficulty spikes align with shop unlock pacing.** A fresh campaign player has 0 shop upgrades; waves 1–10 must be beatable with 0 shop upgrades. Waves 11–20 can require light shop investment from prior runs.
6. **Never stack two walls in a row.** Wave 5 and wave 6 can't both be walls. Same for 9–10 (boss prep) and 19–20 (final prep).
7. **Air lane is a strategic gate, not a surprise tax.** Flying waves must reward sniper investment, not punish the player who hasn't had time to build one. First flying wave comes *after* the player has had one full arc to diversify towers (wave 7, not wave 3).

---

## Budget math (reference)

Before tuning any wave, know roughly what the player has spent and earned:

| By end of wave | Cumulative gold earned | Likely tower loadout |
|---|---|---|
| Wave 1 | ~50 | 1–2 towers, all L1 |
| Wave 3 | ~135 | 3–4 towers, 1 upgrade |
| Wave 5 | ~250 | 5 towers, mixed L1/L2 |
| Wave 10 (pre-boss) | ~580 | 5–7 towers, several L2, maybe one L3 |
| Wave 15 | ~1000 | Full loadout, L2+ across the board |
| Wave 20 (pre-boss) | ~1500+ | Near-max with some L3 |

Assumes 5g per kill, no leaks, no upgrades/sell-refund shenanigans. Shop upgrades (carried over between runs) add 10–30% damage and speed on top, which matters from wave 11+.

---

## Difficulty targets per arc

| Arc | First-time-player (no shop upgrades) | Experienced (some shop) |
|---|---|---|
| Arc 1 (1–5) | Should clear 100% of the time | Trivial |
| Arc 2 (6–10) | 60–70% clear | Should clear |
| Arc 3 (11–15) | 30–40% clear | ~80% clear |
| Arc 4 (16–20) | <10% clear | 50–70% clear |

If first-run players are clearing the whole campaign, it's too easy and endless will feel cheap. If they die at wave 6 repeatedly, the shop grind loop never activates.

---

## Concrete alternative wave table

This is an alternative to the current `CAMPAIGN_WAVES` in `waves.ts`. Each row has an intent so you can swap freely without losing the design reason.

| # | Archetype | Type | Enemy | Count | HP | Interval | Intent |
|---|---|---|---|---|---|---|---|
| 1 | Tutorial Swarm | normal | fast | 8 | 40 | 0.95 | Teach placement. Low stakes. |
| 2 | Basic Swarm | normal | fast | 14 | 65 | 0.80 | Stakes real but forgiving. |
| 3 | First Elite | elite | elite | 3 | 220 | 1.90 | Introduce elite concept. |
| 4 | Basic Swarm | normal | fast | 16 | 95 | 0.70 | Recovery after elite. Gold beat. |
| 5 | **Rush Swarm** | normal | fast | 24 | 135 | 0.55 | Arc-1 wall. Tests DPS throughput. |
| 6 | Elite Push | elite | elite | 4 | 420 | 1.60 | First wave that punishes no-upgrade. |
| 7 | **First Flight** | normal | flying | 12 | 35 | 0.85 | **Introduce flying.** Pure, low count — player sees "firewall isn't firing." Teach moment. |
| 8 | **Mixed Assault** | normal+elite | mixed | 20 fast + 2 elite | 220 / 500 | 0.55 / 2.0 | Ground archetype — teach triage. |
| 9 | Mini-Boss | elite | elite | 2 | 1100 | 2.0 | Telegraphs boss. Requires focus fire. |
| 10 | **Boss** | boss | boss | 1 | 2200 | 0 | First boss. Ceremonial. |
| 11 | Basic Swarm | normal | fast | 32 | 340 | 0.45 | Reset pacing after boss. |
| 12 | Elite Push | elite | elite | 5 | 1000 | 1.40 | Raise elite bar. |
| 13 | **Rush Swarm** | normal | fast | 40 | 440 | 0.38 | Arc-3 wall. Spawn floor test. |
| 14 | **Flight Swarm** | normal | flying | 22 | 140 | 0.50 | Stress-test flying. Punishes splash-only builds; rewards players who upgraded snipers. |
| 15 | Elite Push | elite | elite | 6 | 1500 | 1.20 | Mid-campaign elite climax. |
| 16 | Basic Swarm | normal | fast | 42 | 720 | 0.35 | Breather before final arc. |
| 17 | **Gauntlet** | normal+elite | mixed | 30 fast + 6 elite | 800 / 1700 | 0.30 / 1.0 | Only gauntlet in campaign. Real pressure. |
| 18 | **Flight + Ground** | normal+flying | mixed | 30 fast + 12 flying | 900 / 220 | 0.32 / 0.8 | Dual-lane pressure. Splash holds the ground, snipers must clear the air. |
| 19 | Mini-Boss | elite | elite | 8 | 2400 | 0.9 | Final breath. Telegraphs boss scale. |
| 20 | **Final Boss** | boss | boss | 1 | 9000 | 0 | Victory moment. Tests everything. |

### Swap variants (for variety across playtests)

- **Easier opening** — reduce wave 5 count to 20, HP to 110. Lets weaker players reach wave 6.
- **Harder boss** — wave 20 HP to 12000 + add 15 fast escorts at 400 HP. Only for experienced-player mode.
- **Remove mixed waves** — if `WaveManager.startWave()` doesn't interleave spawns well in practice, collapse waves 8, 14, 17 into single-type archetypes.

---

## Playtest signals

| Signal | Likely cause | Tuning move |
|---|---|---|
| >80% of first runs die at wave 5 | Arc-1 wall too steep | Reduce wave 5 count or HP |
| Players consistently hit wave 10 with full lives | Arc 2 lacks pressure | Add a wave-8 rush spike |
| Wave 10 boss dies in <8 seconds | Boss HP too low | Bump HP 20%, keep spawn interval 0 |
| Players only use one tower type | Archetype variety too low | Shift waves 8/14 to mixed assault |
| Players quit mid-campaign on loss | Campaign feels too long | Trim waves 11–14 (flattest stretch) |
| Wave 20 boss feels anticlimactic | Build-up missing | Make wave 19 a mini-boss, not a swarm |
| Endless feels cheap after campaign | Campaign wall was trivial | Strengthen wave 15 and wave 19 |
| Players leak 100% of wave 7 flying | Flying too fast or too many, or sniper not affordable by wave 7 | Drop flying count to 8, HP to 25, or push intro to wave 8 |
| "Why isn't my firewall shooting?" complaints after wave 7 | Missing visual signal for sniper-only | Add tooltip / altitude-icon design note for code phase |
| Players still splash-spam by wave 14 | Wave 7 didn't teach | Increase wave 7 count slightly, or make wave 14 harder |

---

## Implementation pointers

- **All waves live in `CAMPAIGN_WAVES` in `src/config/waves.ts`** — one array of 20 entries. Edit in place; no other file touches needed for pure tuning.
- **Mixed waves** — `WaveManager.getWaveDefinitions(n)` returns a single entry per wave today, but the manager accepts `WaveDefinition[]` and concatenates spawn queues. To add a mixed wave, change `getWaveDefinitions` to return multiple defs for that wave number. Current endless code (`endless.ts`) already does this as reference.
- **Spawn interleaving** — mixed waves today spawn all of the first def, then all of the second (not interleaved). For true interleaving, change `WaveManager.startWave()`'s queue-build loop.
- **`MAX_CAMPAIGN_WAVES`** — the campaign length cap lives in `src/config/constants.ts` as the `CAMPAIGN_WAVES` number constant (currently 20). If you want more/fewer waves, update both this constant and the array.
- **Portal rotation** — enemies cycle across the 3 portals round-robin. You don't need to think about this when designing a wave; it's automatic.
- **`livesLost`** — boss deals 999 on reach → any leak on wave 10 or 20 is instant defeat. Don't design boss waves assuming recoverable leaks.
- **`enemyHP` is absolute, not a multiplier** — the number in `waves.ts` is the final HP the enemy spawns with. It overrides `baseHP` from `enemies.ts`.

### Adding flying enemies (code work required before using the flying wave rows above)

Flying is not supported by the current codebase. These files need changes before waves 7 / 14 / 18 above will work:

1. **`src/config/enemies.ts`** — add `'flying'` to the `EnemyType` union and a corresponding `ENEMY_CONFIGS.flying` entry with the stats from the Flying Enemies section.
2. **`src/entities/Enemy.ts`** — branch in the constructor for `type === 'flying'` to create a new visual (drone/packet sprite, optional shadow below). In `update()`, if `type === 'flying'`, skip `gridPath` entirely and move in a straight line from spawn position to the nearest castle tile's pixel position. Render depth should be above towers (depth ≥ 25; towers are 10).
3. **`src/entities/Tower.ts`** — in `Tower.update()`'s target loop, skip flying enemies when `this.towerType === 'splash'`. Only the sniper targets them.
4. **`src/config/waves.ts`** — no structural change. `enemyType: 'flying'` in a `WaveDefinition` will just work once steps 1–3 are done.
5. **`src/systems/PathfindingManager.ts`** — no change needed. Flying enemies bypass pathfinding; ground pathfinding stays authoritative for the rest.
6. **`src/assets/textures/EnemyTextures.ts`** — add a procedural texture generator for the flying sprite so `AssetFactory.generateAll` produces it.
7. **UX signal (optional but recommended)** — small "AIR" or altitude icon above flying enemies, and/or a muted range ring around splash towers when a flying enemy is in range but not targeted. Prevents the "why isn't my firewall shooting?" confusion from the playtest signals table.
