import Phaser from 'phaser';
import { CANVAS_WIDTH, COLORS, SCENE_KEYS } from '../config/constants';

type MenuButton = {
  label: string;
  targetScene: string | null;
  enabled: boolean;
};

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MAIN_MENU);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(CANVAS_WIDTH / 2, 120, 'Roarer Defense', {
        fontSize: '72px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, 190, 'Defend the server from internet threats', {
        fontSize: '18px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    const buttons: MenuButton[] = [
      { label: 'Start Run', targetScene: SCENE_KEYS.GAME, enabled: true },
      { label: 'Endless Mode  [LOCKED]', targetScene: null, enabled: false },
      { label: 'Shop', targetScene: SCENE_KEYS.SHOP, enabled: true },
      { label: 'Stats', targetScene: SCENE_KEYS.STATS, enabled: true },
      { label: 'Credits', targetScene: SCENE_KEYS.CREDITS, enabled: true },
    ];

    const startY = 290;
    const gap = 64;

    buttons.forEach((btn, i) => {
      const y = startY + i * gap;
      const baseColor = btn.enabled ? COLORS.textPrimary : COLORS.textMuted;

      const text = this.add
        .text(CANVAS_WIDTH / 2, y, btn.label, {
          fontSize: '30px',
          color: baseColor,
          fontFamily: 'sans-serif',
        })
        .setOrigin(0.5);

      if (btn.enabled && btn.targetScene) {
        const target = btn.targetScene;
        text.setInteractive({ useHandCursor: true });
        text.on('pointerover', () => text.setColor(COLORS.textAccent));
        text.on('pointerout', () => text.setColor(baseColor));
        text.on('pointerdown', () => this.scene.start(target));
      }
    });
  }
}
