import type { EnemySpec } from '../entities/Enemy';
import type { WaveConfig } from './waves';

export type PathTier = 'normal' | 'elite' | 'boss';

export const PATH_TILE_DEPTH = 2;

export const PATH_TEXTURE_KEYS: Record<PathTier, string> = {
  normal: 'path-tile-grass',
  elite: 'path-tile-cobble',
  boss: 'path-tile-brick',
};

export function tierFromWave(wave: WaveConfig | null): PathTier {
  if (!wave) return 'normal';
  const hasBoss = wave.spawns.some((s: EnemySpec) => s.type === 'boss');
  if (hasBoss) return 'boss';
  const hasElite = wave.spawns.some((s: EnemySpec) => s.type === 'elite');
  if (hasElite) return 'elite';
  return 'normal';
}
