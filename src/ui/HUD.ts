import Phaser from 'phaser';
import { CANVAS_WIDTH, HUD_HEIGHT, COLORS } from '../config/constants';

export class HUD {
  constructor(scene: Phaser.Scene) {
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.hudBg, 1);
    bg.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
    bg.lineStyle(1, COLORS.gridBorder, 1);
    bg.strokeRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

    scene.add
      .text(40, HUD_HEIGHT / 2, 'Lives: 100', {
        fontSize: '20px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0, 0.5);

    scene.add
      .text(CANVAS_WIDTH / 2, HUD_HEIGHT / 2, 'Gold: 100', {
        fontSize: '20px',
        color: COLORS.textGold,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    scene.add
      .text(CANVAS_WIDTH - 40, HUD_HEIGHT / 2, 'Wave: 0 / 10', {
        fontSize: '20px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(1, 0.5);
  }
}
