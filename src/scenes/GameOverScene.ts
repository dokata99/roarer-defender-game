import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCENE_KEYS } from '../config/constants';
import type { RunResult } from './GameScene';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }

  create(data?: RunResult) {
    this.cameras.main.setBackgroundColor(COLORS.background);

    const isEndless = data?.mode === 'endless';
    const wavesCleared = data?.wavesCleared ?? 0;
    const breachWave = wavesCleared + 1;

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 180, 'SYSTEM COMPROMISED', {
        fontSize: '64px',
        color: COLORS.textDanger,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120, `"Breach at wave ${breachWave}."`, {
        fontSize: '22px',
        color: COLORS.textAccent,
        fontFamily: 'sans-serif',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    if (isEndless) {
      this.add
        .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90, 'Endless Mode', {
          fontSize: '16px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
        })
        .setOrigin(0.5);
    }

    const enemiesKilled = data?.enemiesKilled ?? 0;
    const rpEarned = data?.roarerPointsEarned ?? wavesCleared;

    const lines = [
      `${isEndless ? 'Waves cleared' : 'Waves survived'}: ${wavesCleared}`,
      `Enemies killed: ${enemiesKilled}`,
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

    this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90, 'Patch the weakness. Try again.', {
        fontSize: '18px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 150, 'Back to Menu', {
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
