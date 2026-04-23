# Team Coordination & Task Backlog

Single-page consolidation of every task, decision, and dev ask surfaced by specs `01-03` through `01-09`. If something in those specs requires a human (decision) or code change (task), it's here.

---

## Tracks & ownership

Fill in names. Use this to route questions fast.

| Track | Responsibilities | Owner |
|---|---|---|
| **Level design** | Wave authoring, shop costs, enemy stats, balance tuning, flavor writing | |
| **Art / visual** | Texture generators, color palette, UI polish, particles | |
| **Engineering** | Gameplay code, new features (flying, demo mode), multiplayer groundwork | |
| **Producer / demo lead** | Demo script rehearsal, timing, fallback recording, pitch deck | |
| **Playtest coordinator** | Runs playtest sessions, logs findings per `01-06`/`01-04` signal tables | |

---

## Decisions needed before hackathon (human calls, no code)

These are gating. Don't start coding the dependent tasks until each is decided.

| # | Decision | Source | Default | Who decides |
|---|---|---|---|---|
| D1 | Endless HP curve: keep `1.20^x` (steep, current) or revert to `1.12^x` (original spec)? | `01-03` | Keep `1.20^x`, revisit post-playtest | Level design |
| D2 | Wave 20 boss HP: 9000 (may be unclearable) vs 7500 (safer) vs raise Damage cap to ×2.00? | `01-06` | Drop to **7500**; re-raise post-playtest if too easy | Level design |
| D3 | Fix Tower Speed dominance — (a) raise gain to 9%, (b) lower costs, (c) add unique quality? | `01-09` | **(a)**: 9% per level, same costs | Level design |
| D4 | Extend Discount Upgrades to 5 levels? | `01-09` | Yes, 10/8/6/4/2% for 5/11/18/26/36 RP | Level design |
| D5 | RP per wave — keep 1 RP/wave or raise to 2 RP/wave? | `01-09` | Keep 1 RP/wave | Level design |
| D6 | Flying enemy color — magenta (`#FF3CF2`) or holo blue (`#3A86FF`)? | `01-08` | **Magenta** — reads as threat | Art + level design |
| D7 | Flying enemy name — Packet, Ping, Drone, Bot, Signal? | `01-08` | **Packet** | Level design |
| D8 | Campaign wave table — use current `waves.ts` (validated) or swap to `01-04` alt (untested, more variety)? | `01-04` | **Hybrid**: keep current counts/HP, swap in flying waves at 7/14/18 only | Level design |
| D9 | Endless preset — Steep (current), Long haul, or Spiky? | `01-03` | Ship Steep, tune live | Level design |
| D10 | Demo boss — wave 10 (safer) or wave 20 (bigger spectacle)? | `01-07` | **Wave 10** until D2 is playtested | Demo lead |

---

## Pre-hackathon engineering tasks

Tasks needed *before* the hackathon proper, so the hackathon itself can focus on polish + features.

### Group A — Demo infrastructure (load-bearing for `01-07` demo script)

| # | Task | Est | Files | Blocks |
|---|---|---|---|---|
| A1 | Skip-to-wave hotkey (`Shift+N`) with gold seeding | 30m | `GameScene.ts`, `WaveManager.ts` | Demo script |
| A2 | Demo save loader button on main menu | 20m | `MainMenuScene.ts`, `SaveManager.ts` | Demo script |
| A3 | Gold cheat hotkey (emergency only) | 10m | `GameScene.ts`, `EconomyManager.ts` | Demo safety |
| A4 | Gate all debug features behind `?demo=1` URL param | 15m | `main.ts` | Production hygiene |
| A5 | Brighten path line rendering for demo visibility | 15m | `GameScene.drawPathLines()` | Demo "path reroute" moment |
| A6 | Record 30s boss-fight fallback video | 30m | External | Demo fallback |

**Group A total: ~2h.** All small, one-engineer.

### Group B — Flying enemies (required for waves 7/14/18 in `01-04` alt table)

| # | Task | Est | Files | Blocks |
|---|---|---|---|---|
| B1 | Add `'flying'` to `EnemyType` union + `ENEMY_CONFIGS.flying` entry | 15m | `enemies.ts` | B2–B6 |
| B2 | Straight-line movement branch in `Enemy.update()` when `type === 'flying'` | 45m | `Enemy.ts` | Flying works |
| B3 | Skip flying enemies in `Tower.update()` when `towerType === 'splash'` | 15m | `Tower.ts` | Sniper-only rule |
| B4 | Flying sprite texture generator | 1h | `EnemyTextures.ts` | Visual |
| B5 | Render flying enemies at depth 25+ (above towers) + optional shadow | 30m | `Enemy.ts`, `GameScene.ts` | "In the air" read |
| B6 | UX signal: tooltip / altitude icon so players understand splash can't hit | 45m | `Enemy.ts` or HUD | Prevents "firewall broken" confusion |
| B7 | Update `waves.ts` with flying waves at 7, 14, 18 (after D8) | 15m | `waves.ts` | D8 resolved |

**Group B total: ~4h.** One engineer + art coordination for B4.

### Group C — Balance fixes (from D2, D3, D4)

| # | Task | Est | Files |
|---|---|---|---|
| C1 | Apply D2: set wave 20 boss HP | 5m | `waves.ts` |
| C2 | Apply D3: adjust Tower Speed per-level multiplier | 5m | `UpgradeManager.ts` |
| C3 | Apply D4: add 2 more Discount Upgrades levels | 10m | `upgrades.ts` |
| C4 | Apply D5: adjust RP/wave if changed | 15m | `GameScene.ts` (3 call sites: `handleDefeat`, `handleVictory`, `quitRun`) |

**Group C total: ~35m.** Pure config changes after decisions land.

### Group D — Flavor wiring (`01-05`)

| # | Task | Est | Files |
|---|---|---|---|
| D1 | New `src/config/waveFlavor.ts` file with 20 campaign wave name/subtitle pairs | 20m | new file |
| D2 | Update `WavePreview.ts` to render wave name + subtitle | 30m | `WavePreview.ts` |
| D3 | Milestone callout system (waves 5/10/15/19/20 big-text overlay on `waveComplete`) | 45m | `GameScene.ts` |
| D4 | Themed defeat/victory/pause screen text | 30m | `GameOverScene.ts`, `VictoryScene.ts`, `PauseOverlay.ts` |
| D5 | Endless wave name generator with word banks | 30m | `endless.ts` or `waveFlavor.ts` |

**Group D total: ~2.5h.** Nice-to-have but high polish impact.

### Group E — Stretch polish

| # | Task | Est | Files | Priority |
|---|---|---|---|---|
| E1 | Shop "total effect" summary panel | 45m | `ShopScene.ts` | High |
| E2 | Debug DPS overlay for playtest (total damage dealt per tower) | 1h | `Tower.ts`, `HUD.ts` | Medium (validates balance) |
| E3 | Wave 20 boss death: extended celebration sequence | 30m | `Enemy.ts` boss cleanup, `VictoryScene.ts` | Medium |
| E4 | Particle polish on Packet death | 30m | `ParticleManager.ts`, `EnemyTextures.ts` | Low |

### Group F — Hackathon "if time allows"

Everything in the extensions sections of `01-03` and `01-04`. All net-new features.

| # | Feature | Source | Scope |
|---|---|---|---|
| F1 | Milestone callouts (done in D3) | `01-03` | Included above |
| F2 | Affix waves (1-in-N applies modifier) | `01-03` | Half day |
| F3 | Combo meter / kill chain gold multiplier | `01-03` | Full day |
| F4 | Endless leaderboard (localStorage top 5) | `01-03` | Half day |
| F5 | Super-boss tier (every 15 endless waves) | `01-03` | Half day |
| F6 | Cut wave 17 gauntlet to single-type if mixed interleaving feels bad | `01-04` | 10m |

---

## Dependency graph

```
D1 ─────────────────────────────→ C4 (if RP/wave changes)
D2 ──→ C1 ──→ Demo script (D10 recheck)
D3 ──→ C2 ──→ Tower Speed viable to buy
D4 ──→ C3 ──→ Shop has more depth
D6, D7 ──→ B4 (flying art)
D8 ──→ B7 (flying wave data)

A1, A2, A3, A4 ──→ Demo rehearsal possible
A5 ──→ Demo "path reroute" moment lands
A6 ──→ Demo fallback exists

B1 ──→ B2, B3, B4, B5, B6 ──→ Flying enemies work at all
B7 (requires B1–B6 + D8) ──→ Flying waves playable

D1–D5 ──→ Flavor visible in-game
```

---

## Suggested sequencing

**Week before hackathon:**
1. Resolve D1–D10 in a 30-minute design meeting.
2. Ship Group A (demo infra) — unblocks demo rehearsal.
3. Start Group B (flying) — biggest feature, longest lead time.
4. Apply Group C (config tweaks after decisions).

**Hackathon day:**
1. Finish Group B if not done.
2. Ship Group D (flavor wiring) — biggest polish-to-effort ratio.
3. Group E polish (shop summary panel, debug overlay if playtesting).
4. Run 2–3 playtests against the `01-04` / `01-06` signal tables.

**Last 4 hours:**
1. Freeze features. Only bug fixes and balance numbers.
2. Full demo rehearsal at least 3 times (see `01-07`).
3. Record the fallback video (A6) with final balance numbers.

**Do not ship in hackathon version:**
- F2 affix waves — adds an enum and per-wave state, too risky under pressure
- F3 combo meter — UI surface area
- F4 leaderboard — needs Stats screen design
- Multiplayer (see `03-01-last-man-standing.md`) — weeks of work, not hours

---

## Cut list (explicit out-of-scope)

Agreed up front so arguments at 2am don't happen.

| Idea | Status | Why |
|---|---|---|
| Map variants / multiple arenas | Cut | Single arena is part of the game's identity |
| Third tower type | Cut | 2 towers + 4 enemies is tight, clean scope |
| Boss attack patterns | Cut | Bosses are HP sponges; patterns are post-hackathon |
| Mobile support | Cut | 1280×720 desktop only per `01-01` |
| Audio / music production | Cut unless someone is picking it up | Not in current scope |
| Save file versioning / migrations | Cut | `SaveManager` merges defaults; good enough |
| Analytics / telemetry | Cut | Playtest observation is enough |
| Tutorial / onboarding overlay | Cut | Wave 1 IS the tutorial (per `01-04`) |
| Multiplayer | Cut for hackathon | See `03-01-last-man-standing.md` for post-hackathon plan |

---

## Decision log (living document)

Append every decision with date. Future team members (and future you) will thank you.

| Date | Decision | Chosen | By |
|---|---|---|---|
| YYYY-MM-DD | (example) D2: wave 20 boss HP | 7500 | team |
|   |   |   |   |

---

## Standing meetings (suggested)

- **Daily (hackathon week)**: 15-minute sync at the start of day. What's blocked? What did you finish?
- **Playtest review (end of each playtest session)**: 20 minutes. Walk through `01-04` / `01-06` signal tables and log findings here.
- **Pre-demo rehearsal (day of presentation)**: At least 3 full 3-minute runs. See `01-07` rehearsal notes.

---

## Communication

- **Spec changes**: If you change a number in `waves.ts` or `upgrades.ts` that contradicts a spec, update the spec in the same commit. Otherwise specs rot fast.
- **New tasks surfaced during hackathon**: Add them to Group E (stretch) or Cut list with a reason. Don't just Slack them — they disappear.
- **Blockers**: If you can't proceed, say so within 30 minutes of discovering it. Escalate to the track owner.
