import Phaser from 'phaser';
import { COLORS, SCENE_KEYS } from '../config/constants';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MAIN_MENU);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Roarer Defense (loading…)', {
        fontSize: '32px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);
  }
}
