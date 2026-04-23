export type TowerType = 'splash' | 'sniper' | 'frost';

export const TOWER_ART_KEYS = {
  splashBody: 'tower-splash-bear',
  splashProjectile: 'proj-splash-bear',
  sniperBody: 'tower-sniper-bear',
  sniperProjectile: 'proj-sniper-bear',
  frostBody: 'tower-frost-bear',
  frostProjectile: 'proj-frost-bear',
} as const;

export interface TowerLevelStats {
  cost: number;
  damage: number;
  attackIntervalMs: number;
  rangeTiles: number;
  splashRadiusTiles?: number;
  /** Slow multiplier applied to enemies in splash radius (e.g. 0.6 = enemy moves at 60% speed). */
  slowMultiplier?: number;
  /** How long the slow lasts after a single hit. */
  slowDurationMs?: number;
}

export interface TowerArt {
  bodyKey: string;
  projectileKey?: string;
  /** Multiplier applied on top of the aspect-fit scale. Use to compensate for
   *  source PNGs that have extra transparent padding around the character. */
  bodyScaleMultiplier?: number;
}

export interface TowerTypeConfig {
  displayName: string;
  color: number;
  projectileColor: number;
  art?: TowerArt;
  levels: TowerLevelStats[];
}

export const TOWER_CONFIGS: Record<TowerType, TowerTypeConfig> = {
  splash: {
    displayName: 'Firewall',
    color: 0x00e5ff,
    projectileColor: 0x00e5ff,
    art: {
      bodyKey: TOWER_ART_KEYS.splashBody,
      projectileKey: TOWER_ART_KEYS.splashProjectile,
      bodyScaleMultiplier: 1.2,
    },
    levels: [
      { cost: 10, damage: 5, attackIntervalMs: 830, rangeTiles: 2.5, splashRadiusTiles: 1.0 },
      { cost: 15, damage: 8, attackIntervalMs: 710, rangeTiles: 2.5, splashRadiusTiles: 1.2 },
      { cost: 25, damage: 12, attackIntervalMs: 630, rangeTiles: 2.5, splashRadiusTiles: 1.5 },
    ],
  },
  sniper: {
    displayName: 'Killswitch',
    color: 0x3a86ff,
    projectileColor: 0xffffff,
    art: {
      bodyKey: TOWER_ART_KEYS.sniperBody,
      projectileKey: TOWER_ART_KEYS.sniperProjectile,
      bodyScaleMultiplier: 1.2,
    },
    levels: [
      { cost: 15, damage: 20, attackIntervalMs: 2000, rangeTiles: 4.0 },
      { cost: 20, damage: 35, attackIntervalMs: 1670, rangeTiles: 4.0 },
      { cost: 30, damage: 55, attackIntervalMs: 1430, rangeTiles: 4.0 },
    ],
  },
  frost: {
    displayName: 'Cryolock',
    color: 0x7ef4ff,
    projectileColor: 0x7ef4ff,
    art: {
      bodyKey: TOWER_ART_KEYS.frostBody,
      projectileKey: TOWER_ART_KEYS.frostProjectile,
      bodyScaleMultiplier: 1.2,
    },
    levels: [
      {
        cost: 12,
        damage: 2,
        attackIntervalMs: 1000,
        rangeTiles: 2.5,
        splashRadiusTiles: 1.0,
        slowMultiplier: 0.6,
        slowDurationMs: 1500,
      },
      {
        cost: 18,
        damage: 3,
        attackIntervalMs: 900,
        rangeTiles: 3.0,
        splashRadiusTiles: 1.2,
        slowMultiplier: 0.55,
        slowDurationMs: 1800,
      },
      {
        cost: 28,
        damage: 4,
        attackIntervalMs: 800,
        rangeTiles: 3.5,
        splashRadiusTiles: 1.5,
        slowMultiplier: 0.5,
        slowDurationMs: 2200,
      },
    ],
  },
};

export const MAX_TOWER_LEVEL = 3;
