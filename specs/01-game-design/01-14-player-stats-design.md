# Player Stats Screen — Slim-Down

Trims the Stats screen from 7 rows to **4**, collapses the two "best wave" rows onto a single line, and drops the Roarer Points and Endless Mode lock/unlock rows (those have their own homes — Main Menu already shows RP balance and the Endless button state).

---

## Rows to show (in order)

1. **Best Wave Reached** — `Campaign: N • Endless: M` on one line. Pulls from `save.stats.bestWaveReached` and `save.stats.endlessBestWave`.
2. **Total Runs** — `save.stats.totalRuns`.
3. **Total Waves Cleared** — `save.stats.totalWavesCleared`.
4. **Total Enemies Killed** — `save.stats.totalEnemiesKilled`.

---

## Rows to remove

| Row | Reason |
|---|---|
| Roarer Points (current) | Already displayed on the Main Menu under the title. No reason to duplicate it in Stats. |
| Endless Mode (Locked / Unlocked) | The Main Menu button itself conveys lock state (greyed out + "[LOCKED]" text). Redundant here. |

The **underlying save data model doesn't change** — `PlayerStats` in `src/types/save.ts` keeps all five fields (`bestWaveReached` and `endlessBestWave` stay separate on disk; they're just joined on one visual row). No migration needed.

---

## Display format

The combined "Best Wave" row is formatted as:

```
Best Wave Reached        Campaign: 10 • Endless: 25
```

- Bullet separator (`•`) visually groups the two values without a table sub-split.
- If campaign has never been beaten (`bestWaveReached === 0`): show `Campaign: —` instead of `Campaign: 0`.
- If endless is locked / never played (`endlessBestWave === 0`): show `Endless: —`.
- Dashes apply **only to the Best Wave row**, not to the three Total rows (a Total of `0` is a real, meaningful zero).

The other three rows keep the current label-left / value-right row layout from `StatsScene.create()`.

---

## Visual layout

The existing layout in `src/scenes/StatsScene.ts` works fine — 600px-wide centered rows with muted labels (left) and bold values (right). Just:

- Remove the three deleted row entries from the `rows` array.
- Change the two "Best wave reached (campaign)" and "Best wave reached (endless)" entries into one combined row with the formatted string.
- The page will feel less dense (4 rows instead of 7); consider increasing `startY` from `180` → `240` and leaving `rowH` at `44` so the block stays vertically centered.

No new assets, no new widgets, no scrollbar — four rows fit trivially.

---

## Implementation pointers

Single-file change:

- `src/scenes/StatsScene.ts` — replace the `rows` array with four entries (combined best wave + three totals). Format the best-wave row as shown above. Add dash handling for zero values:

  ```
  const campaignBest = save.stats.bestWaveReached > 0 ? String(save.stats.bestWaveReached) : '—';
  const endlessBest = save.stats.endlessBestWave > 0 ? String(save.stats.endlessBestWave) : '—';
  const bestWaveValue = `Campaign: ${campaignBest} • Endless: ${endlessBest}`;
  ```

- Nudge `startY` so the 4-row block is vertically centered on the canvas.

No changes to `src/types/save.ts`, `src/systems/SaveManager.ts`, or anything else — this is purely a display trim.

---

## Interactions with other specs

- **`01-12-security-meter-design.md` (Security)** — mentions this scene's sweep-for-"Lives" pass in its implementation pointers. That pass still happens; it just happens on a 4-row scene now.
- **`01-13-shop-slimdown-design.md` (Shop slim-down)** — no overlap. Shop and stats are independent scenes.
- **No other spec references the removed rows.**

---

## Not in scope for this spec

- Dropping any fields from `PlayerStats` in the save schema. We keep the data; we just don't render two rows for it.
- Adding new stats (e.g., total gold earned, total towers placed, best run RP) — a separate spec if we want richer tracking.
- Historical "per-run" history or charts — strictly out of scope.
- Styling polish beyond spacing nudge (fonts, animations, per-row icons) — visual-design track.

