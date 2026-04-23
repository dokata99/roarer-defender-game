# Hackathon Demo Script — 3 Minutes

Minute-by-minute demo plan for a 3-minute hackathon presentation. Every second is accounted for. The goal is not to *play* the game — it's to *show the five moments that make it good* with no dead air.

---

## The five hero moments (in order)

Ranked by "shows something a judge hasn't seen in every other hackathon entry."

1. **Visual identity** — cyber/neon grid, procedurally-generated assets (no image files)
2. **Path-aware placement** — towers block the grid; enemies reroute live. This is the unique TD mechanic.
3. **Flying enemies** — sniper-only air lane. The strategic twist.
4. **Boss climax** — spectacle + stakes.
5. **Meta loop** — Roarer Points shop. Shows depth beyond a single run.

Skip everything else: tutorial waves, menu chrome, stats screen, credits.

---

## Timing

| Time | Segment | Duration |
|---|---|---|
| 0:00 – 0:15 | Opening hook | 15s |
| 0:15 – 0:40 | Core loop (place → start wave → hit) | 25s |
| 0:40 – 1:10 | Path-aware strategy (place a tower, show re-route) | 30s |
| 1:10 – 1:45 | Flying enemies reveal | 35s |
| 1:45 – 2:25 | Boss fight (pre-set or pre-recorded) | 40s |
| 2:25 – 2:55 | Shop meta loop | 30s |
| 2:55 – 3:00 | Close + ask | 5s |

Total: **180s**, no buffer. Rehearse until you can hit each timestamp within ±3s.

---

## Scene-by-scene script

### 0:00 – 0:15 — Opening hook (15s)

**Show:** Main menu with game title visible. Pause before clicking.

**Say:**
> "This is **Roarer Defense**. You're the firewall. Viruses spawn from the internet. You have one server, 100 lives, and two towers. We built this in [X] hours."

**Action:** Click **Start Run**. Don't wait for scene transition — keep talking.

---

### 0:15 – 0:40 — Core loop (25s)

**Show:** Game scene, build phase, wave 1.

**Setup before demo:** Demo save file starts with 200g (not 100g) so you can place 3 towers quickly without fumbling.

**Say while placing:**
> "13-by-7 grid. Three portals on the left, the server on the right. Two towers: **Firewall** does splash" *(place 1 Firewall centrally)* "and **Killswitch** is a sniper" *(place 1 Killswitch on the flank)*.

**Action:** Click **Start Wave**. Let 5 seconds of combat play. Don't narrate the combat — let the visuals talk. Sound should be up.

**Say as wave plays:**
> "Every placement locks a cell. Enemies always take the shortest path."

**Action:** Wave ends (~20 enemies), gold ticks up.

---

### 0:40 – 1:10 — Path-aware strategy (30s)

**This is the money moment.** Budget the most time here. It's the mechanic nobody expects from a hackathon TD.

**Show:** Build phase after wave 1. Use the debug "skip to wave 5" to get more gold.

**Action 1:** Place a tower in the *middle of the current enemy path*. The red path line visibly reroutes around it.

**Say:**
> "Watch the path." *(place tower)* "Every tower blocks the grid and forces enemies to find a new route — but the game won't let you *fully* block the path. Every build is a puzzle: funnel them into your guns without locking yourself out."

**Action 2:** Try to place a wall of towers that would block the path. A "**Path blocked!**" red warning appears.

**Say:**
> "Try to trap them, the game stops you."

**Action 3:** Click **Start Wave**, let a few enemies path visibly through the new maze.

---

### 1:10 – 1:45 — Flying enemies reveal (35s)

**Show:** Skip to wave 7 (First Flight). Build phase.

**Say while setting up:**
> "Then the packets come."

**Action:** Click **Start Wave**. Flying enemies spawn, travel in straight line above the grid.

**Say as they enter:**
> "Straight-line path. Ignore your towers. Sail right over your Firewalls — those are ground defenses, they can't target the air." *(camera focuses on a Firewall NOT firing at a passing flying enemy)* "Only the **Killswitch** sniper can reach them. Now you have to defend two lanes."

**Action:** Killswitches visibly take down flying enemies with clean shots. If you have no snipers placed, this is where leaks happen — have **exactly the right number** of snipers pre-placed to clear the wave with maybe one leak for drama.

**Say as wave ends:**
> "Build wrong and they waltz through the server."

---

### 1:45 – 2:25 — Boss fight (40s)

**Show:** Skip to wave 20 (final boss) or wave 10 (first boss). **Pick based on current balance** — if wave 20 isn't clearable even maxed (see `01-06-tower-balance-sheet.md`), use wave 10.

**Pre-recorded fallback:** Have a 30-second MP4 of a clean boss kill cued up in a separate tab. If the live demo derails, pivot to the recording with:
> "Here's what that fight looks like when it all comes together."

**Say during build phase:**
> "Wave 20. The final boss — **ROOT ACCESS**. If it reaches the server, it's over. 9,000 HP, one chance."

**Action:** Click **Start Wave**. Boss spawns, screen shakes on entry.

**Say during the fight, sparingly:**
> "Every tower firing. Every upgrade earned. This is what you've been building for."

Let the visuals carry it — don't over-narrate. The boss death should get:
- Camera shake
- Flash
- Ideally a satisfying sound

**If the boss reaches the server:** cut to recording immediately. Don't show the defeat screen.

---

### 2:25 – 2:55 — Shop meta loop (30s)

**Show:** Post-run → Main Menu → Shop. Demo save file has **~50 Roarer Points** banked and 2 upgrades already at L2 (so the shop looks alive, not empty).

**Say:**
> "Every wave you clear earns you Roarer Points. Die or survive, you take them with you. The shop gives you permanent upgrades — more damage, faster towers, more lives."

**Action:** Hover a purchasable upgrade. Click it. Show RP tick down, upgrade level tick up.

**Say:**
> "Run, earn, upgrade, come back stronger. And when you beat the campaign, you unlock endless mode — the waves never stop scaling."

---

### 2:55 – 3:00 — Close (5s)

**Show:** Back to the main menu with the title visible.

**Say:**
> "Roarer Defense. Phaser 3, TypeScript, zero image files — every pixel drawn in code. Thanks."

Nod. Stop.

---

## Pre-demo setup checklist

Do this 30 minutes before going on stage. Checklist style so nothing is forgotten under pressure.

- [ ] Browser in fullscreen at 1280×720 (game's native resolution)
- [ ] Zoom set to 100% (no DPI scaling surprises)
- [ ] Sound on, volume pre-set (test with a wave kill)
- [ ] Demo save file loaded (see next section)
- [ ] Skip-to-wave debug enabled (see "dev asks" below)
- [ ] Pre-recorded boss fight cued in a second tab
- [ ] Notifications silenced (OS + Slack + Discord + email)
- [ ] Laptop charger plugged in
- [ ] Backup laptop ready with same setup
- [ ] No other Chrome tabs open (RAM + tab-switch risk)
- [ ] Timer visible on presenter laptop, not on the projected screen

---

## Demo save file content

You want the game to **look played**, not fresh-install empty. Inject this via `localStorage.setItem('roarerDefenseSave', ...)` or build a "demo save" button.

```json
{
  "roarerPoints": 48,
  "endlessModeUnlocked": true,
  "shopUpgrades": {
    "towerDamage": 2,
    "towerSpeed": 2,
    "discountUpgrades": 1,
    "extraLives": 1
  },
  "stats": {
    "totalRuns": 7,
    "totalWavesCleared": 62,
    "totalEnemiesKilled": 1247,
    "bestWaveReached": 18,
    "endlessBestWave": 24
  }
}
```

Why: a shop screen with "0 RP, 0 upgrades" looks like a prototype. A screen with actual progression looks shipped.

---

## Dev asks before the hackathon deadline

These are small features the demo relies on. Ideally in the main build; worst case in a hidden `?demo=1` URL param.

1. **Skip-to-wave hotkey** — keyboard `Shift+N` to instantly jump to the next wave's build phase with appropriate gold seeded for that wave number. Non-destructive, dev-only.
2. **Demo save loader** — one button on the main menu (or Konami code) that installs the JSON above into `localStorage`.
3. **Gold cheat** — hotkey to +100 gold. Only for emergency recovery mid-demo.

Each is <10 minutes of code if scoped to a debug-only path. None of this should ship to the public build — gate behind a URL param or env check.

---

## Fallback plans (what can go wrong)

| Failure | Fallback |
|---|---|
| Game crashes / freezes on stage | Refresh, load demo save, say "live demo gods" — skip ahead 15s to still hit boss moment |
| Boss reaches server during boss fight | Immediately cut to pre-recorded clip with the transition line |
| Audio doesn't work | Pivot to narration over visuals; don't fight the tech |
| Projector resolution wrong | Don't resize the window mid-presentation; let the game letterbox |
| You forget a line | The visuals carry 80% of the demo. Just point and keep moving |

---

## Two-presenter variant

If you have two people, split it this way:

- **Presenter A** (storyteller): opening hook, narration during all demo segments, close.
- **Presenter B** (operator): all mouse/keyboard actions, watches the timer, handles the fallback pivot.

Benefits: A can face the audience while B looks at the screen. Narration doesn't stumble because the operator is not thinking about words.

Rehearse with a **shared timer** visible to both. Agree on hand signals for "speed up" and "pivot to video."

---

## Rehearsal notes

1. **Rehearse standing up with a real timer.** Seated rehearsal is 20% faster than live. Plan for 15% slowdown on stage from nerves.
2. **Rehearse the fallback pivot.** Practice the "here's what it looks like when it comes together" sentence until it sounds unrehearsed.
3. **Record one practice run.** Watch it back with sound. You will catch things you don't notice live.
4. **Know which sentence you'd cut if you're 15 seconds over.** Mine: the "run, earn, upgrade" line in the shop segment. Cut that first.
5. **Don't read the script on stage.** Internalize the five moments and improvise the connective tissue.

---

## One-sentence elevator version (if someone asks "what is it" off-stage)

> "Tower defense where you're a firewall defending a server from waves of internet threats — with run-based upgrades and an air lane that only your snipers can hit."

---

## Post-demo Q&A prep

Judges often ask:
- **"How long did it take?"** → Exact hours. Be specific.
- **"What's the tech stack?"** → Phaser 3, TypeScript, Vite. No external art assets.
- **"What's next?"** → Pick one: endless leaderboard, new tower types, mobile build, more enemies.
- **"Is it multiplayer?"** → No. Single-player by design. Add-on is possible.
- **"How did you split the work?"** → Name each person's track (level design, art, engineering).
