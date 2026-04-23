import Phaser from 'phaser';

/**
 * Wave flavor: cyber-themed names, subtitles, and milestone text per
 * specs/01-game-design/01-05-wave-flavor-script.md. Kept separate from
 * waves.ts so mechanics stay free of cosmetic strings.
 */

export interface WaveFlavor {
  /** Short, all-caps name shown on the pre-wave banner (e.g. "PING SWEEP"). */
  name: string;
  /** One-line flavor/subtitle below the name. */
  subtitle: string;
}

export interface MilestoneText {
  headline: string;
  subtitle: string;
}

const CAMPAIGN_FLAVOR: Record<number, WaveFlavor> = {
  1: { name: 'FIRST CONTACT', subtitle: 'Unknown traffic at the gate. Hold the line.' },
  2: { name: 'PROBE PACKETS', subtitle: "They're scanning for weak spots." },
  3: { name: 'TROJAN DROPPER', subtitle: "Heavier packages — something's hiding inside." },
  4: { name: 'SCRIPT KIDDIES', subtitle: 'Low-skill attackers, high volume.' },
  5: { name: 'SYN FLOOD', subtitle: 'The handshake never ends.' },
  6: { name: 'TROJAN WAVE', subtitle: 'Coordinated dropper campaign.' },
  7: { name: 'PING SWEEP', subtitle: "Airborne recon. Ground defenses won't reach them." },
  8: { name: 'COMBINED OPS', subtitle: "They've stopped playing fair." },
  9: { name: 'EXPLOIT KIT', subtitle: "Something's probing for admin rights." },
  10: { name: 'ZERO DAY', subtitle: 'Unknown vulnerability weaponized.' },
  11: { name: 'AFTERSHOCK', subtitle: "They regrouped. It's not over." },
  12: { name: 'TROJAN LEGION', subtitle: 'Twice the payloads. Twice the pain.' },
  13: { name: 'DDOS', subtitle: 'Maximum volume. Saturate or die.' },
  14: { name: 'AIR STRIKE', subtitle: 'The sky is the new attack surface.' },
  15: { name: 'LATERAL MOVEMENT', subtitle: "They're inside. They're spreading." },
  16: { name: 'DARK CLOUD', subtitle: 'Volume at scale.' },
  17: { name: 'KILL CHAIN', subtitle: 'Every vector at once.' },
  18: { name: 'MULTI-VECTOR', subtitle: 'Ground and air. Hold both.' },
  19: { name: 'FINAL PAYLOAD', subtitle: 'Staging for the main event.' },
  20: { name: 'ROOT ACCESS', subtitle: 'If this lands, nothing is yours anymore.' },
};

const MILESTONES: Record<number, MilestoneText> = {
  5: { headline: 'FIRST WALL HELD', subtitle: "You're not a script kiddie anymore." },
  10: { headline: 'ZERO DAY PATCHED', subtitle: 'The server lives.' },
  15: { headline: 'LATERAL MOVEMENT CONTAINED', subtitle: "They're running out of vectors." },
  19: { headline: 'FINAL PAYLOAD INCOMING', subtitle: 'Prepare for root access attempt.' },
  20: { headline: 'INCIDENT CONTAINED', subtitle: 'Endless mode unlocked.' },
};

const WAVE_COMPLETE_MESSAGES: readonly string[] = [
  'Threat neutralized.',
  'Firewall holding.',
  'Packets dropped.',
  'Breach contained.',
  'Signature logged.',
  'Quarantine successful.',
];

/** Endless severity banks — early (w 21-30), mid (w 31-45), late (w 46+). */
const ENDLESS_SEVERITY_LOW: readonly string[] = ['PERSISTENT', 'SUSTAINED', 'RECURRING', 'ESCALATING'];
const ENDLESS_SEVERITY_MED: readonly string[] = ['CRITICAL', 'SEVERE', 'WEAPONIZED', 'COORDINATED'];
const ENDLESS_SEVERITY_HIGH: readonly string[] = ['EXISTENTIAL', 'CATASTROPHIC', 'APOCALYPTIC', 'UNTITLED'];

const ENDLESS_NOUNS: readonly string[] = [
  'BREACH',
  'FLOOD',
  'SIEGE',
  'ASSAULT',
  'STORM',
  'SURGE',
  'PAYLOAD',
  'CASCADE',
];

export function getCampaignFlavor(waveNumber: number): WaveFlavor | null {
  return CAMPAIGN_FLAVOR[waveNumber] ?? null;
}

export function getMilestoneForWave(waveNumber: number): MilestoneText | null {
  return MILESTONES[waveNumber] ?? null;
}

/** Rotating "wave complete" message — uses Phaser's global RNG for reproducibility with seed. */
export function pickWaveCompleteMessage(): string {
  return Phaser.Math.RND.pick(WAVE_COMPLETE_MESSAGES as string[]);
}

function severityBank(waveNumber: number): readonly string[] {
  if (waveNumber <= 30) return ENDLESS_SEVERITY_LOW;
  if (waveNumber <= 45) return ENDLESS_SEVERITY_MED;
  return ENDLESS_SEVERITY_HIGH;
}

function threatLevelFor(waveNumber: number): string {
  if (waveNumber <= 30) return 'ELEVATED';
  if (waveNumber <= 45) return 'CRITICAL';
  return 'EXISTENTIAL';
}

/** Endless bosses appear every 5th wave (cyclePos 4 in endless.ts): n = 15, 20, 25, … */
function isEndlessBossWave(waveNumber: number): boolean {
  return waveNumber >= 15 && (waveNumber - 10) % 5 === 0;
}

function buildEndlessFlavor(waveNumber: number): WaveFlavor {
  if (isEndlessBossWave(waveNumber)) {
    const seq = Phaser.Math.Between(100, 9999);
    return {
      name: `CVE-2026-${seq.toString().padStart(4, '0')}`,
      subtitle: 'Unidentified hostile signature.',
    };
  }
  const severity = Phaser.Math.RND.pick(severityBank(waveNumber) as string[]);
  const noun = Phaser.Math.RND.pick(ENDLESS_NOUNS as string[]);
  return {
    name: `${severity} ${noun}`,
    subtitle: `Threat level: ${threatLevelFor(waveNumber)}`,
  };
}

const endlessCache = new Map<number, WaveFlavor>();

/** Cached per run so re-rendering the HUD doesn't reshuffle the name each frame. */
export function getEndlessFlavor(waveNumber: number): WaveFlavor {
  const cached = endlessCache.get(waveNumber);
  if (cached) return cached;
  const flavor = buildEndlessFlavor(waveNumber);
  endlessCache.set(waveNumber, flavor);
  return flavor;
}

export function resetEndlessFlavorCache(): void {
  endlessCache.clear();
}
