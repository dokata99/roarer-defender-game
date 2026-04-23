import type { ShopUpgradeId } from '../types/save';

export interface UpgradeConfig {
  id: ShopUpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  /** Per-level RP cost, indexed by the level being purchased (0 = lvl 1, 1 = lvl 2, …). */
  costs: number[];
  /** Short blurb describing one level's effect, e.g. "+20 gold". */
  perLevelEffect: string;
}

export const UPGRADE_CONFIGS: UpgradeConfig[] = [
  {
    id: 'startingGold',
    name: 'Starting Gold+',
    description: 'Begin each run with more gold.',
    maxLevel: 5,
    costs: [3, 6, 10, 15, 22],
    perLevelEffect: '+20 gold',
  },
  {
    id: 'towerDamage',
    name: 'Tower Damage+',
    description: 'All towers deal more damage.',
    maxLevel: 5,
    costs: [4, 8, 13, 19, 27],
    perLevelEffect: '+10% damage',
  },
  {
    id: 'towerSpeed',
    name: 'Tower Speed+',
    description: 'All towers attack faster.',
    maxLevel: 5,
    costs: [4, 8, 13, 19, 27],
    perLevelEffect: '-10% attack interval',
  },
  {
    id: 'towerRange',
    name: 'Tower Range+',
    description: 'All towers have more range.',
    maxLevel: 3,
    costs: [5, 10, 17],
    perLevelEffect: '+0.5 tile range',
  },
  {
    id: 'discountTowers',
    name: 'Discount Towers',
    description: 'Towers cost less gold to place.',
    maxLevel: 3,
    costs: [5, 11, 18],
    perLevelEffect: '-10% tower cost',
  },
  {
    id: 'discountUpgrades',
    name: 'Discount Upgrades',
    description: 'Tower upgrades cost less gold.',
    maxLevel: 3,
    costs: [5, 11, 18],
    perLevelEffect: '-10% upgrade cost',
  },
  {
    id: 'killBounty',
    name: 'Kill Bounty+',
    description: 'Enemies drop more gold.',
    maxLevel: 5,
    costs: [4, 9, 15, 22, 30],
    perLevelEffect: '+15% gold per kill',
  },
  {
    id: 'splashRadius',
    name: 'Splash Radius+',
    description: 'Splash tower AoE is larger.',
    maxLevel: 3,
    costs: [6, 12, 20],
    perLevelEffect: '+0.3 tile splash radius',
  },
  {
    id: 'sniperCrit',
    name: 'Sniper Crit',
    description: 'Sniper tower has a chance to crit for 2× damage.',
    maxLevel: 3,
    costs: [7, 14, 22],
    perLevelEffect: '+10% crit chance',
  },
];

export function getUpgradeConfig(id: ShopUpgradeId): UpgradeConfig {
  const cfg = UPGRADE_CONFIGS.find((u) => u.id === id);
  if (!cfg) throw new Error(`Unknown upgrade id: ${id}`);
  return cfg;
}

/** Returns the RP cost of the NEXT level, or null if already maxed. */
export function nextLevelCost(id: ShopUpgradeId, currentLevel: number): number | null {
  const cfg = getUpgradeConfig(id);
  if (currentLevel >= cfg.maxLevel) return null;
  return cfg.costs[currentLevel];
}
