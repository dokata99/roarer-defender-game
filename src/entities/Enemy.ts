import Phaser from 'phaser';
import { CELL_SIZE } from '../config/constants';
import { ENEMY_CONFIGS, type EnemyType } from '../config/enemies';
import type { CellCoord } from '../systems/GridManager';
import type { GridManager } from '../systems/GridManager';
import { ENEMY_DEPTH, HP_BAR_DEPTH } from '../config/gameplay';

export type EnemyUpdateResult = 'alive' | 'reached-castle';

/** Color blended into the enemy body while slowed. Matches `01-11` slow-visual spec. */
const SLOW_TINT_COLOR = 0x66ffff;

/** Worm trail: segment count and scale/alpha taper per 02-03 §3.2. */
const WORM_TRAIL_COUNT = 3;
const WORM_TRAIL_SAMPLE_INTERVAL_MS = 60;
const WORM_WOBBLE_AMPLITUDE_PX = 2;
const WORM_WOBBLE_PERIOD_MS = 300;

/** Trojan glitch stutter timing. */
const TROJAN_STUTTER_MIN_MS = 2000;
const TROJAN_STUTTER_MAX_MS = 3000;
const TROJAN_STUTTER_DURATION_MS = 50;

/** Packet trail length. */
const PACKET_TRAIL_SAMPLES = 7;

/** Zero-Day glitch aura: small rectangles spawning near the boss. */
const BOSS_GLITCH_INTERVAL_MS = 120;
const BOSS_GLITCH_LIFESPAN_MS = 100;

export interface EnemySpec {
  type: EnemyType;
  hp: number;
  speedTilesPerSec: number;
  goldOnKill: number;
  /**
   * Per-wave slow-resistance override (e.g. wave-20 final boss uses 0.9).
   * If omitted, falls back to ENEMY_CONFIGS[type].slowResistance.
   */
  slowResistance?: number;
}

export function makeEnemySpec(
  type: EnemyType,
  hp: number,
  speedTilesPerSec?: number,
  goldOnKill?: number,
  slowResistance?: number,
): EnemySpec {
  const cfg = ENEMY_CONFIGS[type];
  return {
    type,
    hp,
    speedTilesPerSec: speedTilesPerSec ?? cfg.speedTilesPerSec,
    goldOnKill: goldOnKill ?? cfg.goldOnKill,
    slowResistance,
  };
}

function blendColors(c1: number, c2: number, t: number): number {
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return (r << 16) | (g << 8) | b;
}

export class Enemy {
  readonly type: EnemyType;
  readonly maxHp: number;
  hp: number;
  readonly goldOnKill: number;
  readonly securityLostOnReach: number;
  readonly speedPxPerSec: number;
  readonly isFlying: boolean;
  readonly slowResistance: number;
  readonly radius: number;

  /** Primary body shape. For Worm this is the Arc; for others, a Graphics redrawn on tint change. */
  private body!: Phaser.GameObjects.Arc | Phaser.GameObjects.Graphics;
  /** Optional decorations that don't change color (Trojan shield, Packet inner line, boss "0" glyph). */
  private decor: Phaser.GameObjects.Graphics | null = null;
  /** Trojan rotating shield overlay. */
  private shield: Phaser.GameObjects.Graphics | null = null;
  /** Packet ground shadow (world-space). */
  private shadow: Phaser.GameObjects.Ellipse | null = null;
  /** Worm trail segments (world-space, not container children). */
  private wormTrail: Phaser.GameObjects.Arc[] = [];
  private wormTrailSamples: { x: number; y: number }[] = [];
  private sampleTimerMs = 0;
  /** Packet trail graphics (world-space). */
  private packetTrail: Phaser.GameObjects.Graphics | null = null;
  private packetTrailSamples: { x: number; y: number }[] = [];
  /** Zero-Day glitch aura rectangles (world-space, ephemeral). */
  private bossGlitchTimerMs = 0;

  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private hitFlashTween: Phaser.Tweens.Tween | null = null;
  private shieldTween: Phaser.Tweens.Tween | null = null;

  private baseColor: number;
  private wobbleElapsedMs = 0;
  /** Trojan: milliseconds until the next stutter kicks in. */
  private stutterCountdownMs = 0;
  private stutterRemainingMs = 0;
  private stutterOffsetX = 0;
  private stutterOffsetY = 0;

  /** Milliseconds of slow remaining. */
  private slowRemainingMs = 0;
  /** Active slow multiplier (0, 1]. 1.0 = no slow. */
  private activeSlowMultiplier = 1;

  x: number;
  y: number;
  /** For flying: the straight-line target (nearest castle cell), set once at construct. */
  private targetX = 0;
  private targetY = 0;
  /** For ground: the A* path from portal to castle. */
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
    this.securityLostOnReach = cfg.securityLostOnReach;
    this.speedPxPerSec = spec.speedTilesPerSec * CELL_SIZE;
    this.isFlying = cfg.flying === true;
    this.slowResistance = spec.slowResistance ?? cfg.slowResistance;
    this.baseColor = cfg.color;
    this.radius = cfg.radius;
    this.path = path;

    const spawn = grid.cellToPixel(path[0].col, path[0].row);
    this.x = spawn.x;
    this.y = spawn.y;
    this.pathIndex = 1;

    if (this.isFlying) {
      // Straight-line target: the last cell of the A* path (castle). 02-03 §3.5 gameplay fix.
      const last = path[path.length - 1];
      const target = grid.cellToPixel(last.col, last.row);
      this.targetX = target.x;
      this.targetY = target.y;
    }

    this.createBody();
    this.createHpBar();
    this.applyTypeSpecificSetup();
  }

  // ============================================================
  // Construction helpers
  // ============================================================

  private createBody(): void {
    const depth = this.isFlying ? ENEMY_DEPTH + 5 : ENEMY_DEPTH;

    switch (this.type) {
      case 'fast':
        // Worm body: a simple circle so hit-flash can use setFillStyle fast.
        this.body = this.scene.add.circle(this.x, this.y, this.radius, this.baseColor);
        this.body.setStrokeStyle(1, blendColors(this.baseColor, 0xffffff, 0.3), 1);
        this.body.setDepth(depth);
        break;

      case 'elite':
      case 'flying':
      case 'boss':
        // Graphics-backed bodies — redrawn whenever fill color changes.
        this.body = this.scene.add.graphics();
        this.body.setDepth(depth);
        break;
    }

    this.redrawBody(this.baseColor);
  }

  private createHpBar(): void {
    const barWidth = this.radius * 2 + 4;
    const barHeight = 4;
    const barY = this.y - this.radius - 6;
    this.hpBarBg = this.scene.add
      .rectangle(this.x, barY, barWidth, barHeight, 0x440000)
      .setDepth(HP_BAR_DEPTH);
    this.hpBarFill = this.scene.add
      .rectangle(this.x - barWidth / 2, barY, barWidth, barHeight, 0x33ff66)
      .setOrigin(0, 0.5)
      .setDepth(HP_BAR_DEPTH);
  }

  private applyTypeSpecificSetup(): void {
    const cfg = ENEMY_CONFIGS[this.type];

    if (this.type === 'fast') {
      // Worm trail: 3 world-space dots trailing the head.
      const depth = ENEMY_DEPTH - 1;
      for (let i = 0; i < WORM_TRAIL_COUNT; i++) {
        const r = Math.max(2, this.radius - 3 - i * 2);
        const alpha = 0.8 - i * 0.2;
        const seg = this.scene.add.circle(this.x, this.y, r, this.baseColor, alpha);
        seg.setDepth(depth);
        this.wormTrail.push(seg);
      }
      this.wormTrailSamples = [];
    }

    if (this.type === 'elite') {
      // Trojan rotating shield — a faint outer hexagon at 20% alpha.
      this.shield = this.scene.add.graphics();
      this.shield.setDepth(ENEMY_DEPTH);
      this.drawTrojanShield();
      this.shieldTween = this.scene.tweens.add({
        targets: this.shield,
        angle: 360,
        duration: 8000,
        repeat: -1,
      });
      // Seed the stutter timer.
      this.stutterCountdownMs =
        TROJAN_STUTTER_MIN_MS + Math.random() * (TROJAN_STUTTER_MAX_MS - TROJAN_STUTTER_MIN_MS);
    }

    if (this.isFlying) {
      // Packet: altitude shadow below + motion-trail polyline.
      this.shadow = this.scene.add
        .ellipse(this.x, this.y + 10, this.radius * 1.6, this.radius * 0.55, 0x000000, 0.35)
        .setDepth(ENEMY_DEPTH - 1);
      this.packetTrail = this.scene.add.graphics().setDepth(ENEMY_DEPTH + 4);
    }

    if (cfg.pulses) {
      // Zero-Day boss: constant scale pulse + magenta glow postFX.
      this.pulseTween = this.scene.tweens.add({
        targets: this.body,
        scale: { from: 0.9, to: 1.1 },
        yoyo: true,
        repeat: -1,
        duration: 500,
        ease: 'Sine.InOut',
      });
      // Graphics supports postFX in Phaser 3.60+. Null-safe in case a renderer doesn't.
      (this.body as Phaser.GameObjects.Graphics).postFX?.addGlow(0xff3cf2, 6, 0, false);
    }
  }

  // ============================================================
  // Main tick
  // ============================================================

  update(deltaSec: number): EnemyUpdateResult {
    if (!this.alive) return 'alive';

    // Tick slow timer.
    if (this.slowRemainingMs > 0) {
      this.slowRemainingMs -= deltaSec * 1000;
      if (this.slowRemainingMs <= 0) {
        this.slowRemainingMs = 0;
        this.activeSlowMultiplier = 1;
        this.refreshBodyColor();
      }
    }

    const result = this.isFlying ? this.advanceStraightLine(deltaSec) : this.advancePath(deltaSec);

    this.updateWobble(deltaSec);
    this.updateStutter(deltaSec);
    this.updateWormTrail(deltaSec);
    this.updatePacketTrail();
    this.updateBossGlitch(deltaSec);

    this.refreshVisualPosition();
    return result;
  }

  /** Ground enemies: walk the A* path cell-to-cell. */
  private advancePath(deltaSec: number): EnemyUpdateResult {
    if (this.pathIndex >= this.path.length) return 'reached-castle';
    const target = this.grid.cellToPixel(
      this.path[this.pathIndex].col,
      this.path[this.pathIndex].row,
    );
    return this.stepToward(target.x, target.y, deltaSec, () => {
      this.pathIndex += 1;
    });
  }

  /** Flying enemies: straight-line to the castle, ignoring grid and towers. */
  private advanceStraightLine(deltaSec: number): EnemyUpdateResult {
    return this.stepToward(this.targetX, this.targetY, deltaSec, () => {
      // Flying arrival = reached castle; marker to end the run.
      this.pathIndex = this.path.length;
    });
  }

  private stepToward(
    tx: number,
    ty: number,
    deltaSec: number,
    onArrive: () => void,
  ): EnemyUpdateResult {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const effectiveSpeed = this.speedPxPerSec * this.activeSlowMultiplier;
    const step = effectiveSpeed * deltaSec;

    if (step >= dist) {
      this.x = tx;
      this.y = ty;
      onArrive();
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }

    if (this.pathIndex >= this.path.length) return 'reached-castle';
    return 'alive';
  }

  private updateWobble(deltaSec: number): void {
    if (this.type !== 'fast') return;
    this.wobbleElapsedMs += deltaSec * 1000;
  }

  private updateStutter(deltaSec: number): void {
    if (this.type !== 'elite') return;
    const dms = deltaSec * 1000;
    if (this.stutterRemainingMs > 0) {
      this.stutterRemainingMs -= dms;
      if (this.stutterRemainingMs <= 0) {
        this.stutterOffsetX = 0;
        this.stutterOffsetY = 0;
      }
    } else {
      this.stutterCountdownMs -= dms;
      if (this.stutterCountdownMs <= 0) {
        this.stutterRemainingMs = TROJAN_STUTTER_DURATION_MS;
        const angle = Math.random() * Math.PI * 2;
        this.stutterOffsetX = Math.cos(angle) * 2;
        this.stutterOffsetY = Math.sin(angle) * 2;
        this.stutterCountdownMs =
          TROJAN_STUTTER_MIN_MS +
          Math.random() * (TROJAN_STUTTER_MAX_MS - TROJAN_STUTTER_MIN_MS);
      }
    }
  }

  private updateWormTrail(deltaSec: number): void {
    if (this.type !== 'fast') return;
    this.sampleTimerMs += deltaSec * 1000;
    while (this.sampleTimerMs >= WORM_TRAIL_SAMPLE_INTERVAL_MS) {
      this.sampleTimerMs -= WORM_TRAIL_SAMPLE_INTERVAL_MS;
      this.wormTrailSamples.unshift({ x: this.x, y: this.y });
      if (this.wormTrailSamples.length > WORM_TRAIL_COUNT + 2) {
        this.wormTrailSamples.length = WORM_TRAIL_COUNT + 2;
      }
    }
    for (let i = 0; i < this.wormTrail.length; i++) {
      const sample = this.wormTrailSamples[i + 1];
      if (!sample) continue;
      this.wormTrail[i].setPosition(sample.x, sample.y);
    }
  }

  private updatePacketTrail(): void {
    if (!this.packetTrail || this.type !== 'flying') return;
    this.packetTrailSamples.unshift({ x: this.x, y: this.y });
    if (this.packetTrailSamples.length > PACKET_TRAIL_SAMPLES) {
      this.packetTrailSamples.length = PACKET_TRAIL_SAMPLES;
    }
    this.packetTrail.clear();
    const samples = this.packetTrailSamples;
    for (let i = 1; i < samples.length; i++) {
      const t = 1 - i / samples.length;
      this.packetTrail.lineStyle(2.5 * t + 0.5, this.baseColor, 0.9 * t);
      this.packetTrail.lineBetween(samples[i - 1].x, samples[i - 1].y, samples[i].x, samples[i].y);
    }
  }

  private updateBossGlitch(deltaSec: number): void {
    if (this.type !== 'boss') return;
    this.bossGlitchTimerMs += deltaSec * 1000;
    while (this.bossGlitchTimerMs >= BOSS_GLITCH_INTERVAL_MS) {
      this.bossGlitchTimerMs -= BOSS_GLITCH_INTERVAL_MS;
      const angle = Math.random() * Math.PI * 2;
      const dist = this.radius + 2;
      const gx = this.x + Math.cos(angle) * dist;
      const gy = this.y + Math.sin(angle) * dist;
      const color = Math.random() < 0.5 ? 0xff2e63 : 0xff3cf2;
      const rect = this.scene.add
        .rectangle(gx, gy, 3, 3, color, 0.85)
        .setDepth(ENEMY_DEPTH + 1);
      this.scene.tweens.add({
        targets: rect,
        alpha: 0,
        duration: BOSS_GLITCH_LIFESPAN_MS,
        onComplete: () => rect.destroy(),
      });
    }
  }

  // ============================================================
  // Visual position
  // ============================================================

  private refreshVisualPosition(): void {
    let drawX = this.x + this.stutterOffsetX;
    let drawY = this.y + this.stutterOffsetY;

    if (this.type === 'fast') {
      // Worm wobbles perpendicular to motion.
      const perp = this.perpendicularToMotion();
      const wobble =
        Math.sin((this.wobbleElapsedMs / WORM_WOBBLE_PERIOD_MS) * Math.PI * 2) *
        WORM_WOBBLE_AMPLITUDE_PX;
      drawX += perp.x * wobble;
      drawY += perp.y * wobble;
    }

    this.body.setPosition(drawX, drawY);

    if (this.type === 'flying') {
      // Chevron rotates to face its velocity vector.
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      if (dx !== 0 || dy !== 0) {
        this.body.setRotation(Math.atan2(dy, dx));
      }
    }

    if (this.shield) {
      this.shield.setPosition(drawX, drawY);
    }

    if (this.shadow) {
      // Shadow stays at ground y (constant altitude visual).
      this.shadow.setPosition(this.x, this.y + 10);
    }

    const barWidth = this.radius * 2 + 4;
    const barY = this.y - this.radius - 6;
    this.hpBarBg.setPosition(this.x, barY);
    this.hpBarFill.setPosition(this.x - barWidth / 2, barY);
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpBarFill.setScale(ratio, 1);
  }

  private perpendicularToMotion(): { x: number; y: number } {
    if (this.isFlying) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return { x: 0, y: 0 };
      return { x: -dy / len, y: dx / len };
    }
    if (this.pathIndex >= this.path.length) return { x: 0, y: 0 };
    const target = this.grid.cellToPixel(
      this.path[this.pathIndex].col,
      this.path[this.pathIndex].row,
    );
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: -dy / len, y: dx / len };
  }

  // ============================================================
  // Combat
  // ============================================================

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

  applySlow(multiplier: number, durationMs: number): void {
    if (!this.alive) return;
    if (this.slowResistance >= 1) return;
    const effective = 1 - (1 - multiplier) * (1 - this.slowResistance);
    this.activeSlowMultiplier = Math.min(this.activeSlowMultiplier, effective);
    this.slowRemainingMs = Math.max(this.slowRemainingMs, durationMs);
    this.refreshBodyColor();
  }

  // ============================================================
  // Color / tint
  // ============================================================

  private refreshBodyColor(): void {
    if (this.hitFlashTween) return;
    this.redrawBody(this.getIntendedBodyColor());
  }

  private getIntendedBodyColor(): number {
    if (this.slowRemainingMs <= 0) return this.baseColor;
    return blendColors(this.baseColor, SLOW_TINT_COLOR, 0.5);
  }

  private redrawBody(color: number): void {
    switch (this.type) {
      case 'fast':
        (this.body as Phaser.GameObjects.Arc).setFillStyle(color);
        break;
      case 'elite':
        this.drawTrojan(color);
        break;
      case 'flying':
        this.drawPacket(color);
        break;
      case 'boss':
        this.drawBoss(color);
        break;
    }
  }

  private playHitFlash(): void {
    if (this.hitFlashTween) {
      this.hitFlashTween.remove();
      this.hitFlashTween = null;
    }
    this.redrawBody(0xffffff);
    this.hitFlashTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 120,
      onComplete: () => {
        this.hitFlashTween = null;
        if (this.alive) this.redrawBody(this.getIntendedBodyColor());
      },
    });
  }

  // ============================================================
  // Type-specific drawing
  // ============================================================

  private drawTrojan(color: number): void {
    const g = this.body as Phaser.GameObjects.Graphics;
    g.clear();
    const r = this.radius;
    // Hexagon body
    g.lineStyle(2, blendColors(color, 0xffffff, 0.25), 1);
    g.fillStyle(color, 1);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
    // Download-arrow triangle inside
    const tArm = r * 0.45;
    g.fillStyle(0xffffff, 0.85);
    g.beginPath();
    g.moveTo(-tArm * 0.6, -tArm * 0.2);
    g.lineTo(tArm * 0.6, -tArm * 0.2);
    g.lineTo(0, tArm * 0.6);
    g.closePath();
    g.fillPath();
    // Tiny base line
    g.fillRect(-tArm * 0.4, -tArm * 0.35, tArm * 0.8, 2);
  }

  private drawTrojanShield(): void {
    if (!this.shield) return;
    const r = this.radius * 1.22;
    const color = this.baseColor;
    this.shield.clear();
    this.shield.lineStyle(1, color, 0.25);
    this.shield.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) this.shield.moveTo(px, py);
      else this.shield.lineTo(px, py);
    }
    this.shield.closePath();
    this.shield.strokePath();
  }

  private drawPacket(color: number): void {
    const g = this.body as Phaser.GameObjects.Graphics;
    g.clear();
    const r = this.radius;
    // Chevron: tip forward (+x), tail split behind
    g.fillStyle(color, 1);
    g.lineStyle(1, color, 1);
    g.beginPath();
    g.moveTo(r, 0); // tip forward
    g.lineTo(-r * 0.5, -r * 0.7); // top-back
    g.lineTo(-r * 0.1, 0); // notch
    g.lineTo(-r * 0.5, r * 0.7); // bottom-back
    g.closePath();
    g.fillPath();
    g.strokePath();
    // Bright inner axis line
    g.lineStyle(1, 0xffffff, 0.9);
    g.lineBetween(-r * 0.1, 0, r * 0.85, 0);
  }

  private drawBoss(color: number): void {
    const g = this.body as Phaser.GameObjects.Graphics;
    g.clear();
    const r = this.radius;
    // Irregular 8-sided polygon: vertex radii perturbed by a seeded-looking sin wave.
    g.fillStyle(color, 1);
    g.lineStyle(3, 0xff3cf2, 1);
    g.beginPath();
    const verts = 8;
    for (let i = 0; i < verts; i++) {
      const a = (Math.PI * 2 * i) / verts;
      const rv = r + Math.sin(i * 2.7) * 3 + Math.cos(i * 1.3) * 2;
      const px = Math.cos(a) * rv;
      const py = Math.sin(a) * rv;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
    // Center glyph — two small dark eye slits for menace
    g.fillStyle(0x141726, 0.9);
    g.fillRect(-r * 0.35, -r * 0.12, r * 0.2, 3);
    g.fillRect(r * 0.15, -r * 0.12, r * 0.2, 3);
    // Tiny "0" — small ring
    g.lineStyle(1.5, 0xffffff, 0.7);
    g.strokeCircle(0, r * 0.2, r * 0.15);
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  destroy(): void {
    this.body.destroy();
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    this.decor?.destroy();
    this.shield?.destroy();
    this.shadow?.destroy();
    this.packetTrail?.destroy();
    this.wormTrail.forEach((s) => s.destroy());
    this.wormTrail = [];
    if (this.pulseTween) this.pulseTween.stop();
    if (this.hitFlashTween) this.hitFlashTween.stop();
    if (this.shieldTween) this.shieldTween.stop();
  }

  /** New path (for pathfinding replan between waves). Currently unused — paths are locked per-wave. */
  setPath(path: CellCoord[]): void {
    this.path = path;
    this.pathIndex = 1;
  }
}
