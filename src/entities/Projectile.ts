import Phaser from 'phaser';
import { CELL_SIZE } from '../config/constants';
import { PROJECTILE_DEPTH, PROJECTILE_SPEED_PX_PER_SEC } from '../config/gameplay';
import type { Enemy } from './Enemy';

export interface ProjectileSlowPayload {
  multiplier: number;
  durationMs: number;
}

export interface ProjectileHit {
  damage: number;
  splashRadiusPx?: number;
  position: { x: number; y: number };
  primaryTarget?: Enemy;
  /** If present, splash AoE applies this slow to every enemy in radius. */
  slow?: ProjectileSlowPayload;
  /** Splash hits can opt into damaging flying enemies (Cryolock does, Firewall does not). */
  canHitFlying?: boolean;
}

export abstract class Projectile {
  x: number;
  y: number;
  readonly damage: number;
  done = false;
  protected body: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
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
    this.body = scene.add.circle(x, y, radius, color).setDepth(PROJECTILE_DEPTH);
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
    this.body.destroy();
  }
}

/** Display length of the sprite-backed sniper projectile along the travel axis. */
const SNIPER_SPRITE_LENGTH = 52;

export class SniperProjectile extends Projectile {
  private target: Enemy;
  private usesSprite = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number,
    target: Enemy,
    color: number,
    opts?: { textureKey?: string },
  ) {
    super(scene, color, 5, x, y, damage);
    this.target = target;

    const key = opts?.textureKey;
    if (key && scene.textures.exists(key)) {
      this.body.destroy();
      const img = scene.add.image(x, y, key).setDepth(PROJECTILE_DEPTH);
      // Fit the sprite to SNIPER_SPRITE_LENGTH along its longer axis, preserving aspect.
      const source = scene.textures.get(key).source[0];
      const longEdge = Math.max(source.width, source.height);
      img.setScale(SNIPER_SPRITE_LENGTH / longEdge);
      img.setRotation(Math.atan2(target.y - y, target.x - x));
      this.body = img;
      this.usesSprite = true;
    }
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
      this.body.setPosition(this.x, this.y);
      this.done = true;
      return {
        damage: this.damage,
        position: { x: this.x, y: this.y },
        primaryTarget: this.target,
      };
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.body.setPosition(this.x, this.y);

    if (this.usesSprite) {
      // Homing target moves each frame — keep the arrow pointing at it.
      (this.body as Phaser.GameObjects.Image).setRotation(Math.atan2(dy, dx));
    } else {
      this.emitTrail(deltaSec, 3);
    }
    return null;
  }
}

/** Visible size for sprite-backed splash projectiles. */
const SPLASH_SPRITE_SIZE = 28;

export class SplashProjectile extends Projectile {
  private targetX: number;
  private targetY: number;
  private splashRadiusTiles: number;
  private slow: ProjectileSlowPayload | undefined;
  private canHitFlying: boolean;
  private usesSprite = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number,
    targetX: number,
    targetY: number,
    splashRadiusTiles: number,
    color: number,
    opts?: { slow?: ProjectileSlowPayload; canHitFlying?: boolean; textureKey?: string },
  ) {
    super(scene, color, 6, x, y, damage);
    this.targetX = targetX;
    this.targetY = targetY;
    this.splashRadiusTiles = splashRadiusTiles;
    this.slow = opts?.slow;
    this.canHitFlying = opts?.canHitFlying ?? false;

    const key = opts?.textureKey;
    if (key && scene.textures.exists(key)) {
      this.body.destroy();
      const img = scene.add.image(x, y, key).setDepth(PROJECTILE_DEPTH);
      img.setDisplaySize(SPLASH_SPRITE_SIZE, SPLASH_SPRITE_SIZE);
      img.setRotation(Math.atan2(targetY - y, targetX - x));
      this.body = img;
      this.usesSprite = true;
    }
  }

  update(deltaSec: number): ProjectileHit | null {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    const step = PROJECTILE_SPEED_PX_PER_SEC * deltaSec;

    if (step >= dist) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.body.setPosition(this.x, this.y);
      this.done = true;
      return {
        damage: this.damage,
        position: { x: this.x, y: this.y },
        splashRadiusPx: this.splashRadiusTiles * CELL_SIZE,
        slow: this.slow,
        canHitFlying: this.canHitFlying,
      };
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.body.setPosition(this.x, this.y);

    if (this.usesSprite) {
      // Rotate so the sprite's built-in motion-blur streak trails behind travel direction.
      (this.body as Phaser.GameObjects.Image).setRotation(Math.atan2(dy, dx));
    } else {
      // Circle fallback has no built-in trail — drop fading dots.
      this.emitTrail(deltaSec, 4);
    }
    return null;
  }

  /** Splash projectiles spawn a short-lived expanding explosion on hit. */
  spawnExplosion(): void {
    const finalRadius = this.splashRadiusTiles * CELL_SIZE;
    const ring = this.scene.add
      .circle(this.x, this.y, finalRadius, this.trailColor, 0.5)
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
