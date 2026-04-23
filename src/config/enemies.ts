export type EnemyType = 'fast' | 'elite' | 'boss' | 'flying';

export const ENEMY_ART_KEYS = {
  fast: 'enemy-bug',
  elite: 'enemy-ogre',
  flying: 'enemy-dragon',
  boss: 'enemy-scope-creep',
} as const;

export interface EnemyArt {
  bodyKey: string;
}

export interface EnemyTypeConfig {
  displayName: string;
  speedTilesPerSec: number;
  goldOnKill: number;
  securityLostOnReach: number;
  color: number;
  radius: number;
  pulses: boolean;
  /** Flying enemies bypass the grid path and are only targetable by snipers. */
  flying?: boolean;
  /**
   * Slow-resistance in [0, 1]. 0 = full slow applies, 1 = immune.
   * Effective slow multiplier = 1 - (1 - slowMultiplier) * (1 - slowResistance).
   * See specs/01-game-design/01-11-frost-tower-design.md.
   */
  slowResistance: number;
  /** Optional sprite art. Falls back to procedural drawing when texture isn't loaded. */
  art?: EnemyArt;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyTypeConfig> = {
  fast: {
    displayName: 'Worm',
    speedTilesPerSec: 3,
    goldOnKill: 2,
    securityLostOnReach: 5,
    color: 0xb7ff00,
    radius: 10,
    pulses: false,
    slowResistance: 0,
    art: { bodyKey: ENEMY_ART_KEYS.fast },
  },
  elite: {
    displayName: 'Trojan',
    speedTilesPerSec: 1.5,
    goldOnKill: 8,
    securityLostOnReach: 15,
    color: 0xff6b35,
    radius: 16,
    pulses: false,
    slowResistance: 0,
    art: { bodyKey: ENEMY_ART_KEYS.elite },
  },
  boss: {
    displayName: 'Zero-Day',
    speedTilesPerSec: 1,
    goldOnKill: 50,
    securityLostOnReach: 90,
    color: 0xff2e63,
    radius: 26,
    pulses: true,
    slowResistance: 0.5,
    art: { bodyKey: ENEMY_ART_KEYS.boss },
  },
  flying: {
    displayName: 'Packet',
    speedTilesPerSec: 2,
    goldOnKill: 5,
    securityLostOnReach: 10,
    color: 0xff3cf2,
    radius: 11,
    pulses: false,
    flying: true,
    slowResistance: 0.5,
    art: { bodyKey: ENEMY_ART_KEYS.flying },
  },
};
