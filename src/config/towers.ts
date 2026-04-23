export type TowerType = 'splash' | 'sniper';

export interface TowerLevelStats {
  cost: number;
  damage: number;
  attackIntervalMs: number;
  rangeTiles: number;
  splashRadiusTiles?: number;
}

export interface TowerTypeConfig {
  displayName: string;
  color: number;
  projectileColor: number;
  levels: TowerLevelStats[];
}

export const TOWER_CONFIGS: Record<TowerType, TowerTypeConfig> = {
  splash: {
    displayName: 'Splash',
    color: 0x3f6bff,
    projectileColor: 0xffdd55,
    levels: [
      { cost: 10, damage: 5, attackIntervalMs: 830, rangeTiles: 2.5, splashRadiusTiles: 1.0 },
      { cost: 15, damage: 8, attackIntervalMs: 710, rangeTiles: 3.0, splashRadiusTiles: 1.2 },
      { cost: 25, damage: 12, attackIntervalMs: 630, rangeTiles: 3.5, splashRadiusTiles: 1.5 },
    ],
  },
  sniper: {
    displayName: 'Sniper',
    color: 0xff4455,
    projectileColor: 0xffffff,
    levels: [
      { cost: 15, damage: 20, attackIntervalMs: 2000, rangeTiles: 4.0 },
      { cost: 20, damage: 35, attackIntervalMs: 1670, rangeTiles: 5.0 },
      { cost: 30, damage: 55, attackIntervalMs: 1430, rangeTiles: 6.0 },
    ],
  },
};

export const MAX_TOWER_LEVEL = 3;
