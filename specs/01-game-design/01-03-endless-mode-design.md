# Endless Mode Design Playbook

Design reference for tuning endless mode (wave 21+). Unlike campaign, endless is *algorithmic* — you don't author waves, you pick formulas. Everything here maps to constants and functions in `src/config/endless.ts`.

---

## What endless is for

Endless runs start after wave 20 (campaign victory) and don't end until the player dies. The job of endless tuning is to produce a curve that:

1. **Feels earnable** — progress is visible wave-by-wave (HP bars grow, gold yield climbs). Not a flat grind.
2. **Creates a wall** — every run has a recognizable "this is where it breaks" moment. Without a wall, endless is infinite boredom.
3. **Rewards shop upgrades** — the wall must move *meaningfully* when a player buys upgrades. If un-upgraded dies at wave 25 and maxed dies at wave 28, the shop is pointless.
4. **Tells a story in 5-wave arcs** — the boss cadence is the main structural beat. Everything between bosses is build-up.

---

## The design surface (knobs in `endless.ts`)

| Knob | Current | Meaning | Sensible range |
|---|---|---|---|
| HP growth | `1.20^(w-20)` | Compound HP multiplier per wave. Current doubles every **~3.8 waves** | `1.10` – `1.25` |
| Gold growth | `1.04^(w-20)` | Compound gold per kill. Doubles every **~17.7 waves** | `1.02` – `1.08` |
| Fast count | `8 + 2.75·(w-20)`, cap **60** | Enemies per fast-swarm wave | start 6–10, slope 2–4, cap 40–80 |
| Elite count | `4 + 0.7·(w-20)`, cap **20** | Enemies per elite wave | start 3–5, slope 0.5–1.2, cap 12–25 |
| Spawn interval | `max(0.3, 1.2·0.97^(w-20))` | Seconds between spawns; decays to floor | start 1.0–1.5, decay 0.95–0.98, floor 0.25–0.4 |
| Speed | `baseSpeed · (1 + 0.12·ln(w-19))`, hard-capped | Logarithmic speed growth per enemy type | factor 0.08–0.15 |
| Boss HP multiplier | `×2.5` on top of HP growth | Extra bump so bosses are bosses | `1.5×` – `3×` |

**The key relationship:** HP grows *faster* than gold. That's the entire economic engine of endless — every wave you have less purchasing power per unit HP. Widen the gap (HP steeper or gold shallower) → players die sooner. Narrow it → runs stretch longer but feel grindier.

> ⚠️ Heads-up: the original design doc (`initial-prompt.md`) called for HP `1.12^x` (doubling every ~6 waves) with a maxed-player wall of waves 35–45. The code ships with `1.20^x` which is much steeper. Decide which target is correct before the hackathon.

---

## Cycle pattern

Waves 21+ rotate through a 5-slot cycle. Current pattern in `ENDLESS_CYCLE`:

| Slot (`(w-21) mod 5`) | Type | Content |
|---|---|---|
| 0 | `normal` | Fast swarm |
| 1 | `mixed` | Fast swarm + half-count elites |
| 2 | `elite` | Elite-only |
| 3 | `mixed` | Repeat of slot 1 |
| 4 | `boss` | 1 boss + fast escorts (⅓ normal count) |

**How mixed waves work:** the `generateEndlessWave()` function returns *multiple* `WaveDefinition`s, and `WaveManager.startWave()` concatenates their spawn queues. So currently all fast enemies spawn, *then* all elites — not interleaved. Interleaving would require changes to `WaveManager.startWave()`.

### Alternative cycle patterns to consider

- **7-slot with a lull** — `N–M–E–L–M–E–B` where `L` is a "lull" wave (60% count, 70% HP). Gives breathing room and a gold recovery beat.
- **Escalating boss cadence** — bosses every 5 waves until wave 40, then every 4, then every 3. Makes late endless feel frantic.
- **Themed stretches** — waves 21–30 "worm flood" (bias toward fast slots), 31–40 "trojan siege" (bias elite), 41+ "zero-day chaos" (more bosses).

---

## Difficulty targets

Pick target walls *before* tuning; playtest against them.

| Player state | Target death wave |
|---|---|
| No upgrades (first endless run) | 22–26 |
| Mid upgrades (~60% of shop) | 30–38 |
| Maxed upgrades | 40–50 |
| Perfect play, maxed | 50+ (leaderboard territory) |

---

## Three presets (pick one, or mix)

### Preset A — "Steep" (ships today)
Short, intense runs. High variance. Shop upgrades feel dramatic.
```
HP growth:      1.20^(w-20)
Gold growth:    1.04^(w-20)
Speed factor:   0.12 · ln(w-19)
Boss HP mult:   2.5×
Cycle:          N-M-E-M-B (every 5)
Fast cap 60, Elite cap 20, Spawn floor 0.3s
```
Expected maxed wall: ~40. Feels punishing for casual players.

### Preset B — "Long haul"
Slower curve. Runs feel like an accomplishment. Lower shop pressure.
```
HP growth:      1.14^(w-20)
Gold growth:    1.05^(w-20)
Speed factor:   0.10 · ln(w-19)
Boss HP mult:   2.0×
Cycle:          N-N-M-E-B (every 5) — two fast waves between elites
Fast cap 50, Elite cap 16, Spawn floor 0.3s
```
Expected maxed wall: ~55–65. Matches the spirit of the original `initial-prompt.md` target.

### Preset C — "Spiky"
Theatrical pacing. Calm → chaos → calm. Best for streamers / demos.
```
HP growth:      1.17^(w-20)
Gold growth:    1.04^(w-20)
Speed factor:   0.12 · ln(w-19)
Boss HP mult:   3.0×
Cycle:          N-L-M-E-B  (L = lull: 60% count, 70% HP)
Super-boss every 15 waves: boss HP ×2 again
Fast cap 60, Elite cap 20, Spawn floor 0.25s
```
Expected maxed wall: ~45. Feels varied; punishes auto-pilot.

---

## Playtest signals

What to watch for in a demo session — and what each signal means:

| Signal | Likely cause | Tuning move |
|---|---|---|
| Deaths cluster at waves 21–23 | Opening is too hard | Lower starting counts or re-order cycle so slot 0 is easier |
| Deaths cluster at 40+ with low variance | Hard caps kicked in; game stopped scaling | Raise count caps, or let spawn interval drop below 0.3s |
| One specific shop upgrade stops being bought mid-endless | That upgrade can't keep pace with HP scaling | Check if damage% upgrades fall behind HP `1.20x` after wave ~25 |
| Runs feel samey past wave 30 | Cycle is too predictable | Add lull/super-boss or bias themes by decade |
| Players quit before dying | Boredom, not difficulty | Shorten runs (steeper curve) or add milestones |
| "I didn't know it was getting harder" | No visible progression signal | Add milestone callouts at 25/50/75 |

---

## Extensions (if time allows)

Not required for a first pass, but good ideas to slot in if the hackathon leaves room:

- **Milestone callouts** — on-screen text at waves 25 / 50 / 75 ("Firewall holding!" "Breach imminent!")
- **Affix waves** — 1-in-N waves apply a modifier: *Fast Forward* (+50% speed, +25% gold), *Armored* (+30% HP, +20% gold), *Elite Rush* (elites only, huge gold)
- **Combo meter** — chaining kills within X seconds stacks a gold multiplier; resets on any leaked enemy
- **Leaderboard** — `localStorage` top-5 endless waves reached, shown on Stats screen
- **Super-boss tier** — every 15th wave replaces the regular boss with a named one; additional ×2 HP and unique death animation

---

## Implementation pointers

When it's time to apply any of this at the hackathon:

- **All formulas live in `src/config/endless.ts`** — one file, ~120 lines. No other file changes needed for pure tuning.
- **`ENDLESS_CYCLE` at the top of that file** is the pattern array — swap entries to change the cycle.
- **Count caps** are hard-coded inside `getEndlessFastCount` / `getEndlessEliteCount` — don't forget to update both if you're widening scaling.
- **Adding a new slot type** (e.g. `'lull'`) requires a new case in the `switch` inside `generateEndlessWave`.
- **Adding affixes** is bigger — needs a new field on `WaveDefinition` in `waves.ts` and consumers in `Enemy`/`EconomyManager`.
