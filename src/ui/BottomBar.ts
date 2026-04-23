import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BOTTOM_BAR_HEIGHT, COLORS } from '../config/constants';

export class BottomBar {
  constructor(scene: Phaser.Scene) {
    const y = CANVAS_HEIGHT - BOTTOM_BAR_HEIGHT;

    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.bottomBarBg, 1);
    bg.fillRect(0, y, CANVAS_WIDTH, BOTTOM_BAR_HEIGHT);
    bg.lineStyle(1, COLORS.gridBorder, 1);
    bg.strokeRect(0, y, CANVAS_WIDTH, BOTTOM_BAR_HEIGHT);

    scene.add
      .text(
        CANVAS_WIDTH / 2,
        y + BOTTOM_BAR_HEIGHT / 2,
        'Towers and Start Wave controls arrive in Slice 2',
        {
          fontSize: '18px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
          fontStyle: 'italic',
        },
      )
      .setOrigin(0.5);
  }
}
