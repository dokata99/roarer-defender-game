import { PORTAL_CELLS } from '../config/constants';
import type { CellCoord } from './GridManager';
import type { WaveConfig } from '../config/waves';
import type { EnemySpec } from '../entities/Enemy';

export interface PendingSpawn {
  spec: EnemySpec;
  portal: CellCoord;
}

/**
 * Schedules enemy spawns across a single wave. Walks through the ordered spawns array
 * at the configured interval, cycling through PORTAL_CELLS deterministically.
 */
export class WaveManager {
  private active = false;
  private wave: WaveConfig | null = null;
  private spawnedCount = 0;
  private msUntilNextSpawn = 0;
  private portalIndex = 0;

  start(wave: WaveConfig): WaveConfig {
    this.wave = wave;
    this.active = true;
    this.spawnedCount = 0;
    this.msUntilNextSpawn = 0;
    this.portalIndex = 0;
    return wave;
  }

  isActive(): boolean {
    return this.active;
  }

  allSpawned(): boolean {
    return this.wave !== null && this.spawnedCount >= this.wave.spawns.length;
  }

  finish(): void {
    this.active = false;
    this.wave = null;
  }

  tick(deltaMs: number): PendingSpawn[] {
    if (!this.active || !this.wave) return [];
    if (this.spawnedCount >= this.wave.spawns.length) return [];

    const results: PendingSpawn[] = [];
    this.msUntilNextSpawn -= deltaMs;
    while (this.msUntilNextSpawn <= 0 && this.spawnedCount < this.wave.spawns.length) {
      const portal = PORTAL_CELLS[this.portalIndex % PORTAL_CELLS.length];
      const spec = this.wave.spawns[this.spawnedCount];
      results.push({ spec, portal: { col: portal.col, row: portal.row } });
      this.spawnedCount += 1;
      this.portalIndex += 1;
      this.msUntilNextSpawn += this.wave.spawnIntervalMs;
    }
    return results;
  }
}
