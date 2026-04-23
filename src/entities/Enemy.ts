import Phaser from 'phaser';
import { CELL_SIZE } from '../config/constants';
import { ENEMY_CONFIGS, type EnemyType } from '../config/enemies';
import type { CellCoord } from '../systems/GridManager';
import type { GridManager } from '../systems/GridManager';
import { ENEMY_DEPTH, HP_BAR_DEPTH } from '../config/gameplay';

export type EnemyUpdateResult = 'alive' | 'reached-castle';

export interface EnemySpec {
  type: EnemyType;
  hp: number;
  speedTilesPerSec: number;
  goldOnKill: number;
}

/** Build an EnemySpec from the base type config, overriding per-wave values. */
export function makeEnemySpec(
  type: EnemyType,
  hp: number,
  speedTilesPerSec?: number,
  goldOnKill?: number,
): EnemySpec {
  const cfg = ENEMY_CONFIGS[type];
  return {
    type,
    hp,
    speedTilesPerSec: speedTilesPerSec ?? cfg.speedTilesPerSec,
    goldOnKill: goldOnKill ?? cfg.goldOnKill,
  };
}

export class Enemy {
  readonly type: EnemyType;
  readonly maxHp: number;
  hp: number;
  readonly goldOnKill: number;
  readonly livesLostOnReach: number;
  readonly speedPxPerSec: number;

  private circle: Phaser.GameObjects.Arc;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private hitFlashTween: Phaser.Tweens.Tween | null = null;

  x: number;
  y: number;
  private path: CellCoord[];
  private pathIndex = 0;

  alive = true;

  constructor(
    private scene: Phaser.Scene,
    private grid: GridManager,
    spec: EnemySpec,
    path: CellCoord[],
  ) {
    const cfg = ENEMY_CONFIGS[spec.type];
    this.type = spec.type;
    this.maxHp = spec.hp;
    this.hp = spec.hp;
    this.goldOnKill = spec.goldOnKill;
    this.livesLostOnReach = cfg.livesLostOnReach;
    this.speedPxPerSec = spec.speedTilesPerSec * CELL_SIZE;
    this.path = path;

    const spawn = grid.cellToPixel(path[0].col, path[0].row);
    this.x = spawn.x;
    this.y = spawn.y;
    this.pathIndex = 1;

    this.circle = scene.add.circle(this.x, this.y, cfg.radius, cfg.color);
    this.circle.setStrokeStyle(2, 0x000000, 0.6);
    this.circle.setDepth(ENEMY_DEPTH);

    const barWidth = cfg.radius * 2 + 4;
    const barHeight = 4;
    const barY = this.y - cfg.radius - 6;
    this.hpBarBg = scene.add
      .rectangle(this.x, barY, barWidth, barHeight, 0x440000)
      .setDepth(HP_BAR_DEPTH);
    this.hpBarFill = scene.add
      .rectangle(this.x - barWidth / 2, barY, barWidth, barHeight, 0x33ff66)
      .setOrigin(0, 0.5)
      .setDepth(HP_BAR_DEPTH);

    if (cfg.pulses) {
      this.pulseTween = scene.tweens.add({
        targets: this.circle,
        scale: { from: 0.9, to: 1.1 },
        yoyo: true,
        repeat: -1,
        duration: 600,
        ease: 'Sine.InOut',
      });
    }
  }

  update(deltaSec: number): EnemyUpdateResult {
    if (!this.alive) return 'alive';
    if (this.pathIndex >= this.path.length) return 'reached-castle';

    const target = this.grid.cellToPixel(
      this.path[this.pathIndex].col,
      this.path[this.pathIndex].row,
    );
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speedPxPerSec * deltaSec;

    if (step >= dist) {
      this.x = target.x;
      this.y = target.y;
      this.pathIndex += 1;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }

    this.refreshVisualPosition();

    if (this.pathIndex >= this.path.length) return 'reached-castle';
    return 'alive';
  }

  private refreshVisualPosition(): void {
    this.circle.setPosition(this.x, this.y);
    const cfg = ENEMY_CONFIGS[this.type];
    const barWidth = cfg.radius * 2 + 4;
    const barY = this.y - cfg.radius - 6;
    this.hpBarBg.setPosition(this.x, barY);
    this.hpBarFill.setPosition(this.x - barWidth / 2, barY);
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpBarFill.setScale(ratio, 1);
  }

  takeDamage(amount: number): boolean {
    if (!this.alive) return false;
    this.hp -= amount;
    this.refreshVisualPosition();
    this.playHitFlash();
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  private playHitFlash(): void {
    if (this.hitFlashTween) {
      this.hitFlashTween.remove();
    }
    this.circle.setFillStyle(0xffffff);
    this.hitFlashTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 120,
      onComplete: () => {
        this.circle.setFillStyle(ENEMY_CONFIGS[this.type].color);
      },
    });
  }

  destroy(): void {
    this.circle.destroy();
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    if (this.pulseTween) this.pulseTween.stop();
    if (this.hitFlashTween) this.hitFlashTween.stop();
  }

  /** New path (for pathfinding replan between waves). Currently unused — paths are locked per-wave. */
  setPath(path: CellCoord[]): void {
    this.path = path;
    this.pathIndex = 1;
  }
}
