import { STARTING_GOLD, STARTING_SECURITY } from '../config/gameplay';
import { TOWER_CONFIGS, type TowerType, type TowerLevelStats } from '../config/towers';
import type { ShopUpgrades } from '../types/save';

/**
 * Per-run derived values. Built from persistent shop upgrades at the start of each run.
 * Everything game-facing that can be modified by meta-progression flows through here,
 * so individual entities don't need to know about SaveData.
 */
export class RunContext {
  readonly startingGold: number;
  readonly startingSecurity: number;
  readonly upgradeCostMultiplier: number;
  readonly damageMultiplier: number;
  readonly attackIntervalMultiplier: number;

  constructor(upgrades: ShopUpgrades) {
    this.startingGold = STARTING_GOLD + 20 * upgrades.startingGold;
    this.startingSecurity = STARTING_SECURITY;

    this.upgradeCostMultiplier = Math.max(0, 1 - 0.1 * upgrades.discountUpgrades);
    this.damageMultiplier = 1 + 0.1 * upgrades.towerDamage;
    this.attackIntervalMultiplier = Math.pow(0.90, upgrades.towerSpeed);
  }

  /** Stats for a specific tower at a specific level, with all run-level upgrades applied. */
  getTowerStats(type: TowerType, level: number): TowerLevelStats {
    const base = TOWER_CONFIGS[type].levels[level - 1];
    return {
      cost: base.cost,
      damage: Math.max(1, Math.round(base.damage * this.damageMultiplier)),
      attackIntervalMs: Math.max(
        50,
        Math.round(base.attackIntervalMs * this.attackIntervalMultiplier),
      ),
      rangeTiles: base.rangeTiles,
      splashRadiusTiles: base.splashRadiusTiles,
      slowMultiplier: base.slowMultiplier,
      slowDurationMs: base.slowDurationMs,
    };
  }

  /** Cost to place a fresh tower (level 1). */
  getPlaceCost(type: TowerType): number {
    return this.getTowerStats(type, 1).cost;
  }

  /** Cost to upgrade a tower from its current level to the next. Discount-upgrades affects this. */
  getUpgradeCost(type: TowerType, nextLevel: number): number {
    const base = TOWER_CONFIGS[type].levels[nextLevel - 1].cost;
    return Math.max(1, Math.floor(base * this.upgradeCostMultiplier));
  }
}
