import Phaser from 'phaser';
import { CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, SCENE_KEYS } from '../config/constants';
import { loadSave } from '../systems/SaveManager';

const MENU_BG_KEY = 'menu-bg';

type MenuButton = {
  label: string;
  targetScene: string | null;
  enabled: boolean;
  sceneData?: Record<string, unknown>;
};

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MAIN_MENU);
  }

  preload() {
    this.load.image(MENU_BG_KEY, 'assets/environment/Gemini_Generated_Image_gz5s10gz5s10gz5s-2.png');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    if (this.textures.exists(MENU_BG_KEY)) {
      const bg = this.add.image(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, MENU_BG_KEY);
      const scale = Math.max(CANVAS_WIDTH / bg.width, CANVAS_HEIGHT / bg.height);
      bg.setScale(scale);
      bg.setDepth(-1000);

      this.add
        .rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.8)
        .setDepth(-999);
    }

    const save = loadSave();

    this.add
      .text(CANVAS_WIDTH / 2, 160, 'Roarers Defence', {
        fontSize: '72px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const endlessUnlocked = save.endlessModeUnlocked;
    const buttons: MenuButton[] = [
      {
        label: 'Start Run',
        targetScene: SCENE_KEYS.GAME,
        enabled: true,
        sceneData: { mode: 'campaign' },
      },
      {
        label: endlessUnlocked ? 'Endless Mode' : 'Endless Mode  [LOCKED]',
        targetScene: endlessUnlocked ? SCENE_KEYS.GAME : null,
        enabled: endlessUnlocked,
        sceneData: { mode: 'endless' },
      },
      { label: 'Shop', targetScene: SCENE_KEYS.SHOP, enabled: true },
      { label: 'Stats', targetScene: SCENE_KEYS.STATS, enabled: true },
      { label: 'Credits', targetScene: SCENE_KEYS.CREDITS, enabled: true },
    ];

    const startY = 290;
    const gap = 56;

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
        const data = btn.sceneData;
        text.setInteractive({ useHandCursor: true });
        text.on('pointerover', () => text.setColor(COLORS.textAccent));
        text.on('pointerout', () => text.setColor(baseColor));
        text.on('pointerdown', () => this.scene.start(target, data));
      }
    });

    if (!endlessUnlocked) {
      this.add
        .text(CANVAS_WIDTH / 2, startY + gap + 24, 'Clear all 10 waves to unlock Endless Mode', {
          fontSize: '12px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
          fontStyle: 'italic',
        })
        .setOrigin(0.5);
    }
  }
}
