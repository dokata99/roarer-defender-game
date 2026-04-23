import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BOTTOM_BAR_HEIGHT, COLORS } from '../config/constants';
import { TOWER_CONFIGS, type TowerType } from '../config/towers';
import type { RunContext } from '../systems/RunContext';
import type { Tower } from '../entities/Tower';
import type { WaveFlavor } from '../config/waveFlavor';

export type GamePhase = 'build' | 'wave';

export interface BottomBarViewState {
  phase: GamePhase;
  gold: number;
  placementType: TowerType | null;
  selectedTower: Tower | null;
  nextWaveNumber: number | null;
  nextWaveFlavor: WaveFlavor | null;
  currentWaveNumber: number | null;
  currentWaveFlavor: WaveFlavor | null;
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
      this.renderNextWaveFlavor(state);
      this.renderStartWave(state);
    } else {
      this.renderWaveInfo(state);
    }
  }

  /** "WAVE 07 — PING SWEEP" + italic subtitle, wedged between tower picker and Start Wave. */
  private renderNextWaveFlavor(state: BottomBarViewState): void {
    if (!state.nextWaveFlavor || state.nextWaveNumber == null) return;
    const leftEdge = 620;
    const rightEdge = CANVAS_WIDTH - 170 - 32 - 16;
    const width = Math.max(160, rightEdge - leftEdge);
    const centerX = leftEdge + width / 2;
    const baseY = this.barY + BOTTOM_BAR_HEIGHT / 2 - 14;

    const waveNum = state.nextWaveNumber.toString().padStart(2, '0');
    const heading = this.scene.add
      .text(centerX, baseY, `WAVE ${waveNum} — ${state.nextWaveFlavor.name}`, {
        fontSize: '15px',
        color: COLORS.textAccent,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    const subtitle = this.scene.add
      .text(centerX, baseY + 20, `"${state.nextWaveFlavor.subtitle}"`, {
        fontSize: '12px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
        fontStyle: 'italic',
        wordWrap: { width, useAdvancedWrap: true },
        align: 'center',
      })
      .setOrigin(0.5, 0);

    this.layer.add([heading, subtitle]);
  }

  private renderTowerPicker(state: BottomBarViewState): void {
    const types: TowerType[] = ['splash', 'sniper', 'frost'];
    const startX = 16;
    const buttonSize = 52;
    const statsWidth = 108;
    const statsGap = 6;
    const slotGap = 10;
    const slotWidth = buttonSize + statsGap + statsWidth;

    types.forEach((type, i) => {
      const x = startX + i * (slotWidth + slotGap);
      const y = this.barY + 10;
      const cfg = TOWER_CONFIGS[type];
      const stats = this.context.getTowerStats(type, 1);
      const inPlacement = state.placementType === type;
      const affordable = state.gold >= stats.cost;
      const artKey = cfg.art?.bodyKey;
      const hasArt = !!artKey && this.scene.textures.exists(artKey);

      const cx = x + buttonSize / 2;
      const cy = y + buttonSize / 2;

      // When art is available, use a dark backdrop so the sprite reads against it;
      // otherwise the tower's color swatch fills the button.
      const bg = this.scene.add.rectangle(
        cx,
        cy,
        buttonSize,
        buttonSize,
        hasArt ? 0x141a2a : cfg.color,
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

      let artImg: Phaser.GameObjects.Image | null = null;
      if (hasArt && artKey) {
        artImg = this.scene.add.image(cx, cy, artKey);
        const source = this.scene.textures.get(artKey).source[0];
        const fit = buttonSize - 6;
        const fitScale = Math.min(fit / source.width, fit / source.height);
        const scale = fitScale * (cfg.art?.bodyScaleMultiplier ?? 1);
        artImg.setScale(scale);
        artImg.setAlpha(affordable ? 1 : 0.4);
      }

      const label = this.scene.add
        .text(
          x + buttonSize / 2,
          y + buttonSize + 4,
          inPlacement ? 'Cancel (X)' : cfg.displayName,
          {
            fontSize: '12px',
            color: affordable ? COLORS.textPrimary : COLORS.textMuted,
            fontFamily: 'sans-serif',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5, 0);

      const costText = this.scene.add
        .text(x + buttonSize / 2, y + buttonSize + 20, `${stats.cost}g`, {
          fontSize: '11px',
          color: affordable ? COLORS.textGold : COLORS.textMuted,
          fontFamily: 'sans-serif',
        })
        .setOrigin(0.5, 0);

      const statsText = this.scene.add
        .text(x + buttonSize + statsGap, y, this.towerStatsSummary(type), {
          fontSize: '11px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
          lineSpacing: 1,
          wordWrap: { width: statsWidth, useAdvancedWrap: true },
        })
        .setOrigin(0, 0);

      this.layer.add([bg, label, costText, statsText]);
      if (artImg) this.layer.add(artImg);
    });

    const lastSlotRight = startX + types.length * slotWidth + (types.length - 1) * slotGap;
    const hint = this.scene.add
      .text(
        lastSlotRight + 12,
        this.barY + BOTTOM_BAR_HEIGHT - 4,
        'Left-click grid to place · Right-click / ESC to cancel',
        {
          fontSize: '11px',
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
      `Dmg: ${lv1.damage}`,
      `Rng: ${lv1.rangeTiles.toFixed(1)}`,
      `Rate: ${(1000 / lv1.attackIntervalMs).toFixed(2)}/s`,
    ];
    if (lv1.splashRadiusTiles) lines.push(`Splash: ${lv1.splashRadiusTiles.toFixed(1)}`);
    if (lv1.slowMultiplier !== undefined && lv1.slowDurationMs !== undefined) {
      const slowPct = Math.round((1 - lv1.slowMultiplier) * 100);
      lines.push(`Slow: -${slowPct}% / ${(lv1.slowDurationMs / 1000).toFixed(1)}s`);
    }
    if (type === 'sniper' && this.context.sniperCritChance > 0) {
      lines.push(`Crit: ${Math.round(this.context.sniperCritChance * 100)}%`);
    }
    return lines.join('\n');
  }

  private renderStartWave(state: BottomBarViewState): void {
    const width = 170;
    const height = 62;
    const x = CANVAS_WIDTH - width - 32;
    const y = this.barY + 16;

    // "DEPLOY" per 02-01 §5 / 02-03 §5.2 — thematic rename of the wave-start button.
    const rect = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x0b0c10);
    rect.setStrokeStyle(2, 0x00ff6a, 0.9);
    rect.setInteractive({ useHandCursor: true });
    rect.on('pointerover', () => rect.setFillStyle(0x0a1f0a));
    rect.on('pointerout', () => rect.setFillStyle(0x0b0c10));
    rect.on('pointerdown', () => this.controller.onStartWave());

    const label = this.scene.add
      .text(x + width / 2, y + height / 2 - 8, 'DEPLOY', {
        fontSize: '18px',
        color: '#00ff6a',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const previewText =
      state.nextWaveNumber != null
        ? `Wave ${state.nextWaveNumber.toString().padStart(2, '0')}`
        : '—';
    const preview = this.scene.add
      .text(x + width / 2, y + height / 2 + 14, previewText, {
        fontSize: '11px',
        color: COLORS.textAccent,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.layer.add([rect, label, preview]);
  }

  private renderWaveInfo(state: BottomBarViewState): void {
    const waveNum = state.currentWaveNumber != null
      ? state.currentWaveNumber.toString().padStart(2, '0')
      : '--';
    const flavorName = state.currentWaveFlavor?.name ?? '';
    const headline = flavorName
      ? `Wave in progress — WAVE ${waveNum}: ${flavorName}`
      : `Wave in progress — WAVE ${waveNum}`;

    const info = this.scene.add
      .text(32, this.barY + BOTTOM_BAR_HEIGHT / 2 - 22, headline, {
        fontSize: '15px',
        color: COLORS.textAccent,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.layer.add(info);

    if (state.currentWaveFlavor) {
      const subtitle = this.scene.add
        .text(
          32,
          this.barY + BOTTOM_BAR_HEIGHT / 2 + 0,
          `"${state.currentWaveFlavor.subtitle}"`,
          {
            fontSize: '12px',
            color: COLORS.textMuted,
            fontFamily: 'sans-serif',
            fontStyle: 'italic',
          },
        )
        .setOrigin(0, 0.5);
      this.layer.add(subtitle);
    }

    const hint = this.scene.add
      .text(
        32,
        this.barY + BOTTOM_BAR_HEIGHT / 2 + 22,
        'Click a tower to upgrade it. Placing and selling are disabled during waves.',
        {
          fontSize: '11px',
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
    const width = 110;
    const height = 40;
    const x = CANVAS_WIDTH - width - 32;
    const y = this.barY + BOTTOM_BAR_HEIGHT / 2 - height / 2;

    const rect = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x333344);
    rect.setStrokeStyle(2, 0xaaaaaa, 0.9);
    rect.setInteractive({ useHandCursor: true });
    rect.on('pointerdown', () => this.controller.onPause());
    const label = this.scene.add
      .text(x + width / 2, y + height / 2, 'Pause', {
        fontSize: '15px',
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

    const infoX = 32;
    const infoY = this.barY + 10;

    const header = this.scene.add
      .text(infoX, infoY, `${cfg.displayName} Tower · Level ${tower.level}`, {
        fontSize: '16px',
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
    if (stats.slowMultiplier !== undefined && stats.slowDurationMs !== undefined) {
      const slowPct = Math.round((1 - stats.slowMultiplier) * 100);
      lines.push(`Slow: -${slowPct}% for ${(stats.slowDurationMs / 1000).toFixed(1)}s`);
    }

    const body = this.scene.add
      .text(infoX, infoY + 24, lines.join('\n'), {
        fontSize: '11px',
        color: COLORS.textMuted,
        fontFamily: 'sans-serif',
        lineSpacing: 2,
      })
      .setOrigin(0, 0);

    this.layer.add([header, body]);

    // Action buttons on the right — stacked horizontally to fit the shorter bar.
    const btnWidth = 130;
    const btnHeight = 34;
    const btnGap = 8;
    const btnY = this.barY + (BOTTOM_BAR_HEIGHT - btnHeight) / 2;
    const deselectX = CANVAS_WIDTH - btnWidth - 32;
    const sellX = deselectX - btnWidth - btnGap;
    const upgradeX = sellX - btnWidth - btnGap;

    // Upgrade button (allowed in build and wave phase)
    if (tower.canUpgrade()) {
      const upgradeCost = tower.upgradeCost();
      const canAfford = state.gold >= upgradeCost;
      this.makeButton(
        upgradeX,
        btnY,
        btnWidth,
        btnHeight,
        `Upgrade (${upgradeCost}g)`,
        canAfford ? 0x336699 : 0x333344,
        canAfford,
        () => this.controller.onUpgradeSelected(),
      );
    } else {
      const rect = this.scene.add.rectangle(
        upgradeX + btnWidth / 2,
        btnY + btnHeight / 2,
        btnWidth,
        btnHeight,
        0x333344,
      );
      rect.setStrokeStyle(2, 0x555566, 0.6);
      const text = this.scene.add
        .text(upgradeX + btnWidth / 2, btnY + btnHeight / 2, 'Max Level', {
          fontSize: '13px',
          color: COLORS.textMuted,
          fontFamily: 'sans-serif',
        })
        .setOrigin(0.5);
      this.layer.add([rect, text]);
    }

    // Sell button — build phase only
    if (state.phase === 'build') {
      this.makeButton(
        sellX,
        btnY,
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
      deselectX,
      btnY,
      btnWidth,
      btnHeight,
      'Deselect',
      0x444455,
      true,
      () => this.controller.onDeselectTower(),
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
        fontSize: '13px',
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
