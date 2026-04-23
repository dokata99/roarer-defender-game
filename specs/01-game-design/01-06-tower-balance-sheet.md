# Tower Balance Sheet

Concrete DPS / cost / time-to-kill math for both towers, across all levels and shop-upgrade tiers. This is the reference you check **before** tuning wave HP or count numbers. Without this, `01-04`'s wave table is guesses.

Source of truth for base stats: `src/config/towers.ts`, `src/config/enemies.ts`, `src/systems/UpgradeManager.ts`.

---

## Base tower stats (no shop upgrades)

### Firewall (splash) — `0x00E5FF`

| Level | Cost | Cumulative | Damage | Interval | DPS | Range | Splash radius |
|---|---|---|---|---|---|---|---|
| L1 | 10g | 10g | 5 | 0.83s | **6.02** | 2.5 | 1.0 |
| L2 | 15g | 25g | 8 | 0.71s | **11.27** | 2.5 | 1.2 |
| L3 | 25g | 50g | 12 | 0.63s | **19.05** | 2.5 | 1.5 |

### Killswitch (sniper) — `0x3A86FF`

| Level | Cost | Cumulative | Damage | Interval | DPS | Range | Splash |
|---|---|---|---|---|---|---|---|
| L1 | 15g | 15g | 20 | 2.0s | **10.00** | 4.0 | — |
| L2 | 20g | 35g | 35 | 1.67s | **20.96** | 4.0 | — |
| L3 | 30g | 65g | 55 | 1.43s | **38.46** | 4.0 | — |

**Key takeaway:** Killswitch wins raw single-target DPS at every level. Firewall wins whenever splash connects on ≥2 enemies (becomes 12–22 DPS L1, 22–45 DPS L2, 38–76 DPS L3 with 2–4 enemies in the splash zone).

---

## Shop upgrade multipliers

From `UpgradeManager.ts`:

| Shop upgrade | Per level | Max level | Max multiplier |
|---|---|---|---|
| Tower Damage+ | +10% damage | 5 | ×1.50 damage |
| Tower Speed+ | ×0.95 attack interval | 5 | ÷0.774 interval ≈ ×1.29 rate |
| Discount Upgrades | ×0.90 upgrade cost | 3 | ×0.729 upgrade cost |
| Extra Lives | +20 lives | 5 | +100 lives |

**Combined DPS multiplier at max:** 1.50 × 1.29 = **×1.938** on listed DPS.

---

## DPS with max shop upgrades (damage 5 / speed 5)

| Tower | L1 DPS | L2 DPS | L3 DPS |
|---|---|---|---|
| Firewall (single target) | 11.67 | 21.84 | **36.92** |
| Firewall (3 enemies splash) | 35.01 | 65.51 | **110.75** |
| Killswitch | 19.38 | 40.62 | **74.53** |

---

## Cost to full-build a tower (L1 → L3)

| Tower | No discount | With Discount ×1 (10%) | Discount ×2 (19%) | Discount ×3 (27.1%) |
|---|---|---|---|---|
| Firewall total | 50g | 46g | 42g | **39g** |
| Killswitch total | 65g | 60g | 56g | **52g** |

Discount applies **only to upgrades** (L1 → L2 → L3), not the initial placement cost.

---

## DPS per gold (efficiency)

Higher = more damage per gold invested. Calculated on cumulative cost, no discount.

| Tower, Level | Cumulative cost | Base DPS | Max-upgrade DPS | DPS/g (max) |
|---|---|---|---|---|
| Firewall L1 | 10g | 6.02 | 11.67 | 1.167 |
| Firewall L2 | 25g | 11.27 | 21.84 | 0.874 |
| Firewall L3 | 50g | 19.05 | 36.92 | 0.738 |
| Killswitch L1 | 15g | 10.00 | 19.38 | 1.292 |
| Killswitch L2 | 35g | 20.96 | 40.62 | 1.161 |
| Killswitch L3 | 65g | 38.46 | 74.53 | 1.147 |

**Takeaways:**
- **L1 towers are the most gold-efficient** (more spam = more DPS/g). Upgrading is a *density* play, not an efficiency play — it lets you concentrate DPS where splash overlaps or where range matters.
- **Killswitch L1 is the single best DPS/g in the game.** Early-game spam strategy is valid.
- **Firewall only wins against groups** — the 3-enemy-splash column roughly 3× its listed DPS, making L3 Firewall effectively 110+ DPS against swarms. Against a boss, Firewall L3 is worse than Killswitch L3.

---

## Time-to-kill reference (seconds) — single tower vs. single enemy

Against the HP numbers in `01-04`'s concrete wave table, no shop upgrades.

| Wave | Enemy HP | Firewall L1 | Firewall L3 | Killswitch L1 | Killswitch L3 |
|---|---|---|---|---|---|
| 1 | 40 | 6.6 | 2.1 | 4.0 | 1.0 |
| 3 (elite) | 220 | 36.5 | 11.5 | 22.0 | 5.7 |
| 5 | 135 | 22.4 | 7.1 | 13.5 | 3.5 |
| 6 (elite) | 420 | 69.7 | 22.0 | 42.0 | 10.9 |
| 10 boss | 2200 | 365.2 | 115.5 | 220.0 | 57.2 |
| 13 rush | 440 | 73.1 | 23.1 | 44.0 | 11.4 |
| 15 elite | 1500 | 249.1 | 78.7 | 150.0 | 39.0 |
| 20 boss | 9000 | 1495.8 | 472.4 | 900.0 | 233.9 |

**Sanity check:** an enemy travels the 13-column grid in `13 / speed` seconds. Fast enemies (speed 3.0) take ~4.3s. Bosses (speed 1.0) take ~13s. Any cell shown above **greater than the travel time** means a single tower of that level cannot solo that enemy. That's most of the table — which is correct. The game is about *combined DPS across multiple towers*.

---

## Boss-solve analysis (the important one)

Wave 10 boss (2200 HP) and wave 20 boss (9000 HP) are the solvability gates. Here's the math.

A boss in range of a tower for `t` seconds takes `DPS × t` damage. Assume centrally-placed towers cover ~8 seconds of the boss's 13-second journey (conservative — chokepoints can push this to 10–12).

### Wave 10 boss — 2200 HP
- DPS needed (8s window): 275 DPS
- Killswitch L3 max: 74.5 DPS → need **4 towers** minimum
- Killswitch L3 no shop: 38.5 DPS → need **8 towers**
- Realistic mid-upgrade player (damage 2 / speed 2 = ×1.33) with 4 Killswitch L3: 4 × 51.1 = 204 DPS × 8s = 1634 damage — **insufficient**, would leak partial boss HP if not supplemented by Firewalls. But splash Firewalls add 20–40 DPS each on the boss with no splash benefit. Realistic: 4 Killswitch L3 + 3 Firewall L3 = (4 × 51) + (3 × 25) = 279 DPS × 8s = 2232 damage. **Marginally clears.**

### Wave 20 boss — 9000 HP
- DPS needed (8s window): 1125 DPS
- Killswitch L3 max (74.5 DPS): need **~15 towers** in the 8s range window
- With choke-point placement (12s window): need **~10 Killswitch L3 max**
- Realistic: 8 Killswitch L3 + 6 Firewall L3, all max-shop = 8 × 74.5 + 6 × 36.9 = 596 + 221 = 817 DPS × 10s (choke) = 8170 damage — **insufficient by ~900 HP**

**This is a red flag.** Wave 20's 9000 HP is probably tuned too high for the current tower/shop ceiling, even with perfect play. Options:
- Lower boss HP to 7500 (gives ~15% safety margin)
- Or raise the shop damage cap beyond +50%
- Or add a boss-specific slow/debuff mechanic
- **Playtest before deciding** — chokepoint placement and re-targeting could push the effective window to 14–16s, which changes everything

Wave 10 boss at 2200 HP is right on the edge — that's probably *correct* for an arc-2 boss (should feel hard), but if playtests consistently leak it, drop to 1900.

---

## Gold economy check

From `01-04`'s budget table, the player has ~580g cumulative by end of wave 10. That buys:

- **Option A (splash-heavy):** 8 Firewall L3 = 400g. Leaves 180g for 3 L1 Killswitches (45g) and replacement/re-roll.
- **Option B (sniper-heavy):** 6 Killswitch L3 = 390g. Leaves 190g for 4 L1 Firewalls (40g) and replacement.
- **Option C (mixed):** 4 Firewall L3 + 4 Killswitch L3 = 200 + 260 = 460g. Leaves 120g for L1 fillers.

All three options fit inside the 580g budget. Wave 10 boss math above shows **Option C (mixed) is the safest** — aligns with the dual-tower design goal. Splash-only builds can just barely clear wave 10 but will wall hard at waves 7/14 (flying) without any snipers.

---

## Open balance questions (flag before hackathon)

1. **Wave 20 boss HP ceiling.** Current 9000 HP may be unclearable even with max shop + perfect play. Consider dropping to 7500–8000 or revisiting after playtest.
2. **Firewall splash radius 1.5 at L3** — does splash actually connect on 2–4 enemies at typical spacing? If enemies spread out, splash DPS drops toward single-target DPS. Worth measuring in playtest.
3. **Killswitch L1 DPS/g is the game's best ratio.** Spam-L1-Killswitch may be the dominant strategy. Either intended (players self-correct for range coverage) or a balance issue that deserves a density check: how many L1 Killswitches actually fit within range of a choke point?
4. **Shop Tower Damage+ (+10%) vs. Tower Speed+ (×0.95 interval).** Speed is slightly stronger per level (the compounding makes it ×1.29 at max vs. damage ×1.50 — but speed also reduces overkill waste). If one upgrade is never bought, rebalance.
5. **Discount Upgrades caps at 3 levels for −27%.** Mostly cosmetic — saves ~14g over a full 3-tower build. If players ignore it, consider merging with another upgrade or boosting to 5 levels × 15% off.

---

## How to use this sheet when tuning waves

1. Decide how many towers a player realistically has at wave N (use the budget table).
2. Pick a representative DPS from the realistic upgrade tier (mid-run = damage 2 / speed 2 ≈ ×1.33 base DPS).
3. Assume ~6–8 seconds of effective fire time per enemy transit.
4. That's the **HP ceiling** a single enemy can survive without leaking.
5. For swarm waves, divide the total DPS pool by spawn interval to get the per-enemy time-window, then size HP to fit.

Example: wave 13 rush swarm. 40 fast enemies at 0.38s spawn interval. Player has ~6 Killswitch L3 (DPS 38.5 base, 51 with mid-shop) = ~306 DPS pool. Each enemy gets roughly 306 × (0.38s × 40 enemies / 40 enemies) ≈ 116 damage budget before the next is in the priority queue. **Conclusion:** HP 440 in wave 13 expects the player to *also* have Firewall splash assisting, which matches the archetype intent ("spawn floor test"). ✓

---

## Implementation pointers

This doc is reference material — no code changes yet. When bringing balance concerns to code:

- **Damage / interval tuning** — `src/config/towers.ts` `TOWER_CONFIGS`. Single file.
- **Shop upgrade strengths** — `src/systems/UpgradeManager.ts` (multiplier formulas) + `src/config/upgrades.ts` (costs, max levels).
- **Enemy HP** — `src/config/waves.ts` per-wave, or `src/config/enemies.ts` `baseHP` as reference (note: `baseHP` is unused in campaign — waves override).
- **Measuring actual DPS** — no telemetry exists. To validate playtest, add a debug overlay: total damage dealt per tower, total DPS, enemies killed, average HP at death. Would take ~30 min to wire into `Tower.update()` and `HUD`.
