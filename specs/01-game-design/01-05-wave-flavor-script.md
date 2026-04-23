# Wave Flavor & Naming Script

Cyber-themed names, headlines, and moment text for the 20 campaign waves plus endless. Pure content — no code structure. The point is personality: a wave called "Trojan Dropper" lands harder than "Wave 3".

Pairs with `01-04-campaign-mode-design.md` (archetypes) and `02-01-visual-design-reference.md` (typography).

---

## Naming rules

1. **Networking / security jargon, not fantasy.** The theme is defending a server. Use words real sysadmins would say: packet, flood, trojan, payload, breach, exploit, port, scan, CVE, DNS, SYN, DDoS. Never: orc, goblin, wizard, demon.
2. **Two words max.** Short fits the HUD. "Port Scan" beats "Incoming Port Scan Attack".
3. **Escalation in tone.** Early waves = mechanical/technical ("Probe Packets"). Mid = aggressive ("Trojan Wave"). Late = catastrophic ("Zero Day Unleashed").
4. **Bosses get proper nouns.** Wave 10 and 20 are named things, not events.
5. **Flying waves sound aerial.** Ping Sweep, Air Strike, Drone Swarm — any word that implies "from above" or "fast reconnaissance."

---

## Campaign wave names (20 waves)

| # | Archetype | Primary name | Alt | Subtitle / flavor line |
|---|---|---|---|---|
| 1 | Tutorial Swarm | **First Contact** | Initial Probe | Unknown traffic at the gate. Hold the line. |
| 2 | Basic Swarm | **Probe Packets** | Recon Flood | They're scanning for weak spots. |
| 3 | First Elite | **Trojan Dropper** | Payload Inbound | Heavier packages — something's hiding inside. |
| 4 | Basic Swarm | **Script Kiddies** | Noise Flood | Low-skill attackers, high volume. |
| 5 | Rush Swarm | **SYN Flood** | Port Scan Blitz | The handshake never ends. |
| 6 | Elite Push | **Trojan Wave** | Dropper Storm | Coordinated dropper campaign. |
| 7 | First Flight | **Ping Sweep** | First Flight | Airborne recon. Ground defenses won't reach them. |
| 8 | Mixed Assault | **Combined Ops** | Dual Vector | They've stopped playing fair. |
| 9 | Mini-Boss | **Exploit Kit** | Privileged Access | Something's probing for admin rights. |
| 10 | **BOSS** | **ZERO DAY** | The Breach | Unknown vulnerability weaponized. |
| 11 | Basic Swarm | **Aftershock** | Recon Rebuilt | They regrouped. It's not over. |
| 12 | Elite Push | **Trojan Legion** | Dropper Swarm | Twice the payloads. Twice the pain. |
| 13 | Rush Swarm | **DDoS** | Traffic Flood | Maximum volume. Saturate or die. |
| 14 | Flight Swarm | **Air Strike** | Drone Swarm | The sky is the new attack surface. |
| 15 | Elite Push | **Lateral Movement** | Privilege Cascade | They're inside. They're spreading. |
| 16 | Basic Swarm | **Dark Cloud** | Botnet Rising | Volume at scale. |
| 17 | Gauntlet | **Kill Chain** | Full Spectrum | Every vector at once. |
| 18 | Flight + Ground | **Multi-Vector** | Dual Siege | Ground and air. Hold both. |
| 19 | Mini-Boss | **Final Payload** | Warhead | Staging for the main event. |
| 20 | **FINAL BOSS** | **ROOT ACCESS** | Total Breach | If this lands, nothing is yours anymore. |

---

## Moment text

### Pre-wave banner (shown during build phase)
```
WAVE 07 — PING SWEEP
"Airborne recon. Ground defenses won't reach them."
```

### Wave complete
Rotate through these so it doesn't get stale:
- "Threat neutralized."
- "Firewall holding."
- "Packets dropped."
- "Breach contained."
- "Signature logged."
- "Quarantine successful."

### Milestone callouts (big on-screen text)
| When | Text | Subtitle |
|---|---|---|
| After wave 5 | **FIRST WALL HELD** | "You're not a script kiddie anymore." |
| After wave 10 | **ZERO DAY PATCHED** | "The server lives." |
| After wave 15 | **LATERAL MOVEMENT CONTAINED** | "They're running out of vectors." |
| After wave 19 | **FINAL PAYLOAD INCOMING** | "Prepare for root access attempt." |
| After wave 20 | **INCIDENT CONTAINED** | "Endless mode unlocked." |

### Defeat screen
- Headline: **SYSTEM COMPROMISED**
- Subtitle: **"Breach at wave {N}."**
- Footer: *"Patch the weakness. Try again."*

### Victory screen
- Headline: **INCIDENT CONTAINED**
- Subtitle: **"The server is yours."**
- Footer: *"Endless mode online. The attack never stops."*

### Pause screen
- Header: **SYSTEM PAUSED**
- Footer: *"Threat actors awaiting signal."*

---

## Endless mode naming

Endless waves can use a generated pattern instead of hand-named. Suggested format:

```
WAVE 34 — SUSTAINED BREACH
Threat level: CRITICAL
```

Pick a word bank and a format string:

**Word bank by severity:**
- Low (w 21–30): Persistent, Sustained, Recurring, Escalating
- Med (w 31–45): Critical, Severe, Weaponized, Coordinated
- High (w 46+): Existential, Catastrophic, Apocalyptic, Untitled (a.k.a. "the unknown")

**Noun bank:**
Breach, Flood, Siege, Assault, Storm, Surge, Payload, Cascade

**Boss waves (every 5th):** replace subtitle with random CVE-style ID:
```
WAVE 35 — CVE-2026-0913
"Unidentified hostile signature."
```

(CVE is just formatting — not real; year · sequence numbers pulled from `Phaser.Math.Between`.)

---

## Implementation note

None of this exists in the code yet. Wiring required when it's time:

- **`src/ui/WavePreview.ts`** — currently displays wave number and enemy count. Add a `name` and `subtitle` field to the wave definition, and render them on the pre-wave banner.
- **Data location** — simplest path is a `src/config/waveFlavor.ts` file: a map from `waveNumber → { name, subtitle }`. Keeps `waves.ts` clean (pure mechanics) while flavor lives next to it.
- **Milestone callouts** — hook into the existing `waveComplete` event in `GameScene`; on specific wave numbers, show a large tween'd text overlay for ~2 seconds before the build phase banner appears.
- **Endless** — generate name/subtitle at wave-generation time in `endless.ts`, pick from the word banks with `Phaser.Math.RND.pick()`.
