export type EnemyType = 'fast' | 'elite' | 'boss';

export interface EnemyTypeConfig {
  displayName: string;
  speedTilesPerSec: number;
  goldOnKill: number;
  livesLostOnReach: number;
  color: number;
  radius: number;
  pulses: boolean;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyTypeConfig> = {
  fast: {
    displayName: 'Fast',
    speedTilesPerSec: 3,
    goldOnKill: 2,
    livesLostOnReach: 1,
    color: 0x55dd66,
    radius: 10,
    pulses: false,
  },
  elite: {
    displayName: 'Elite',
    speedTilesPerSec: 1.5,
    goldOnKill: 8,
    livesLostOnReach: 5,
    color: 0xff9933,
    radius: 16,
    pulses: false,
  },
  boss: {
    displayName: 'Boss',
    speedTilesPerSec: 1,
    goldOnKill: 50,
    livesLostOnReach: 999,
    color: 0xff3333,
    radius: 26,
    pulses: true,
  },
};
