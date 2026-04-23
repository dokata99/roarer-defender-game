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

export class Tower {
  readonly type: TowerType;
  readonly col: number;
  readonly row: number;
  level: number = 1;
  private totalGoldSpent: number;
  private container: Phaser.GameObjects.Container;
  private rect: Phaser.GameObjects.Rectangle;
  private levelText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
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

    const size = CELL_SIZE - 12;
    this.rect = scene.add.rectangle(0, 0, size, size, TOWER_CONFIGS[type].color);
    this.rect.setStrokeStyle(2, 0x000000, 0.6);
    this.levelText = scene.add
      .text(0, 0, '1', {
        fontSize: '22px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.container = scene.add.container(centerX, centerY, [this.rect, this.levelText]);
    this.container.setDepth(TOWER_DEPTH);
  }

  /** Brief scale bump when the tower fires — signals that it's actively attacking. */
  playFireTelegraph(): void {
    this.scene.tweens.killTweensOf(this.rect);
    this.rect.setScale(1.25);
    this.scene.tweens.add({
      targets: this.rect,
      scale: 1,
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
    this.levelText.setText(String(this.level));
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
    this.container.destroy();
  }
}
