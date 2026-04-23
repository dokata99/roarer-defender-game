import Phaser from 'phaser';
import { CELL_SIZE } from '../config/constants';
import { PROJECTILE_DEPTH, PROJECTILE_SPEED_PX_PER_SEC } from '../config/gameplay';
import type { Enemy } from './Enemy';

export interface ProjectileHit {
  damage: number;
  splashRadiusPx?: number;
  position: { x: number; y: number };
  primaryTarget?: Enemy;
}

export abstract class Projectile {
  x: number;
  y: number;
  readonly damage: number;
  done = false;
  protected circle: Phaser.GameObjects.Arc;
  protected trailColor: number;
  protected msSinceLastTrail = 0;

  constructor(
    protected scene: Phaser.Scene,
    color: number,
    radius: number,
    x: number,
    y: number,
    damage: number,
  ) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.trailColor = color;
    this.circle = scene.add.circle(x, y, radius, color).setDepth(PROJECTILE_DEPTH);
  }

  /** Returns a ProjectileHit if it should apply damage this frame, otherwise null. */
  abstract update(deltaSec: number): ProjectileHit | null;

  /** Spawn a fading dot behind the projectile, throttled to ~30/sec. */
  protected emitTrail(deltaSec: number, radius: number): void {
    this.msSinceLastTrail += deltaSec * 1000;
    if (this.msSinceLastTrail < 30) return;
    this.msSinceLastTrail = 0;
    const dot = this.scene.add
      .circle(this.x, this.y, radius, this.trailColor, 0.5)
      .setDepth(PROJECTILE_DEPTH - 1);
    this.scene.tweens.add({
      targets: dot,
      alpha: 0,
      scale: 0.3,
      duration: 200,
      onComplete: () => dot.destroy(),
    });
  }

  destroy(): void {
    this.circle.destroy();
  }
}

export class SniperProjectile extends Projectile {
  private target: Enemy;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number,
    target: Enemy,
    color: number,
  ) {
    super(scene, color, 5, x, y, damage);
    this.target = target;
  }

  update(deltaSec: number): ProjectileHit | null {
    if (!this.target.alive) {
      this.done = true;
      return null;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = PROJECTILE_SPEED_PX_PER_SEC * 1.5 * deltaSec;

    if (step >= dist) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.circle.setPosition(this.x, this.y);
      this.done = true;
      return {
        damage: this.damage,
        position: { x: this.x, y: this.y },
        primaryTarget: this.target,
      };
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.circle.setPosition(this.x, this.y);
    this.emitTrail(deltaSec, 3);
    return null;
  }
}

export class SplashProjectile extends Projectile {
  private targetX: number;
  private targetY: number;
  private splashRadiusTiles: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number,
    targetX: number,
    targetY: number,
    splashRadiusTiles: number,
    color: number,
  ) {
    super(scene, color, 6, x, y, damage);
    this.targetX = targetX;
    this.targetY = targetY;
    this.splashRadiusTiles = splashRadiusTiles;
  }

  update(deltaSec: number): ProjectileHit | null {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    const step = PROJECTILE_SPEED_PX_PER_SEC * deltaSec;

    if (step >= dist) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.circle.setPosition(this.x, this.y);
      this.done = true;
      return {
        damage: this.damage,
        position: { x: this.x, y: this.y },
        splashRadiusPx: this.splashRadiusTiles * CELL_SIZE,
      };
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.circle.setPosition(this.x, this.y);
    this.emitTrail(deltaSec, 4);
    return null;
  }

  /** Splash projectiles spawn a short-lived expanding explosion on hit. */
  spawnExplosion(): void {
    const finalRadius = this.splashRadiusTiles * CELL_SIZE;
    const ring = this.scene.add
      .circle(this.x, this.y, finalRadius, 0xffdd55, 0.5)
      .setDepth(PROJECTILE_DEPTH);
    ring.setScale(0.05);
    this.scene.tweens.add({
      targets: ring,
      scale: 1,
      alpha: 0,
      duration: 250,
      onComplete: () => ring.destroy(),
    });
  }
}
