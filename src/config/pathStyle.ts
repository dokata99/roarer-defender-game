import type { EnemySpec } from '../entities/Enemy';
import type { WaveConfig } from './waves';

export type PathTier = 'normal' | 'elite' | 'boss';

export const PATH_TILE_DEPTH = 2;
export const PATH_LINE_DEPTH = 3;

export const PATH_TEXTURE_KEYS: Record<PathTier, string> = {
  normal: 'path-tile-grass',
  elite: 'path-tile-cobble',
  boss: 'path-tile-brick',
};

export interface PathLineStyle {
  color: number;
  width: number;
  alpha: number;
  pulse?: { from: number; to: number; hz: number };
  dash?: [number, number];
}

export const PATH_LINE_STYLES: Record<PathTier, PathLineStyle> = {
  normal: { color: 0xff4d4d, width: 2, alpha: 0.28 },
  elite: { color: 0xff8c42, width: 2.5, alpha: 0.38, dash: [8, 4] },
  boss: {
    color: 0xff2e63,
    width: 3,
    alpha: 0.45,
    pulse: { from: 0.3, to: 0.6, hz: 1.5 },
  },
};

export function tierFromWave(wave: WaveConfig | null): PathTier {
  if (!wave) return 'normal';
  const hasBoss = wave.spawns.some((s: EnemySpec) => s.type === 'boss');
  if (hasBoss) return 'boss';
  const hasElite = wave.spawns.some((s: EnemySpec) => s.type === 'elite');
  if (hasElite) return 'elite';
  return 'normal';
}
