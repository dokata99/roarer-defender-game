import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants';

export class PauseOverlay {
  private layer: Phaser.GameObjects.Container;
  private visible = false;

  constructor(scene: Phaser.Scene, onResume: () => void, onQuit: () => void) {
    this.layer = scene.add.container(0, 0);
    this.layer.setDepth(1000);
    this.layer.setVisible(false);

    const bg = scene.add.rectangle(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      0x000000,
      0.6,
    );
    const title = scene.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100, 'SYSTEM PAUSED', {
        fontSize: '56px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const resumeBtn = scene.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'Resume', {
        fontSize: '28px',
        color: COLORS.textAccent,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => onResume());

    const quitBtn = scene.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60, 'Quit Run', {
        fontSize: '24px',
        color: COLORS.textDanger,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    quitBtn.on('pointerdown', () => onQuit());

    const footer = scene.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 130, 'Threat actors awaiting signal.', {
        fontSize: '16px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    this.layer.add([bg, title, resumeBtn, quitBtn, footer]);
  }

  show(): void {
    this.visible = true;
    this.layer.setVisible(true);
  }

  hide(): void {
    this.visible = false;
    this.layer.setVisible(false);
  }

  isVisible(): boolean {
    return this.visible;
  }
}
