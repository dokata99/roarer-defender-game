# Shop Progression Math

The shop is the meta-game loop: die, bank Roarer Points (RP), buy permanent upgrades, come back stronger. This doc does the math on the current prices, the DPS gain per upgrade, and the run-count needed to reach each tier. Pairs with `01-06-tower-balance-sheet.md` (in-run tower math).

Source of truth: `src/config/upgrades.ts`, `src/systems/UpgradeManager.ts`.

---

## The four upgrades

| ID | Name | Per-level effect | Max level | Costs per level (RP) | Total to max |
|---|---|---|---|---|---|
| `towerDamage` | Tower Damage+ | +10% damage | 5 | 4, 8, 13, 19, 27 | **71 RP** |
| `towerSpeed` | Tower Speed+ | ×0.95 attack interval (~+5.26% rate) | 5 | 4, 8, 13, 19, 27 | **71 RP** |
| `extraLives` | Extra Lives | +20 lives | 5 | 2, 5, 9, 14, 20 | **50 RP** |
| `discountUpgrades` | Discount Upgrades | ×0.90 tower upgrade cost | 3 | 5, 11, 18 | **34 RP** |

**Total RP to max everything: 226.**

---

## RP economy

RP earned = waves cleared in the run. Partial waves don't count (must finish the wave before dying).

| Player skill tier | Typical run outcome | RP per run |
|---|---|---|
| First-time player | Dies wave 5–7 | 5–7 RP |
| Getting the hang of it | Dies wave 10–12 | 10–12 RP |
| Mid progression | Dies wave 14–16 | 14–16 RP |
| Near full clear | Dies wave 18–19 | 18–19 RP |
| Full clear | Beats wave 20 | **20 RP** |
| Endless runs | Full campaign + endless waves | 20 + endless count |

---

## Runs to max (cumulative RP)

Assumes the player improves each run by ~1–2 waves.

| Runs completed | Cumulative RP | Shop state available |
|---|---|---|
| 1 | 5 | Extra Lives L1 (2) + Damage L1 (4) — 6 RP short, grab one |
| 3 | ~20 | First ~5 cheap upgrades bought |
| 5 | ~50 | All L1s + some L2s |
| 10 | ~120 | All L2s + some L3s bought |
| 15 | ~200 | One step from maxed |
| **~18** | **226** | **Maxed across the board** |

**Meta-progression target: ~18 runs to fully max.** Fits a hackathon demo where you want judges to see "plenty of progression room left" without the number feeling grindy.

If you shipped *just* a full campaign clear per run (20 RP) and nothing partial, you'd hit max in **~12 clears**. The current model encourages dying often and still earning — important for the early game where leaks are expected.

---

## DPS math: Damage vs Speed

**Damage** is additive on the multiplier (×1.0, ×1.1, ×1.2 ... ×1.5). Each level adds a *decreasing* percentage of the previous level's DPS.

**Speed** is geometric on the interval (×1.0, ×0.95, ×0.9025 ... ×0.774). Each level adds a *constant* ~5.26% to the effective DPS rate.

Full breakdown:

| Level | Damage: DPS gain | Damage: RP cost | **DPS / RP** | Speed: DPS gain | Speed: RP cost | **DPS / RP** |
|---|---|---|---|---|---|---|
| L1 | +10.0% | 4 | **2.50%** | +5.26% | 4 | 1.32% |
| L2 | +9.1% | 8 | **1.14%** | +5.26% | 8 | 0.66% |
| L3 | +8.3% | 13 | **0.64%** | +5.26% | 13 | 0.40% |
| L4 | +7.7% | 19 | **0.41%** | +5.26% | 19 | 0.28% |
| L5 | +7.1% | 27 | **0.26%** | +5.26% | 27 | 0.19% |

**Damage dominates Speed at every level** — roughly 2× better DPS per RP at every tier.

**Combined max:** damage ×1.50 + speed /0.774 = **×1.938 DPS** after 142 RP in these two upgrades alone.

> 🚩 **Balance flag:** Tower Speed is strictly dominated by Tower Damage. A rational player should fully max Damage before buying any Speed. Options to fix — see "Open balance questions" below.

---

## Extra Lives: survival math

+20 lives per level, up to +100 at max. Reference:

| Tier | Lives lost | Max leaks before game over (base 100 / max 200) |
|---|---|---|
| Worm (10) | Base: 10 worms | Max: 20 worms |
| Packet (5) | Base: 20 packets | Max: 40 packets |
| Trojan (20) | Base: 5 trojans | Max: 10 trojans |
| Boss (999) | Base: 0 | Max: 0 (always GG on reach) |

**When it's worth buying:**
- **Early runs (first 5 runs)** — leaks happen often, every +20 lives buys another partial wave clear. High RP/life-saved value.
- **Mid progression** — diminishing returns as leaks get rare.
- **Near full-clear** — low value. If you're not leaking, +20 lives is dead weight.

**Cheapest upgrade family** (2 RP entry) — always buyable after run 1.

---

## Discount Upgrades: in-run gold math

×0.90 per level, max ×0.729 on *upgrade costs only* (not initial placement).

### What this saves per tower

| Tower | Upgrade cost L1→L3 | Full build total | Saved at discount L3 |
|---|---|---|---|
| Firewall | 40g (15 + 25) | 50g | **10.8g** per fully-upgraded tower |
| Killswitch | 50g (20 + 30) | 65g | **13.5g** per fully-upgraded tower |

### Break-even per run

If the player builds **8 fully-upgraded towers** per run (mix of Firewalls + Killswitches), savings are ~**90–100g per run** from discount L3. That's roughly enough for **2 extra L1 Killswitches** or **9 extra L1 Firewalls**.

**Hidden nudge:** because discount only applies to upgrades, it subtly encourages "upgrade instead of spam L1." If the balance sheet shows L1 spam as optimal (it currently does — see `01-06`), Discount Upgrades helps swing the meta toward upgrading.

### Why it's capped at 3 levels
Unclear. Possibly intentional (to prevent "free upgrades" feeling), possibly an oversight. Consider extending to 5 levels with diminishing discount (10/8/6/4/2% for 5/11/18/26/36 RP) if playtest shows players ignore it.

---

## Recommended buy order

Priority ordering, balancing DPS/RP, survivability, and RP budget. Assumes the player is earning ~10–15 RP per run.

| Order | Upgrade | Cumulative RP | Why |
|---|---|---|---|
| 1 | Extra Lives L1 | 2 | Cheapest upgrade. First-run affordable. Tangible "I can leak one more" feeling. |
| 2 | Damage L1 | 6 | Best DPS/RP in the game (2.5%/RP). |
| 3 | Extra Lives L2 | 11 | Still cheap, still valuable while dying often. |
| 4 | Damage L2 | 19 | Next-best DPS/RP. |
| 5 | Discount Upgrades L1 | 24 | Compounds with every in-run upgrade the player buys. Subtle snowball. |
| 6 | Damage L3 | 37 | Keep Damage rolling. |
| 7 | Extra Lives L3 | 46 | Pre-boss safety net. |
| 8 | Discount Upgrades L2 | 57 | The snowball keeps rolling. |
| 9 | Damage L4 | 76 | Damage taps out at L5. |
| 10 | Damage L5 | 103 | Max damage. ×1.50 multiplier achieved. |
| 11 | Discount Upgrades L3 | 121 | Final discount tier. |
| 12 | Extra Lives L4 | 135 | — |
| 13 | Extra Lives L5 | 155 | Max survival. +100 lives. |
| 14 | Speed L1 | 159 | Start of Speed. If you care. |
| 15 | Speed L2 | 167 | — |
| 16 | Speed L3 | 180 | — |
| 17 | Speed L4 | 199 | — |
| 18 | Speed L5 | **226** | Fully maxed. |

**Key observation:** a rational player doesn't touch Speed until every other upgrade is maxed. This is the balance flag from earlier.

---

## Difficulty impact per milestone

How much does shop progression move the campaign difficulty curve? Rough playthrough feel:

| Shop state | Expected campaign death wave (average player) |
|---|---|
| Fresh (0 upgrades) | Wave 7–10 |
| Early (Dmg L2 + Lives L2, ~19 RP) | Wave 10–13 |
| Mid (Dmg L3 + Discount L1 + Lives L3, ~46 RP) | Wave 13–16 |
| Late (Dmg L5 + Discount L2 + Lives L4, ~135 RP) | Wave 17–19 |
| Maxed (226 RP) | Wave 20 cleared — endless unlocked |

This maps to the "difficulty targets per arc" in `01-04-campaign-mode-design.md`. If a maxed player consistently stalls at wave 18 in playtest, Damage or Discount needs a bump.

---

## Open balance questions

1. **Speed is dominated by Damage.** Rational players will never buy Speed until Damage is maxed. Three fixes to consider:
   - (a) Match Speed's per-level gain to Damage (raise Speed to ~9–10% per level).
   - (b) Lower Speed costs (e.g., 3/6/10/15/21).
   - (c) Give Speed a unique quality: "reduces overkill waste" or "ignores 10% of HP on hit." Mechanically different, not just DPS.
   - Quickest: option (a).

2. **Discount Upgrades caps at 3 levels** — is that intentional? Extending to 5 levels gives longer meta tail without being overpowered (each level adds diminishing ~1.9g per tower). Current cap may feel like a hidden ceiling to players.

3. **Max damage (×1.50) vs. boss HP scaling.** Per `01-06`'s boss-solve analysis, even maxed Damage may not be enough for wave 20 boss at 9000 HP. If you keep boss HP high, Damage cap should probably rise to ×1.75 or ×2.00.

4. **RP/run feels right at ~1 RP per wave cleared?** Alternative: 2 RP per wave, halving runs-to-max to ~9. More rewarding feel, shorter meta loop. Trade-off: less replayability. Depends on whether you want players grinding or not.

5. **Upgrade paths should branch visibly.** Currently the shop shows 4 flat options. For a hackathon polish pass, show a small "total effect" panel at the bottom ("Your towers deal 1.4× damage, 1.15× faster, refund 15% more, start with 140 lives"). Players need to feel their progression accumulate.

---

## Implementation pointers

- **Costs and max levels** — `src/config/upgrades.ts`. One file, change the arrays.
- **Effect formulas** — `src/systems/UpgradeManager.ts`. The multiplier functions (`getEffectiveDamage`, `getEffectiveAttackInterval`, `getEffectiveUpgradeCost`, `getStartingLives`). Change the `0.10` / `0.95` / `0.90` / `20` constants here.
- **RP earning** — `src/scenes/GameScene.ts` in `handleDefeat` / `handleVictory` / `quitRun`. All three currently award `rp = wavesCleared`. Change the formula in all three if you retune.
- **Persistence** — `src/systems/SaveManager.ts`, `roarerPoints` field.
- **Shop UI** — `src/scenes/ShopScene.ts` (not yet read but referenced). Adding the "total effect" summary panel lives there.
