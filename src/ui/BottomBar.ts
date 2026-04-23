import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BOTTOM_BAR_HEIGHT, COLORS } from '../config/constants';
import { TOWER_CONFIGS, type TowerType } from '../config/towers';
import type { RunContext } from '../systems/RunContext';
import type { Tower } from '../entities/Tower';

export type GamePhase = 'build' | 'wave';

export interface BottomBarViewState {
  phase: GamePhase;
  gold: number;
  placementType: TowerType | null;
  selectedTower: Tower | null;
  nextWaveLabel: string | null;
  currentWaveLabel: string | null;
}

export interface BottomBarController {
  onSelectTowerType(type: TowerType): void;
  onCancelPlacement(): void;
  onStartWave(): void;
  onUpgradeSelected(): void;
  onSellSelected(): void;
  onDeselectTower(): void;
  onPause(): void;
}

export class BottomBar {
  private layer: Phaser.GameObjects.Container;
  private barY: number;

  constructor(
    private scene: Phaser.Scene,
    private controller: BottomBarController,
    private context: RunContext,
  ) {
    this.barY = CANVAS_HEIGHT - BOTTOM_BAR_HEIGHT;

    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.bottomBarBg, 1);
    bg.fillRect(0, this.barY, CANVAS_WIDTH, BOTTOM_BAR_HEIGHT);
    bg.lineStyle(1, COLORS.gridBorder, 1);
    bg.strokeRect(0, this.barY, CANVAS_WIDTH, BOTTOM_BAR_HEIGHT);

    this.layer = scene.add.container(0, 0);
  }

  render(state: BottomBarViewState): void {
    this.layer.removeAll(true);

    if (state.selectedTower) {
      this.renderSelectedTowerPanel(state);
      return;
    }

    if (state.phase === 'build') {
      this.renderTowerPicker(state);
      this.renderStartWave(state);
    } else {
      this.renderWaveInfo(state);
    }
  }

  private renderTowerPicker(state: BottomBarViewState): void {
    const types: TowerType[] = ['splash', 'sniper'];
    const startX = 40;
    const buttonSize = 88;
    const statsWidth = 150;
    const statsGap = 10;
    const slotGap = 24;
    const slotWidth = buttonSize + statsGap + statsWidth;

    types.forEach((type, i) => {
      const x = startX + i * (slotWidth + slotGap);
      const y = this.barY + 16;
      const cfg = TOWER_CONFIGS[type];
      const stats = this.context.getTowerStats(type, 1);
      const inPlacement = state.placementType === type;
      const affordable = state.gold >= stats.cost;

      const bg = this.scene.add.rectangle(
        x + buttonSize / 2,
        y + buttonSize / 2,
        buttonSize,
        buttonSize,
        cfg.color,
        affordable ? 1 : 0.35,
      );
      bg.setStrokeStyle(inPlacement ? 4 : 2, inPlacement ? 0xffff55 : 0xffffff, 0.9);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        if (inPlacement) {
          this.controller.onCancelPlacement();
        } else if (affordable) {
          this.controller.onSelectTowerType(type);
        }
      });

      const label = this.scene.add
        .text(
          x + buttonSize / 2,
          y + buttonSize + 6,
          inPlacement ? 'Cancel (X)' : cfg.displayName,
          {
            fontSize: '14px',
            color: affordable ? COLORS.textPrimary : COLORS.textMuted,
            fontFamily: 'sans-serif',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5, 0);

      const costText = this.scene.add
        .text(x + buttonSize / 2, y + buttonSize + 26, `${stats.cost}g`, {
          fontSize: '13px',
          color: affordable ? COLORS.textGold : COLORS.textMuted,
          fontFamily: 'sans-serif',
        })
        .setOrigin(0.5, 0);

      const statsText = this.scene.add
        .text(x + buttonSize + statsGap, y, this.towerStatsSummary(type), {
          fontSize: '12px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
          lineSpacing: 2,
          wordWrap: { width: statsWidth, useAdvancedWrap: true },
        })
        .setOrigin(0, 0);

      this.layer.add([bg, label, costText, statsText]);
    });

    const lastSlotRight = startX + types.length * slotWidth + (types.length - 1) * slotGap;
    const hint = this.scene.add
      .text(
        lastSlotRight + 16,
        this.barY + BOTTOM_BAR_HEIGHT - 6,
        'Left-click grid to place · Right-click / ESC to cancel',
        {
          fontSize: '12px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
          fontStyle: 'italic',
        },
      )
      .setOrigin(0, 1);
    this.layer.add(hint);
  }

  private towerStatsSummary(type: TowerType): string {
    const lv1 = this.context.getTowerStats(type, 1);
    const lines = [
      `Damage: ${lv1.damage}`,
      `Range: ${lv1.rangeTiles.toFixed(1)} tiles`,
      `Rate: ${(1000 / lv1.attackIntervalMs).toFixed(2)}/s`,
    ];
    if (lv1.splashRadiusTiles) lines.push(`Splash: ${lv1.splashRadiusTiles.toFixed(1)} tiles`);
    if (type === 'sniper' && this.context.sniperCritChance > 0) {
      lines.push(`Crit: ${Math.round(this.context.sniperCritChance * 100)}%`);
    }
    return lines.join('\n');
  }

  private renderStartWave(state: BottomBarViewState): void {
    const width = 220;
    const height = 80;
    const x = CANVAS_WIDTH - width - 40;
    const y = this.barY + 24;

    const rect = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x225533);
    rect.setStrokeStyle(3, 0x55ff99, 0.9);
    rect.setInteractive({ useHandCursor: true });
    rect.on('pointerover', () => rect.setFillStyle(0x2b6a40));
    rect.on('pointerout', () => rect.setFillStyle(0x225533));
    rect.on('pointerdown', () => this.controller.onStartWave());

    const label = this.scene.add
      .text(x + width / 2, y + height / 2 - 10, 'Start Wave', {
        fontSize: '22px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const preview = this.scene.add
      .text(x + width / 2, y + height / 2 + 18, state.nextWaveLabel ?? '—', {
        fontSize: '13px',
        color: COLORS.textAccent,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.layer.add([rect, label, preview]);
  }

  private renderWaveInfo(state: BottomBarViewState): void {
    const info = this.scene.add
      .text(
        40,
        this.barY + BOTTOM_BAR_HEIGHT / 2,
        `Wave in progress — ${state.currentWaveLabel ?? ''}`,
        {
          fontSize: '18px',
          color: COLORS.textAccent,
          fontFamily: 'sans-serif',
        },
      )
      .setOrigin(0, 0.5);
    this.layer.add(info);

    const hint = this.scene.add
      .text(
        40,
        this.barY + BOTTOM_BAR_HEIGHT / 2 + 24,
        'Click a tower to upgrade it. Placing and selling are disabled during waves.',
        {
          fontSize: '12px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
          fontStyle: 'italic',
        },
      )
      .setOrigin(0, 0.5);
    this.layer.add(hint);

    this.addPauseButton();
  }

  private addPauseButton(): void {
    const width = 140;
    const height = 48;
    const x = CANVAS_WIDTH - width - 40;
    const y = this.barY + BOTTOM_BAR_HEIGHT / 2 - height / 2;

    const rect = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x333344);
    rect.setStrokeStyle(2, 0xaaaaaa, 0.9);
    rect.setInteractive({ useHandCursor: true });
    rect.on('pointerdown', () => this.controller.onPause());
    const label = this.scene.add
      .text(x + width / 2, y + height / 2, 'Pause', {
        fontSize: '18px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add([rect, label]);
  }

  private renderSelectedTowerPanel(state: BottomBarViewState): void {
    const tower = state.selectedTower!;
    const stats = tower.getStats();
    const cfg = TOWER_CONFIGS[tower.type];

    const infoX = 40;
    const infoY = this.barY + 20;

    const header = this.scene.add
      .text(infoX, infoY, `${cfg.displayName} Tower · Level ${tower.level}`, {
        fontSize: '20px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    const lines = [
      `Damage: ${stats.damage}`,
      `Range: ${stats.rangeTiles} tiles`,
      `Attack rate: ${(1000 / stats.attackIntervalMs).toFixed(2)}/s`,
    ];
    if (stats.splashRadiusTiles) lines.push(`Splash radius: ${stats.splashRadiusTiles} tiles`);

    const body = this.scene.add
      .text(infoX, infoY + 32, lines.join('\n'), {
        fontSize: '13px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
        lineSpacing: 4,
      })
      .setOrigin(0, 0);

    this.layer.add([header, body]);

    // Action buttons on the right
    const btnWidth = 160;
    const btnHeight = 46;
    const btnX = CANVAS_WIDTH - btnWidth - 40;
    const upgradeY = infoY;
    const sellY = upgradeY + btnHeight + 10;
    const deselectY = sellY + btnHeight + 10;

    // Upgrade button (allowed in build and wave phase)
    if (tower.canUpgrade()) {
      const upgradeCost = tower.upgradeCost();
      const canAfford = state.gold >= upgradeCost;
      this.makeButton(
        btnX,
        upgradeY,
        btnWidth,
        btnHeight,
        `Upgrade (${upgradeCost}g)`,
        canAfford ? 0x336699 : 0x333344,
        canAfford,
        () => this.controller.onUpgradeSelected(),
      );
    } else {
      const rect = this.scene.add.rectangle(
        btnX + btnWidth / 2,
        upgradeY + btnHeight / 2,
        btnWidth,
        btnHeight,
        0x333344,
      );
      rect.setStrokeStyle(2, 0x555566, 0.6);
      const text = this.scene.add
        .text(btnX + btnWidth / 2, upgradeY + btnHeight / 2, 'Max Level', {
          fontSize: '16px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
        })
        .setOrigin(0.5);
      this.layer.add([rect, text]);
    }

    // Sell button — build phase only
    if (state.phase === 'build') {
      this.makeButton(
        btnX,
        sellY,
        btnWidth,
        btnHeight,
        `Sell (+${tower.sellRefund()}g)`,
        0x993333,
        true,
        () => this.controller.onSellSelected(),
      );
    }

    // Deselect
    this.makeButton(
      btnX,
      state.phase === 'build' ? deselectY : sellY,
      btnWidth,
      btnHeight,
      'Deselect',
      0x444455,
      true,
      () => this.controller.onDeselectTower(),
      36,
    );
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    color: number,
    enabled: boolean,
    onClick: () => void,
    height?: number,
  ): void {
    const boxH = height ?? h;
    const rect = this.scene.add.rectangle(
      x + w / 2,
      y + boxH / 2,
      w,
      boxH,
      color,
      enabled ? 1 : 0.4,
    );
    rect.setStrokeStyle(2, 0xffffff, 0.7);
    const label = this.scene.add
      .text(x + w / 2, y + boxH / 2, text, {
        fontSize: '16px',
        color: enabled ? COLORS.textPrimary : COLORS.textMuted,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    if (enabled) {
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerdown', onClick);
    }
    this.layer.add([rect, label]);
  }
}
