import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCENE_KEYS } from '../config/constants';
import { loadSave } from '../systems/SaveManager';

export class StatsScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.STATS);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const save = loadSave();

    this.add
      .text(CANVAS_WIDTH / 2, 80, 'Player Stats', {
        fontSize: '48px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const campaignBest = save.stats.bestWaveReached > 0 ? String(save.stats.bestWaveReached) : '—';
    const endlessBest = save.stats.endlessBestWave > 0 ? String(save.stats.endlessBestWave) : '—';
    const bestWaveValue = `Campaign: ${campaignBest} • Endless: ${endlessBest}`;

    const rows: Array<[string, string]> = [
      ['Best Wave Reached', bestWaveValue],
      ['Total Runs', String(save.stats.totalRuns)],
      ['Total Waves Cleared', String(save.stats.totalWavesCleared)],
      ['Total Enemies Killed', String(save.stats.totalEnemiesKilled)],
    ];

    const startY = 240;
    const rowH = 44;
    const labelX = CANVAS_WIDTH / 2 - 260;
    const valueX = CANVAS_WIDTH / 2 + 260;

    rows.forEach(([label, value], i) => {
      const y = startY + i * rowH;
      this.add
        .rectangle(CANVAS_WIDTH / 2, y + rowH / 2 - 4, 600, rowH - 8, 0x141a2a)
        .setStrokeStyle(1, COLORS.gridBorder, 1);
      this.add
        .text(labelX, y + rowH / 2 - 4, label, {
          fontSize: '18px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
        })
        .setOrigin(0, 0.5);
      this.add
        .text(valueX, y + rowH / 2 - 4, value, {
          fontSize: '20px',
          color: COLORS.textPrimary,
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);
    });

    const back = this.add
      .text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60, '< Back to Menu', {
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
