import Phaser from 'phaser';
import type { EnemyType } from '../config/enemies';
import { PROJECTILE_DEPTH } from '../config/gameplay';

/**
 * One-shot particle bursts used across the VFX layer. Per 02-03 §6 + 02-02 §8.
 * Each emitter is created once at scene boot with `frequency: -1` (explode-only
 * mode) and reused for every event. Emitters keep their own particle pools, so
 * this pattern has no per-burst GC cost.
 */
export class ParticleManager {
  private scene: Phaser.Scene;
  private emitters = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const deepFX = PROJECTILE_DEPTH + 5;

    // Worm death — green fragments
    this.emitters.set(
      'death-fast',
      this.scene.add
        .particles(0, 0, 'particle-glow', {
          speed: { min: 50, max: 140 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: 0xb7ff00,
          lifespan: 300,
          quantity: 5,
          frequency: -1,
          blendMode: 'ADD',
        })
        .setDepth(deepFX),
    );

    // Trojan death — orange fragments + pixel squares
    this.emitters.set(
      'death-elite',
      this.scene.add
        .particles(0, 0, 'particle-square', {
          speed: { min: 30, max: 110 },
          scale: { start: 1.3, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: 0xff6b35,
          lifespan: 400,
          quantity: 8,
          frequency: -1,
          blendMode: 'ADD',
        })
        .setDepth(deepFX),
    );

    // Packet death — quick magenta burst
    this.emitters.set(
      'death-flying',
      this.scene.add
        .particles(0, 0, 'particle-glow', {
          speed: { min: 40, max: 120 },
          scale: { start: 0.6, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: 0xff3cf2,
          lifespan: 150,
          quantity: 5,
          frequency: -1,
          blendMode: 'ADD',
        })
        .setDepth(deepFX),
    );

    // Zero-Day death — big red/magenta/white burst
    this.emitters.set(
      'death-boss',
      this.scene.add
        .particles(0, 0, 'particle-glow', {
          speed: { min: 80, max: 220 },
          scale: { start: 1.2, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [0xff2e63, 0xff3cf2, 0xffffff],
          lifespan: 600,
          quantity: 14,
          frequency: -1,
          blendMode: 'ADD',
        })
        .setDepth(deepFX),
    );

    // Hit-spark: tiny white on any damage tick
    this.emitters.set(
      'hit-spark',
      this.scene.add
        .particles(0, 0, 'particle-square', {
          speed: { min: 20, max: 70 },
          scale: { start: 0.9, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: 0xffffff,
          lifespan: 100,
          quantity: 2,
          frequency: -1,
          blendMode: 'ADD',
        })
        .setDepth(deepFX),
    );

    // Gold sparkle — yellow diamonds rising
    this.emitters.set(
      'gold-sparkle',
      this.scene.add
        .particles(0, 0, 'particle-diamond', {
          speed: { min: 20, max: 60 },
          angle: { min: -110, max: -70 }, // upward cone
          scale: { start: 0.8, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: 0xf7ff4a,
          lifespan: 420,
          quantity: 3,
          frequency: -1,
        })
        .setDepth(deepFX),
    );

    // Splash explosion fragments — rectangles flung from impact (Firewall cyan by default)
    this.emitters.set(
      'splash-fragments',
      this.scene.add
        .particles(0, 0, 'particle-square', {
          speed: { min: 50, max: 150 },
          scale: { start: 1, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [0x00e5ff, 0xffffff],
          lifespan: 280,
          quantity: 10,
          frequency: -1,
          blendMode: 'ADD',
        })
        .setDepth(deepFX),
    );

    // Frost shards — ice-cyan diamonds at Cryolock impacts
    this.emitters.set(
      'frost-shards',
      this.scene.add
        .particles(0, 0, 'particle-diamond', {
          speed: { min: 40, max: 110 },
          scale: { start: 0.9, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [0x7ef4ff, 0xffffff],
          lifespan: 380,
          quantity: 6,
          frequency: -1,
          blendMode: 'ADD',
        })
        .setDepth(deepFX),
    );
  }

  emitEnemyDeath(type: EnemyType, x: number, y: number): void {
    const key = `death-${type}`;
    const e = this.emitters.get(key);
    e?.emitParticleAt(x, y);
  }

  emitHitSpark(x: number, y: number): void {
    this.emitters.get('hit-spark')?.emitParticleAt(x, y);
  }

  emitGoldSparkle(x: number, y: number): void {
    this.emitters.get('gold-sparkle')?.emitParticleAt(x, y);
  }

  emitSplashFragments(x: number, y: number, frost: boolean): void {
    this.emitters.get(frost ? 'frost-shards' : 'splash-fragments')?.emitParticleAt(x, y);
  }
}
