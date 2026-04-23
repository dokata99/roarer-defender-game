import Phaser from 'phaser';
import { CANVAS_WIDTH, HUD_HEIGHT, COLORS } from '../config/constants';

export class HUD {
  private securityText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.hudBg, 1);
    bg.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
    bg.lineStyle(1, COLORS.gridBorder, 1);
    bg.strokeRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

    this.securityText = scene.add
      .text(160, HUD_HEIGHT / 2, 'Security: 100%', {
        fontSize: '20px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0, 0.5);

    this.goldText = scene.add
      .text(CANVAS_WIDTH / 2, HUD_HEIGHT / 2, 'Gold: 100', {
        fontSize: '20px',
        color: COLORS.textGold,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.waveText = scene.add
      .text(CANVAS_WIDTH - 40, HUD_HEIGHT / 2, 'Wave: 0 / 10', {
        fontSize: '20px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(1, 0.5);

    this.phaseText = scene.add
      .text(CANVAS_WIDTH / 2, HUD_HEIGHT + 6, 'Build Phase', {
        fontSize: '14px',
        color: COLORS.textAccent,
        fontFamily: 'sans-serif',
        fontStyle: 'italic',
      })
      .setOrigin(0.5, 0);
  }

  setSecurity(security: number): void {
    this.securityText.setText(`Security: ${Math.max(0, security)}%`);
  }

  setGold(gold: number): void {
    this.goldText.setText(`Gold: ${gold}`);
  }

  setWave(waveNumber: number, total: number): void {
    this.waveText.setText(`Wave: ${waveNumber} / ${total}`);
  }

  /** Free-form label (e.g. Endless mode: "Wave: 17"). */
  setWaveLabel(label: string): void {
    this.waveText.setText(label);
  }

  setPhase(label: string): void {
    this.phaseText.setText(label);
  }
}
