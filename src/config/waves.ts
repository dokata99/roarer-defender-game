import { ENEMY_CONFIGS, type EnemyType } from './enemies';
import { makeEnemySpec, type EnemySpec } from '../entities/Enemy';

export interface WaveConfig {
  waveNumber: number;
  label: string;
  spawnIntervalMs: number;
  /** Ordered list of enemies to spawn this wave. */
  spawns: EnemySpec[];
}

export const TOTAL_CAMPAIGN_WAVES = 20;
export const TOTAL_WAVES = TOTAL_CAMPAIGN_WAVES; // Legacy alias for campaign scenes.
/** Endless mode reuses only the first N campaign waves as a warm-up before switching to scaling. */
export const ENDLESS_WARMUP_WAVES = 10;

function campaignWave(
  waveNumber: number,
  label: string,
  spawnIntervalMs: number,
  spawns: EnemySpec[],
): WaveConfig {
  return { waveNumber, label, spawnIntervalMs, spawns };
}

function spawnsOf(type: EnemyType, count: number, hp: number): EnemySpec[] {
  const s = ENEMY_CONFIGS[type].speedTilesPerSec;
  return Array.from({ length: count }, () => makeEnemySpec(type, hp, s));
}

function fastSpawns(count: number, hp: number): EnemySpec[] {
  return spawnsOf('fast', count, hp);
}

function eliteSpawns(count: number, hp: number): EnemySpec[] {
  return spawnsOf('elite', count, hp);
}

function flyingSpawns(count: number, hp: number): EnemySpec[] {
  return spawnsOf('flying', count, hp);
}

/**
 * Interleaves a ground swarm with a smaller pack so the pack spreads evenly through the wave.
 * Example 10 ground + 3 pack → G G G P G G G P G G G P G.
 */
function interleave(ground: EnemySpec[], pack: EnemySpec[]): EnemySpec[] {
  if (pack.length === 0) return ground;
  if (ground.length === 0) return pack;
  const total = ground.length + pack.length;
  const gap = total / pack.length;
  const result: EnemySpec[] = [];
  let gi = 0;
  let pi = 0;
  let nextPackAt = Math.floor(gap);
  for (let i = 0; i < total; i++) {
    if (pi < pack.length && i >= nextPackAt) {
      result.push(pack[pi++]);
      nextPackAt = Math.floor((pi + 1) * gap);
    } else if (gi < ground.length) {
      result.push(ground[gi++]);
    } else if (pi < pack.length) {
      result.push(pack[pi++]);
    }
  }
  return result;
}

const sec = (s: number) => Math.round(s * 1000);

/**
 * Campaign wave table — hand-tuned per specs/01-game-design/01-04-campaign-mode-design.md.
 * Arc 1 (1-5): Tutorial + first wall.  Arc 2 (6-10): Upgrade pressure + first boss.
 * Arc 3 (11-15): Strategy required.    Arc 4 (16-20): Max investment + final boss.
 */
export const CAMPAIGN_WAVES: WaveConfig[] = [
  // Arc 1 — Tutorial + first wall
  campaignWave(1, '8 Fast', sec(0.95), fastSpawns(8, 40)),
  campaignWave(2, '14 Fast', sec(0.8), fastSpawns(14, 65)),
  campaignWave(3, '3 Elite', sec(1.9), eliteSpawns(3, 220)),
  campaignWave(4, '16 Fast', sec(0.7), fastSpawns(16, 95)),
  campaignWave(5, '24 Fast (Rush)', sec(0.55), fastSpawns(24, 135)),

  // Arc 2 — Upgrade pressure + first boss
  campaignWave(6, '4 Elite', sec(1.6), eliteSpawns(4, 420)),
  campaignWave(7, '12 Flying (new!)', sec(0.85), flyingSpawns(12, 35)),
  campaignWave(
    8,
    '20 Fast + 2 Elite',
    sec(0.55),
    interleave(fastSpawns(20, 220), eliteSpawns(2, 500)),
  ),
  campaignWave(9, '2 Mini-Boss', sec(2.0), eliteSpawns(2, 1100)),
  campaignWave(10, 'BOSS', 500, [makeEnemySpec('boss', 2200)]),

  // Arc 3 — Strategy required
  campaignWave(11, '32 Fast', sec(0.45), fastSpawns(32, 340)),
  campaignWave(12, '5 Elite', sec(1.4), eliteSpawns(5, 1000)),
  campaignWave(13, '40 Fast (Rush)', sec(0.38), fastSpawns(40, 440)),
  campaignWave(14, '22 Flying (Swarm)', sec(0.5), flyingSpawns(22, 140)),
  campaignWave(15, '6 Elite', sec(1.2), eliteSpawns(6, 1500)),

  // Arc 4 — Max investment + final boss
  campaignWave(16, '42 Fast', sec(0.35), fastSpawns(42, 720)),
  campaignWave(
    17,
    'Gauntlet: 30 Fast + 6 Elite',
    sec(0.3),
    interleave(fastSpawns(30, 800), eliteSpawns(6, 1700)),
  ),
  campaignWave(
    18,
    '30 Fast + 12 Flying',
    sec(0.32),
    interleave(fastSpawns(30, 900), flyingSpawns(12, 220)),
  ),
  campaignWave(19, '8 Mini-Boss', sec(0.9), eliteSpawns(8, 2400)),
  campaignWave(20, 'FINAL BOSS', 500, [
    // Final boss is near-immune to slow per 01-11 (ROOT ACCESS exception).
    makeEnemySpec('boss', 9000, undefined, undefined, 0.9),
  ]),
];

/** Legacy accessor for code still expecting the old flat list (e.g. HUD preview). */
export function getCampaignWaveConfig(waveNumber: number): WaveConfig | null {
  return CAMPAIGN_WAVES.find((w) => w.waveNumber === waveNumber) ?? null;
}

/** Kept as an alias so earlier code keeps compiling. */
export const getWaveConfig = getCampaignWaveConfig;
