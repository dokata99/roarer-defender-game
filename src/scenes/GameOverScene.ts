import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCENE_KEYS } from '../config/constants';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100, 'DEFEAT', {
        fontSize: '96px',
        color: COLORS.textDanger,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2,
        'Run summary placeholder — real stats arrive in Slice 2',
        {
          fontSize: '18px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
          fontStyle: 'italic',
        },
      )
      .setOrigin(0.5);

    const back = this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80, 'Back to Menu', {
        fontSize: '28px',
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
