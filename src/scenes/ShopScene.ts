import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCENE_KEYS } from '../config/constants';
import { UPGRADE_CONFIGS, nextLevelCost, type UpgradeConfig } from '../config/upgrades';
import { loadSave, writeSave } from '../systems/SaveManager';
import { RunContext } from '../systems/RunContext';
import type { SaveData } from '../types/save';

interface UpgradeRow {
  cfg: UpgradeConfig;
  pips: Phaser.GameObjects.Rectangle[];
  btnRect: Phaser.GameObjects.Rectangle;
  btnText: Phaser.GameObjects.Text;
}

export class ShopScene extends Phaser.Scene {
  private save!: SaveData;
  private rpText!: Phaser.GameObjects.Text;
  private rows: UpgradeRow[] = [];
  private summaryText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.SHOP);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.save = loadSave();
    this.rows = [];

    this.add
      .text(CANVAS_WIDTH / 2, 44, 'Shop', {
        fontSize: '44px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.rpText = this.add
      .text(CANVAS_WIDTH / 2, 86, '', {
        fontSize: '22px',
        color: COLORS.textGold,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(40, 40, '< Back to Menu', {
        fontSize: '18px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor(COLORS.textAccent));
    back.on('pointerout', () => back.setColor(COLORS.textPrimary));
    back.on('pointerdown', () => this.scene.start(SCENE_KEYS.MAIN_MENU));

    this.renderRows();
    this.renderSummaryPanel();
    this.refresh();

    const reset = this.add
      .text(CANVAS_WIDTH - 40, CANVAS_HEIGHT - 20, '[DEV] Reset Save', {
        fontSize: '12px',
        color: COLORS.textDanger,
        fontFamily: 'sans-serif',
      })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true });
    reset.on('pointerdown', () => {
      localStorage.removeItem('roarerDefense.save.v1');
      this.scene.start(SCENE_KEYS.MAIN_MENU);
    });
  }

  private renderRows(): void {
    const startY = 108;
    const rowHeight = 48;
    const panelX = 60;
    const panelW = CANVAS_WIDTH - 120;

    UPGRADE_CONFIGS.forEach((cfg, i) => {
      const y = startY + i * rowHeight;

      const bg = this.add.rectangle(
        panelX + panelW / 2,
        y + rowHeight / 2 - 4,
        panelW,
        rowHeight - 8,
        0x141a2a,
      );
      bg.setStrokeStyle(1, COLORS.gridBorder, 1);

      this.add
        .text(panelX + 16, y + 6, cfg.name, {
          fontSize: '17px',
          color: COLORS.textPrimary,
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0);

      this.add
        .text(panelX + 16, y + 28, `${cfg.description}  ·  ${cfg.perLevelEffect}/lvl`, {
          fontSize: '12px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
        })
        .setOrigin(0, 0);

      // Level pips
      const pipSize = 14;
      const pipGap = 6;
      const pipsW = cfg.maxLevel * pipSize + (cfg.maxLevel - 1) * pipGap;
      const pipsStart = panelX + panelW - 170 - pipsW - 24;
      const pips: Phaser.GameObjects.Rectangle[] = [];
      for (let lvl = 0; lvl < cfg.maxLevel; lvl++) {
        const pip = this.add.rectangle(
          pipsStart + lvl * (pipSize + pipGap) + pipSize / 2,
          y + rowHeight / 2 - 4,
          pipSize,
          pipSize,
          0x222933,
        );
        pip.setStrokeStyle(1, 0x555566, 1);
        pips.push(pip);
      }

      // Buy button
      const btnW = 150;
      const btnH = 36;
      const btnX = panelX + panelW - btnW - 16;
      const btnY = y + rowHeight / 2 - btnH / 2 - 4;

      const btnRect = this.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH, 0x225533);
      btnRect.setStrokeStyle(2, 0x55ff99, 0.9);
      const btnText = this.add
        .text(btnX + btnW / 2, btnY + btnH / 2, '', {
          fontSize: '14px',
          color: COLORS.textPrimary,
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      btnRect.setInteractive({ useHandCursor: true });
      btnRect.on('pointerdown', () => this.buy(cfg));

      this.rows.push({ cfg, pips, btnRect, btnText });
    });
  }

  private renderSummaryPanel(): void {
    const panelX = 60;
    const panelW = CANVAS_WIDTH - 120;
    const panelY = 596;
    const panelH = 96;

    const bg = this.add.rectangle(
      panelX + panelW / 2,
      panelY + panelH / 2,
      panelW,
      panelH,
      0x141a2a,
    );
    bg.setStrokeStyle(1, COLORS.gridBorder, 1);

    this.add
      .text(panelX + 16, panelY + 8, 'Your Run Effects', {
        fontSize: '14px',
        color: COLORS.textAccent,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    this.summaryText = this.add
      .text(panelX + 16, panelY + 30, '', {
        fontSize: '13px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
  }

  private buildSummaryString(): string {
    const ctx = new RunContext(this.save.shopUpgrades);
    const dmg = ctx.damageMultiplier.toFixed(2);
    const rate = (1 / ctx.attackIntervalMultiplier).toFixed(2);
    const range = ctx.rangeBonusTiles.toFixed(1);
    const place = ctx.placeCostMultiplier.toFixed(2);
    const upgr = ctx.upgradeCostMultiplier.toFixed(2);
    const bounty = ctx.killBountyMultiplier.toFixed(2);
    const splash = ctx.splashRadiusBonusTiles.toFixed(1);
    const crit = Math.round(ctx.sniperCritChance * 100);

    return [
      `Towers:  ×${dmg} damage   ·   ×${rate} attack rate   ·   +${range} range   ·   +${splash} splash   ·   ${crit}% sniper crit`,
      `Economy:  ${ctx.startingGold}g start   ·   ×${place} placement cost   ·   ×${upgr} upgrade cost   ·   ×${bounty} kill bounty`,
      `Survival:  ${ctx.startingLives} lives`,
    ].join('\n');
  }

  private buy(cfg: UpgradeConfig): void {
    const currentLevel = this.save.shopUpgrades[cfg.id];
    const cost = nextLevelCost(cfg.id, currentLevel);
    if (cost === null) return;
    if (this.save.roarerPoints < cost) return;
    this.save.shopUpgrades[cfg.id] = currentLevel + 1;
    this.save.roarerPoints -= cost;
    writeSave(this.save);
    this.refresh();
  }

  private refresh(): void {
    this.rpText.setText(`Roarer Points: ${this.save.roarerPoints}`);
    this.summaryText.setText(this.buildSummaryString());

    for (const row of this.rows) {
      const level = this.save.shopUpgrades[row.cfg.id];
      row.pips.forEach((pip, idx) => {
        pip.setFillStyle(idx < level ? 0x66ff99 : 0x222933);
      });

      const cost = nextLevelCost(row.cfg.id, level);
      if (cost === null) {
        row.btnRect.setFillStyle(0x333344);
        row.btnRect.setStrokeStyle(2, 0x555566, 0.6);
        row.btnText.setText('MAX').setColor(COLORS.textMuted);
        row.btnRect.disableInteractive();
      } else {
        const canAfford = this.save.roarerPoints >= cost;
        row.btnRect.setFillStyle(canAfford ? 0x225533 : 0x333344);
        row.btnRect.setStrokeStyle(2, canAfford ? 0x55ff99 : 0x777788, 0.9);
        row.btnText
          .setText(`Buy · ${cost} RP`)
          .setColor(canAfford ? COLORS.textPrimary : COLORS.textMuted);
        if (canAfford) row.btnRect.setInteractive({ useHandCursor: true });
        else row.btnRect.disableInteractive();
      }
    }
  }
}
