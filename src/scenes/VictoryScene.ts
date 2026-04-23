import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCENE_KEYS } from '../config/constants';
import type { RunResult } from './GameScene';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.VICTORY);
  }

  create(data?: RunResult) {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 140, 'VICTORY', {
        fontSize: '96px',
        color: '#ffcc66',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const wavesCleared = data?.wavesCleared ?? 10;
    const enemiesKilled = data?.enemiesKilled ?? 0;
    const towersPlaced = data?.towersPlaced ?? 0;
    const rpEarned = data?.roarerPointsEarned ?? wavesCleared;
    const firstVictory = data?.firstVictory ?? false;

    const lines = [
      `Waves cleared: ${wavesCleared}`,
      `Enemies killed: ${enemiesKilled}`,
      `Towers placed: ${towersPlaced}`,
      `Roarer Points earned: ${rpEarned}`,
    ];

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10, lines.join('\n'), {
        fontSize: '22px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    if (firstVictory) {
      this.add
        .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120, '⚑ Endless Mode Unlocked!', {
          fontSize: '26px',
          color: '#66ffff',
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    const back = this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 180, 'Back to Menu', {
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
