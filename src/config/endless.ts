import { makeEnemySpec, type EnemySpec } from '../entities/Enemy';
import type { WaveConfig } from './waves';

/**
 * Endless mode scaling, per game-spec 01-01-game-spec.md § "Endless Mode".
 *
 * Starts at wave 11 using the campaign state as baseline. A 5-wave cycle repeats:
 *   pos 0: normal (fast swarm)
 *   pos 1: mixed (fast + a few elites)
 *   pos 2: elite-heavy
 *   pos 3: mixed, heavier
 *   pos 4: boss (+ fast escorts)
 */

const FAST_SPEED_BASE = 3.0;
const ELITE_SPEED_BASE = 1.5;
const BOSS_SPEED_BASE = 1.0;

const FAST_SPEED_CAP = 5.0;
const ELITE_SPEED_CAP = 3.0;
const BOSS_SPEED_CAP = 1.8;

const FAST_COUNT_CAP = 50;
const ELITE_COUNT_CAP = 15;

const FAST_HP_BASE = 45;
const ELITE_HP_BASE = 220;
const BOSS_HP_BASE = 600;
const BOSS_HP_MULT = 2.5;

const FAST_GOLD_BASE = 2;
const ELITE_GOLD_BASE = 8;
const BOSS_GOLD_BASE = 50;

const GOLD_GROWTH = 1.06;
const HP_GROWTH = 1.12;
const SPEED_GROWTH_COEFF = 0.08;
const SPAWN_INTERVAL_FLOOR = 300;

const fastHp = (n: number) => FAST_HP_BASE * Math.pow(HP_GROWTH, n - 10);
const eliteHp = (n: number) => ELITE_HP_BASE * Math.pow(HP_GROWTH, n - 10);
const bossHp = (n: number) => BOSS_HP_BASE * Math.pow(HP_GROWTH, n - 10) * BOSS_HP_MULT;

const fastCount = (n: number) => Math.min(8 + Math.floor((n - 10) * 1.5), FAST_COUNT_CAP);
const eliteCount = (n: number) => Math.min(4 + Math.floor((n - 10) * 0.3), ELITE_COUNT_CAP);

const speed = (n: number, base: number, cap: number) =>
  Math.min(base * (1 + SPEED_GROWTH_COEFF * Math.log(Math.max(1, n - 9))), cap);

const fastSpeed = (n: number) => speed(n, FAST_SPEED_BASE, FAST_SPEED_CAP);
const eliteSpeed = (n: number) => speed(n, ELITE_SPEED_BASE, ELITE_SPEED_CAP);
const bossSpeed = (n: number) => speed(n, BOSS_SPEED_BASE, BOSS_SPEED_CAP);

const gold = (n: number, base: number) =>
  Math.max(1, Math.round(base * Math.pow(GOLD_GROWTH, n - 10)));
const fastGold = (n: number) => gold(n, FAST_GOLD_BASE);
const eliteGold = (n: number) => gold(n, ELITE_GOLD_BASE);
const bossGold = (n: number) => gold(n, BOSS_GOLD_BASE);

const spawnInterval = (n: number) =>
  Math.max(SPAWN_INTERVAL_FLOOR, Math.round(1200 * Math.pow(0.97, n - 10)));

function makeFastSpawn(n: number, hp: number): EnemySpec {
  return makeEnemySpec('fast', hp, fastSpeed(n), fastGold(n));
}

function makeEliteSpawn(n: number, hp: number): EnemySpec {
  return makeEnemySpec('elite', hp, eliteSpeed(n), eliteGold(n));
}

function makeBossSpawn(n: number, hp: number): EnemySpec {
  return makeEnemySpec('boss', hp, bossSpeed(n), bossGold(n));
}

/** Endless wave generator. Only valid for n >= 11. */
export function buildEndlessWave(n: number): WaveConfig {
  if (n < 11) {
    throw new Error(`buildEndlessWave requires n >= 11, got ${n}`);
  }
  const cyclePos = (n - 11) % 5;
  const interval = spawnInterval(n);
  const fHp = Math.round(fastHp(n));
  const eHp = Math.round(eliteHp(n));
  const bHp = Math.round(bossHp(n));

  let spawns: EnemySpec[];
  let label: string;

  if (cyclePos === 0) {
    const count = fastCount(n);
    spawns = Array.from({ length: count }, () => makeFastSpawn(n, fHp));
    label = `${count} Fast`;
  } else if (cyclePos === 1) {
    const fastN = Math.max(1, Math.floor(fastCount(n) * 0.8));
    const eliteN = Math.max(1, Math.floor(eliteCount(n) * 0.3));
    spawns = interleaveFastElite(
      fastN,
      eliteN,
      () => makeFastSpawn(n, fHp),
      () => makeEliteSpawn(n, eHp),
    );
    label = `${fastN} Fast + ${eliteN} Elite`;
  } else if (cyclePos === 2) {
    const count = eliteCount(n);
    spawns = Array.from({ length: count }, () => makeEliteSpawn(n, eHp));
    label = `${count} Elite`;
  } else if (cyclePos === 3) {
    const fastN = fastCount(n);
    const eliteN = Math.max(2, Math.floor(eliteCount(n) * 0.6));
    spawns = interleaveFastElite(
      fastN,
      eliteN,
      () => makeFastSpawn(n, fHp),
      () => makeEliteSpawn(n, eHp),
    );
    label = `${fastN} Fast + ${eliteN} Elite`;
  } else {
    const escorts = Math.floor(fastCount(n) / 3);
    spawns = [makeBossSpawn(n, bHp)];
    for (let i = 0; i < escorts; i++) spawns.push(makeFastSpawn(n, fHp));
    label = `BOSS + ${escorts} Escort`;
  }

  return { waveNumber: n, label, spawnIntervalMs: interval, spawns };
}

/**
 * Interleaves fast/elite enemies so elites appear roughly evenly through the wave.
 * Example with 10 fast + 3 elite → F F F E F F F E F F F E F.
 */
function interleaveFastElite(
  fastN: number,
  eliteN: number,
  mkFast: () => EnemySpec,
  mkElite: () => EnemySpec,
): EnemySpec[] {
  const total = fastN + eliteN;
  if (eliteN === 0) return Array.from({ length: fastN }, mkFast);
  const gap = total / eliteN;
  const result: EnemySpec[] = [];
  let fastLeft = fastN;
  let eliteLeft = eliteN;
  let nextEliteAt = Math.floor(gap);
  for (let i = 0; i < total; i++) {
    if (eliteLeft > 0 && i >= nextEliteAt) {
      result.push(mkElite());
      eliteLeft -= 1;
      nextEliteAt = Math.floor((eliteN - eliteLeft + 1) * gap);
    } else if (fastLeft > 0) {
      result.push(mkFast());
      fastLeft -= 1;
    } else if (eliteLeft > 0) {
      result.push(mkElite());
      eliteLeft -= 1;
    }
  }
  return result;
}
