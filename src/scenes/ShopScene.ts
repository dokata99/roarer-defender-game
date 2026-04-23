import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCENE_KEYS } from '../config/constants';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SHOP);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(CANVAS_WIDTH / 2, 140, 'Shop', {
        fontSize: '64px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'Under Construction\n(arrives in Slice 4)', {
        fontSize: '28px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
        align: 'center',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80, '< Back to Menu', {
        fontSize: '22px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor(COLORS.textAccent));
    back.on('pointerout', () => back.setColor(COLORS.textPrimary));
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.MAIN_MENU));
  }
}
