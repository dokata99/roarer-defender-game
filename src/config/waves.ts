import { ENEMY_CONFIGS } from './enemies';
import { makeEnemySpec, type EnemySpec } from '../entities/Enemy';

export interface WaveConfig {
  waveNumber: number;
  label: string;
  spawnIntervalMs: number;
  /** Ordered list of enemies to spawn this wave. */
  spawns: EnemySpec[];
}

export const TOTAL_CAMPAIGN_WAVES = 10;
export const TOTAL_WAVES = TOTAL_CAMPAIGN_WAVES; // Legacy alias for campaign scenes.

function campaignWave(
  waveNumber: number,
  label: string,
  spawnIntervalMs: number,
  spawns: EnemySpec[],
): WaveConfig {
  return { waveNumber, label, spawnIntervalMs, spawns };
}

function fastSpawns(count: number, hp: number): EnemySpec[] {
  const s = ENEMY_CONFIGS.fast.speedTilesPerSec;
  return Array.from({ length: count }, () => makeEnemySpec('fast', hp, s));
}

function eliteSpawns(count: number, hp: number): EnemySpec[] {
  const s = ENEMY_CONFIGS.elite.speedTilesPerSec;
  return Array.from({ length: count }, () => makeEnemySpec('elite', hp, s));
}

export const CAMPAIGN_WAVES: WaveConfig[] = [
  campaignWave(1, '8 Fast', 1000, fastSpawns(8, 15)),
  campaignWave(2, '12 Fast', 900, fastSpawns(12, 20)),
  campaignWave(3, '4 Elite', 2000, eliteSpawns(4, 80)),
  campaignWave(4, '15 Fast', 800, fastSpawns(15, 25)),
  campaignWave(5, '18 Fast', 700, fastSpawns(18, 30)),
  campaignWave(6, '5 Elite', 1800, eliteSpawns(5, 120)),
  campaignWave(7, '22 Fast', 600, fastSpawns(22, 35)),
  campaignWave(8, '25 Fast', 500, fastSpawns(25, 40)),
  campaignWave(9, '6 Elite', 1500, eliteSpawns(6, 200)),
  campaignWave(10, 'BOSS', 500, [makeEnemySpec('boss', 500)]),
];

/** Legacy accessor for code still expecting the old flat list (e.g. HUD preview). */
export function getCampaignWaveConfig(waveNumber: number): WaveConfig | null {
  return CAMPAIGN_WAVES.find((w) => w.waveNumber === waveNumber) ?? null;
}

/** Kept as an alias so earlier code keeps compiling. */
export const getWaveConfig = getCampaignWaveConfig;
