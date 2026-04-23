import Phaser from 'phaser';
import { CELL_SIZE } from '../config/constants';
import {
  TOWER_CONFIGS,
  MAX_TOWER_LEVEL,
  type TowerType,
  type TowerLevelStats,
} from '../config/towers';
import { TOWER_DEPTH } from '../config/gameplay';
import type { RunContext } from '../systems/RunContext';

/** Outer half-width of each tower's visible footprint. Shared by all three towers. */
const TOWER_RADIUS = (CELL_SIZE - 16) / 2;
/** Visible footprint (full width) for image-based towers. */
const TOWER_ART_SIZE = CELL_SIZE - 12;

export class Tower {
  readonly type: TowerType;
  readonly col: number;
  readonly row: number;
  level: number = 1;
  private totalGoldSpent: number;
  private container: Phaser.GameObjects.Container;
  /** Static parts of the tower body — redrawn on upgrade. */
  private base: Phaser.GameObjects.Graphics;
  /** Rotating inner element (Firewall core / Killswitch crosshair / Cryolock spokes). */
  private rotor: Phaser.GameObjects.Graphics;
  /** Cryolock hub that pulses alpha. Null for other towers. */
  private hub: Phaser.GameObjects.Graphics | null = null;
  /** Cryolock icicle orbit (rotates counter to the spokes). Null for other towers. */
  private orbit: Phaser.GameObjects.Container | null = null;
  /** Image body, only populated when the tower's config.art?.bodyKey is loaded. */
  private body: Phaser.GameObjects.Image | null = null;
  /** Level badge, only populated alongside `body`. */
  private levelText: Phaser.GameObjects.Text | null = null;
  /** Base scale captured after `setDisplaySize`, so pulse tweens don't drift. */
  private baseBodyScale = 1;
  /** Current glow FX on the container (art path only). */
  private glowFX: Phaser.FX.Glow | null = null;
  private idleTweens: Phaser.Tweens.Tween[] = [];
  private scene: Phaser.Scene;
  /** True when this tower renders from an image asset instead of procedural graphics. */
  private readonly useArtPath: boolean;
  lastFireAt: number = 0;

  constructor(
    scene: Phaser.Scene,
    type: TowerType,
    col: number,
    row: number,
    centerX: number,
    centerY: number,
    private context: RunContext,
  ) {
    this.scene = scene;
    this.type = type;
    this.col = col;
    this.row = row;
    this.totalGoldSpent = context.getPlaceCost(type);

    const artKey = TOWER_CONFIGS[type].art?.bodyKey;
    this.useArtPath = !!artKey && scene.textures.exists(artKey);

    this.base = scene.add.graphics();
    this.rotor = scene.add.graphics();

    const children: Phaser.GameObjects.GameObject[] = [this.base, this.rotor];
    if (type === 'frost' && !this.useArtPath) {
      this.hub = scene.add.graphics();
      this.orbit = scene.add.container(0, 0);
      children.push(this.orbit, this.hub);
    }

    if (this.useArtPath && artKey) {
      const img = scene.add.image(0, 0, artKey);
      // Aspect-preserving fit: square bears stay square; portrait/landscape
      // bears shrink along the long axis to fit inside the cell.
      const source = scene.textures.get(artKey).source[0];
      const scale = Math.min(TOWER_ART_SIZE / source.width, TOWER_ART_SIZE / source.height);
      img.setScale(scale);
      this.baseBodyScale = scale;
      this.body = img;
      children.push(img);

      const badgeOffset = TOWER_ART_SIZE * 0.32;
      const text = scene.add
        .text(badgeOffset, badgeOffset, '1', {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      text.setStroke('#000000', 3);
      this.levelText = text;
      children.push(text);
    }

    this.container = scene.add.container(centerX, centerY, children);
    this.container.setDepth(TOWER_DEPTH);

    this.redraw();
    this.startIdleAnimations();
  }

  /** Brief scale bump when the tower fires — signals that it's actively attacking. */
  playFireTelegraph(): void {
    this.scene.tweens.killTweensOf(this.container);
    const selectedScale = 1.0; // telegraph returns to base scale
    this.container.setScale(1.25);
    this.scene.tweens.add({
      targets: this.container,
      scale: selectedScale,
      duration: 140,
      ease: 'Quad.Out',
    });
  }

  getStats(): TowerLevelStats {
    return this.context.getTowerStats(this.type, this.level);
  }

  getRangePx(): number {
    return this.getStats().rangeTiles * CELL_SIZE;
  }

  canUpgrade(): boolean {
    return this.level < MAX_TOWER_LEVEL;
  }

  upgradeCost(): number {
    if (!this.canUpgrade()) return 0;
    return this.context.getUpgradeCost(this.type, this.level + 1);
  }

  upgrade(): void {
    if (!this.canUpgrade()) return;
    this.totalGoldSpent += this.upgradeCost();
    this.level += 1;
    this.redraw();

    if (this.useArtPath) {
      this.levelText?.setText(String(this.level));
      this.applyArtTierFX();
    } else if (this.level === MAX_TOWER_LEVEL) {
      // L3 neon halo per 02-01 §2 / 02-03 §2.5. WebGL-only; silently skipped otherwise.
      this.container.postFX?.addGlow(TOWER_CONFIGS[this.type].color, 4, 0, false);
    }
  }

  /** Art-path upgrade tiering: L2 = subtle glow, L3 = stronger glow + idle pulse. */
  private applyArtTierFX(): void {
    if (!this.useArtPath) return;
    if (this.scene.renderer.type !== Phaser.WEBGL) return;
    if (this.glowFX) {
      this.container.postFX.remove(this.glowFX);
      this.glowFX = null;
    }
    const color = TOWER_CONFIGS[this.type].color;
    if (this.level === 2) {
      this.glowFX = this.container.postFX.addGlow(color, 3, 0, false);
    } else if (this.level >= 3) {
      this.glowFX = this.container.postFX.addGlow(color, 6, 0, false);
      this.startArtPulseTween();
    }
  }

  private startArtPulseTween(): void {
    if (!this.body) return;
    const base = this.baseBodyScale;
    this.idleTweens.push(
      this.scene.tweens.add({
        targets: this.body,
        scale: { from: base * 0.97, to: base * 1.03 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      }),
    );
  }

  sellRefund(): number {
    return this.totalGoldSpent;
  }

  getCenter(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  setSelected(selected: boolean): void {
    this.container.setScale(selected ? 1.1 : 1.0);
  }

  getCritChance(): number {
    return this.type === 'sniper' ? this.context.sniperCritChance : 0;
  }

  destroy(): void {
    this.idleTweens.forEach((t) => t.stop());
    this.idleTweens = [];
    this.container.destroy();
  }

  // ============================================================
  // Drawing
  // ============================================================

  private redraw(): void {
    this.base.clear();
    this.rotor.clear();
    this.hub?.clear();
    if (this.orbit) this.orbit.removeAll(true);

    if (this.useArtPath) return;

    switch (this.type) {
      case 'splash':
        this.drawFirewall();
        break;
      case 'sniper':
        this.drawKillswitch();
        break;
      case 'frost':
        this.drawCryolock();
        break;
    }
  }

  /** Octagon + concentric rings + rotating square core. 02-01 §2 / 02-03 §2.2. */
  private drawFirewall(): void {
    const r = TOWER_RADIUS;
    const color = TOWER_CONFIGS.splash.color;

    // Octagon body
    this.base.lineStyle(2, color, 1);
    this.base.fillStyle(0x141726, 0.6);
    this.base.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i - Math.PI / 8;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) this.base.moveTo(px, py);
      else this.base.lineTo(px, py);
    }
    this.base.closePath();
    this.base.fillPath();
    this.base.strokePath();

    // Level rings (concentric, fainter as they go in)
    this.base.lineStyle(1, color, 0.55);
    if (this.level >= 1) this.base.strokeCircle(0, 0, r * 0.82);
    if (this.level >= 2) this.base.strokeCircle(0, 0, r * 0.66);
    if (this.level >= 3) {
      this.base.lineStyle(1.5, color, 0.85);
      this.base.strokeCircle(0, 0, r * 0.5);
    }

    // Rotating core: small square, brighter with level
    const sz = 5 + this.level;
    this.rotor.fillStyle(color, 1);
    this.rotor.lineStyle(1, 0xffffff, 0.85);
    this.rotor.fillRect(-sz / 2, -sz / 2, sz, sz);
    this.rotor.strokeRect(-sz / 2, -sz / 2, sz, sz);
  }

  /** Diamond + dots-at-corners + rotating crosshair core. 02-01 §2 / 02-03 §2.3. */
  private drawKillswitch(): void {
    const r = TOWER_RADIUS;
    const color = TOWER_CONFIGS.sniper.color;

    // Diamond body (rhombus: taller than wide)
    this.base.lineStyle(2, color, 1);
    this.base.fillStyle(0x141726, 0.6);
    this.base.beginPath();
    this.base.moveTo(0, -r);
    this.base.lineTo(r * 0.72, 0);
    this.base.lineTo(0, r);
    this.base.lineTo(-r * 0.72, 0);
    this.base.closePath();
    this.base.fillPath();
    this.base.strokePath();

    // Level dots at each diamond corner, walking inward along the corner-to-center ray.
    const corners = [
      { x: 0, y: -r },
      { x: r * 0.72, y: 0 },
      { x: 0, y: r },
      { x: -r * 0.72, y: 0 },
    ];
    this.base.fillStyle(color, 1);
    for (const corner of corners) {
      for (let i = 0; i < this.level; i++) {
        const t = 0.8 - i * 0.08;
        this.base.fillCircle(corner.x * t, corner.y * t, 1.6);
      }
    }

    // Rotating crosshair core (thin + shape with center dot)
    const arm = 9;
    this.rotor.lineStyle(1.5, 0xffffff, 0.9);
    this.rotor.lineBetween(-arm, 0, arm, 0);
    this.rotor.lineBetween(0, -arm, 0, arm);
    this.rotor.fillStyle(color, 1);
    this.rotor.fillCircle(0, 0, 2);
  }

  /** 6-spoke snowflake + hub + orbiting icicles. 02-03 §2.4 (NEW). */
  private drawCryolock(): void {
    const r = TOWER_RADIUS;
    const color = TOWER_CONFIGS.frost.color;
    const spokeR = r * 0.82;

    // Spokes live on the rotor so they rotate with idle animation.
    // L1: all 6 spokes at 50% alpha ("dim"). L2+: full alpha.
    const spokeAlpha = this.level >= 2 ? 1 : 0.55;
    this.rotor.lineStyle(2, color, spokeAlpha);
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      this.rotor.lineBetween(0, 0, Math.cos(a) * spokeR, Math.sin(a) * spokeR);
    }
    // Tip dots at spoke ends
    this.rotor.fillStyle(color, spokeAlpha);
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      this.rotor.fillCircle(Math.cos(a) * spokeR, Math.sin(a) * spokeR, 2);
    }

    // Hexagonal hub (pulses alpha)
    if (this.hub) {
      const hubR = 6;
      this.hub.fillStyle(0x141726, 1);
      this.hub.lineStyle(1.5, color, 1);
      this.hub.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = Math.cos(a) * hubR;
        const py = Math.sin(a) * hubR;
        if (i === 0) this.hub.moveTo(px, py);
        else this.hub.lineTo(px, py);
      }
      this.hub.closePath();
      this.hub.fillPath();
      this.hub.strokePath();
      // Inner glyph dot
      this.hub.fillStyle(0xffffff, 0.9);
      this.hub.fillCircle(0, 0, 1.5);
    }

    // Orbiting icicles: L1 = 0, L2 = 3, L3 = 6.
    if (this.orbit) {
      const iciclesCount = this.level >= 3 ? 6 : this.level >= 2 ? 3 : 0;
      const orbitR = r * 0.92;
      for (let i = 0; i < iciclesCount; i++) {
        const a = (Math.PI * 2 * i) / iciclesCount;
        const g = this.scene.add.graphics();
        g.fillStyle(color, 1);
        g.lineStyle(1, 0xffffff, 0.8);
        // Small diamond, long axis horizontal (points radially once rotated into place).
        g.beginPath();
        g.moveTo(4, 0);
        g.lineTo(0, -2);
        g.lineTo(-4, 0);
        g.lineTo(0, 2);
        g.closePath();
        g.fillPath();
        g.strokePath();
        g.setPosition(Math.cos(a) * orbitR, Math.sin(a) * orbitR);
        g.setRotation(a);
        this.orbit.add(g);
      }
    }
  }

  // ============================================================
  // Animations
  // ============================================================

  private startIdleAnimations(): void {
    // Stop any existing tweens (safe on construct, defensive on re-init).
    this.idleTweens.forEach((t) => t.stop());
    this.idleTweens = [];

    if (this.useArtPath) {
      // Image path: no rotor spin. Glow + pulse are applied via applyArtTierFX on upgrade.
      return;
    }

    switch (this.type) {
      case 'splash': {
        // Core rotates 360° per 4s
        this.idleTweens.push(
          this.scene.tweens.add({
            targets: this.rotor,
            angle: 360,
            duration: 4000,
            repeat: -1,
          }),
        );
        break;
      }
      case 'sniper': {
        // Crosshair rotates 360° per 6s (slower than Firewall — implies patience)
        this.idleTweens.push(
          this.scene.tweens.add({
            targets: this.rotor,
            angle: 360,
            duration: 6000,
            repeat: -1,
          }),
        );
        break;
      }
      case 'frost': {
        // Spokes rotate CW over 6s
        this.idleTweens.push(
          this.scene.tweens.add({
            targets: this.rotor,
            angle: 360,
            duration: 6000,
            repeat: -1,
          }),
        );
        // Icicles counter-rotate CCW over 8s
        if (this.orbit) {
          this.idleTweens.push(
            this.scene.tweens.add({
              targets: this.orbit,
              angle: -360,
              duration: 8000,
              repeat: -1,
            }),
          );
        }
        // Hub pulses alpha 0.6 → 1.0 on sine yoyo
        if (this.hub) {
          this.hub.setAlpha(0.6);
          this.idleTweens.push(
            this.scene.tweens.add({
              targets: this.hub,
              alpha: 1,
              duration: 1800,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.InOut',
            }),
          );
        }
        break;
      }
    }
  }
}
