# Shop Slim-Down Design

Reduces the shop from 10 upgrades to **4**, keeping only the upgrades that are generic, always-useful, and don't overlap with per-tower or per-stat specialization. The rest are deleted — no "coming later" placeholders.

---

## What stays

| Upgrade | Per-level effect | Max level | Per-level RP cost | Total RP to max |
|---|---|---|---|---|
| Starting Gold+ | +20 gold at run start | 5 | 3 / 6 / 10 / 15 / 22 | **56** |
| Tower Damage+ | +10% damage (all towers) | 5 | 4 / 8 / 13 / 19 / 27 | **71** |
| Tower Speed+ | −8% attack interval (all towers) | 5 | 4 / 8 / 13 / 19 / 27 | **71** |
| Discount Upgrades | −10% gold cost on tower upgrades (L1→L2, L2→L3) | 3 | 5 / 11 / 18 | **34** |

**Total RP to max the entire shop: 232** (down from 509 in the old shop, 459 after `extraLives` is removed per `01-12-security-meter-design.md`).

Values and costs for the kept upgrades are unchanged — existing balance math in `01-06-tower-balance-sheet.md` for these four still applies. The only shop-level change is which rows exist.

## What goes

Deleted outright. No UI slots, no "locked" placeholders, no config entries.

| Upgrade | Reason for removal |
|---|---|
| Tower Range+ | Range differences between tower types already handle the "reach" design lever; a generic +range buff blurs per-tower identity. |
| Discount Towers | Overlaps with Starting Gold+. Starting Gold+ is the cleaner cost-reducer since it doesn't create edge-case cheaper-placement strategies. |
| Extra Lives | Removed by `01-12-security-meter-design.md`. Security isn't buyable. |
| Kill Bounty+ | Overlaps with Starting Gold+. Having two gold-economy knobs is redundant; Starting Gold+ is the one we keep. |
| Splash Radius+ | Per-tower specialization — belongs in per-tower balance in `src/config/towers.ts`, not a shop-level knob. Splash towers tune their own radius per level. |
| Sniper Crit | Per-tower specialization. If we want the sniper to crit, it should be a base stat of the sniper tower, not an unlockable. |

---

## Design rationale

Two principles drive the cut:

1. **Per-tower stats belong in per-tower config, not the shop.** Splash Radius+, Sniper Crit, and Tower Range+ all tweak specific tower mechanics. Pushing them out of the shop makes the shop about *meta progression* (stronger runs) and the tower configs about *tower identity* (what each tower does). Cleaner separation.
2. **No two upgrades should hit the same economic lever.** Discount Towers and Kill Bounty+ both shift gold economy in the same direction as Starting Gold+. Keeping all three splits player attention across functionally-equivalent choices. Starting Gold+ alone is enough.

What's left is a tight, four-slot shop where every upgrade is:
- Globally applicable (affects every tower and every run).
- Non-overlapping with the others.
- A lever that's *always* worth buying eventually — no "this is only useful if I play X tower" traps.

---

## Interactions with other specs

- **`01-11-frost-tower-design.md` (Cryolock)** — the "Splash Radius+ also buffs Cryolock" integration note is now obsolete. Update that spec's *Shop upgrade integration* section to drop the Splash Radius+ row. Cryolock still benefits from Tower Damage+ and Tower Speed+ automatically; splash radius stays at whatever the tower config says.
- **`01-12-security-meter-design.md` (Security)** — consistent: both specs remove `extraLives`. No conflict.
- **`01-06-tower-balance-sheet.md`** — the boss-solve analysis and DPS-per-gold math still hold for the kept upgrades (values unchanged). Sections that reference Splash Radius+ / Sniper Crit / Kill Bounty as balance levers need trimming.
- **`01-09-shop-progression.md`** — the 10-row layout is now 4 rows. Needs a rewrite pass after this spec lands.

---

## Implementation pointers

When the implementation plan is written, expect to touch:

- `src/config/upgrades.ts` — drop six entries from `UPGRADE_CONFIGS`. Keep only `startingGold`, `towerDamage`, `towerSpeed`, `discountUpgrades`. No ordering change.
- `src/types/save.ts` — remove these fields from `ShopUpgrades`: `towerRange`, `discountTowers`, `extraLives`, `killBounty`, `splashRadius`, `sniperCrit`. Update `defaultSave()` to match.
- `src/systems/SaveManager.ts` — `mergeWithDefaults` uses `{ ...base.shopUpgrades, ...(p.shopUpgrades ?? {}) }`. Old saves with removed fields will spread them into the object and the TS compiler will complain. Either narrow the spread to only known keys, or accept the any-cast. Safer: explicit key-by-key copy for `shopUpgrades`.
- `src/systems/RunContext.ts` — delete these fields and their constructor math: `sniperCritChance`, `placeCostMultiplier`, `rangeBonusTiles`, `splashRadiusBonusTiles`, `killBountyMultiplier`. Keep `damageMultiplier`, `attackIntervalMultiplier`, `upgradeCostMultiplier`, `startingGold`. Simplify `getTowerStats` so it only reads damage / attackInterval / upgradeCost modifiers (no range bonus, no splash bonus, no place cost multiplier). `getPlaceCost` becomes a plain config read. `getKillBounty` becomes the identity function — or remove it entirely and inline the base bounty at the call site in `GameScene.onEnemyKilled`.
- `src/entities/Tower.ts` — remove `getCritChance()` (no more sniperCrit). The sniper firing branch in `GameScene.fireTowers` that checks `tower.getCritChance()` becomes a single non-crit path.
- `src/scenes/ShopScene.ts` — re-layout for 4 rows. Existing scroll/page logic (if any) can go if it only existed for 10 rows.
- `src/scenes/StatsScene.ts` — if it surfaces shop-upgrade levels, drop the removed rows.

Roarer Points already spent on the deleted upgrades are **not refunded** — existing saves simply lose those level values on next load. Acceptable pre-release; document in a changelog if we have one.

---

## Ship-time implementation note

With 4 rows instead of 10, `ShopScene.ts` layout needs a sanity-check: the existing vertical stack may look sparse. Nudge the `startY` or spacing to keep the block visually centered, and if the screen still feels empty, consider a slightly larger per-row treatment. This is a polish detail handled during implementation, not a blocker.

---

## Not in scope for this spec

- **New upgrades to fill the freed RP/design space.** Ship-as-is decision — new upgrades, if any, go in a follow-up spec with their own design thinking.
- **Rebalancing the values of the four kept upgrades** (costs / effects / levels). Ship-as-is decision — current values stand; total RP to max drops to 232 and we tune up later if playtest shows progression feels stale. Easier to raise costs later than lower them.
- Wave-table rebalance to account for the weaker meta ceiling — handled via `01-06-tower-balance-sheet.md` after playtest.
- Shop UI redesign beyond "delete the rows that no longer exist." Dedicated UI polish belongs in the visual-design track.
- RP refund on save load. Pre-release, not worth the migration code.
