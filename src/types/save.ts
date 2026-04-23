export interface ShopUpgrades {
  startingGold: number; // 0-5
  towerDamage: number; // 0-5
  towerSpeed: number; // 0-5
  discountUpgrades: number; // 0-3
}

export type ShopUpgradeId = keyof ShopUpgrades;

export interface PlayerStats {
  totalRuns: number;
  totalWavesCleared: number;
  totalEnemiesKilled: number;
  bestWaveReached: number;
  endlessBestWave: number;
}

export interface SaveData {
  roarerPoints: number;
  endlessModeUnlocked: boolean;
  shopUpgrades: ShopUpgrades;
  stats: PlayerStats;
}

export function defaultSave(): SaveData {
  return {
    roarerPoints: 0,
    endlessModeUnlocked: false,
    shopUpgrades: {
      startingGold: 0,
      towerDamage: 0,
      towerSpeed: 0,
      discountUpgrades: 0,
    },
    stats: {
      totalRuns: 0,
      totalWavesCleared: 0,
      totalEnemiesKilled: 0,
      bestWaveReached: 0,
      endlessBestWave: 0,
    },
  };
}
