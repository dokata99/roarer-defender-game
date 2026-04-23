import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  COLORS,
  SCENE_KEYS,
  PORTAL_CELLS,
  CASTLE_CELLS,
} from '../config/constants';
import { tierFromWave, type PathTier } from '../config/pathStyle';
import { registerPathTextures } from '../ui/PathTextures';
import { PathRenderer } from '../ui/PathRenderer';
import { PLACEMENT_HIGHLIGHT_DEPTH, RANGE_INDICATOR_DEPTH } from '../config/gameplay';
import { TOWER_CONFIGS, type TowerType } from '../config/towers';
import { getCampaignWaveConfig, TOTAL_CAMPAIGN_WAVES, type WaveConfig } from '../config/waves';
import { buildEndlessWave } from '../config/endless';
import { GridManager, cellKey, type CellCoord } from '../systems/GridManager';
import { PathfindingManager } from '../systems/PathfindingManager';
import { WaveManager } from '../systems/WaveManager';
import { RunContext } from '../systems/RunContext';
import { loadSave, writeSave } from '../systems/SaveManager';
import { HUD } from '../ui/HUD';
import { BottomBar, type BottomBarController } from '../ui/BottomBar';
import { PauseOverlay } from '../ui/PauseOverlay';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Projectile, SniperProjectile, SplashProjectile } from '../entities/Projectile';

type Phase = 'build' | 'wave' | 'defeated' | 'victory';
export type RunMode = 'campaign' | 'endless';

export interface RunResult {
  outcome: 'defeat' | 'victory';
  mode: RunMode;
  wavesCleared: number;
  enemiesKilled: number;
  towersPlaced: number;
  roarerPointsEarned: number;
  endlessUnlocked: boolean;
  firstVictory: boolean;
}

export interface GameSceneInit {
  mode?: RunMode;
}

export class GameScene extends Phaser.Scene implements BottomBarController {
  private grid!: GridManager;
  private pathfinder!: PathfindingManager;
  private waveManager = new WaveManager();
  private pathRenderer!: PathRenderer;
  private placementHighlight!: Phaser.GameObjects.Rectangle;
  private rangeIndicator!: Phaser.GameObjects.Arc;

  private cachedPaths = new Map<string, CellCoord[]>();
  private context!: RunContext;

  private phase: Phase = 'build';
  private gold = 0;
  private lives = 0;
  private waveIndex = 0; // 0 = not started, first wave = 1
  private placementType: TowerType | null = null;
  private selectedTower: Tower | null = null;

  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private enemiesKilled = 0;
  private firstBuildHint: Phaser.GameObjects.Text | null = null;

  private hud!: HUD;
  private bottomBar!: BottomBar;
  private pauseOverlay!: PauseOverlay;
  private paused = false;

  private escKey!: Phaser.Input.Keyboard.Key;
  private mode: RunMode = 'campaign';

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  init(data?: GameSceneInit) {
    this.mode = data?.mode ?? 'campaign';
  }

  async create() {
    this.resetState();
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.grid = new GridManager();
    this.pathfinder = new PathfindingManager(this.grid, PORTAL_CELLS, CASTLE_CELLS);

    this.drawGridCells();
    this.drawGridLines();
    this.drawPortalArt();
    this.drawCastleArt();

    registerPathTextures(this);
    this.pathRenderer = new PathRenderer(this, this.grid);
    this.events.once('shutdown', () => this.pathRenderer.destroy());

    this.placementHighlight = this.add
      .rectangle(0, 0, CELL_SIZE, CELL_SIZE, 0xffffff, 0.15)
      .setStrokeStyle(2, 0xffffff, 0.7)
      .setDepth(PLACEMENT_HIGHLIGHT_DEPTH)
      .setVisible(false);
    this.rangeIndicator = this.add
      .circle(0, 0, 1, 0x66ffff, 0.08)
      .setStrokeStyle(2, 0x66ffff, 0.6)
      .setDepth(RANGE_INDICATOR_DEPTH)
      .setVisible(false);

    await this.recalculatePaths();
    this.pathRenderer.render(this.cachedPaths, this.getCurrentPathTier());

    this.hud = new HUD(this);
    this.hud.setLives(this.lives);
    this.hud.setGold(this.gold);
    this.updateWaveLabel();
    this.hud.setPhase(
      this.mode === 'endless'
        ? 'Endless · Build Phase'
        : 'Build Phase · Place towers, then Start Wave',
    );

    this.bottomBar = new BottomBar(this, this, this.context);
    this.pauseOverlay = new PauseOverlay(
      this,
      () => this.resume(),
      () => this.quitRun(),
    );

    this.addBackButton();
    this.showFirstBuildHint();

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.escKey = this.input.keyboard!.addKey('ESC');
    this.escKey.on('down', () => this.onEscape());
    this.input.mouse?.disableContextMenu();

    this.renderBottomBar();
  }

  private resetState(): void {
    const save = loadSave();
    this.context = new RunContext(save.shopUpgrades);
    this.phase = 'build';
    this.gold = this.context.startingGold;
    this.lives = this.context.startingLives;
    this.waveIndex = 0;
    this.placementType = null;
    this.selectedTower = null;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.enemiesKilled = 0;
    this.paused = false;
    this.waveManager = new WaveManager();
    this.cachedPaths = new Map();
    this.firstBuildHint = null;
  }

  // ============================================================
  // Input
  // ============================================================

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.phase === 'defeated' || this.phase === 'victory') return;
    if (this.paused) return;

    // Right-click cancels placement
    if (pointer.rightButtonDown() || pointer.button === 2) {
      if (this.placementType) {
        this.cancelPlacement();
      }
      return;
    }

    // If the click lands in the bottom bar or HUD, let those UI handlers take it.
    if (pointer.y < GRID_OFFSET_Y || pointer.y >= GRID_OFFSET_Y + GRID_ROWS * CELL_SIZE) return;
    const cell = this.grid.pixelToCell(pointer.x, pointer.y);
    if (!cell) return;

    // In placement mode, try to place a tower
    if (this.placementType && this.phase === 'build') {
      this.tryPlaceTower(cell.col, cell.row, this.placementType);
      return;
    }

    // Otherwise, try to select an existing tower
    const tower = this.towers.find((t) => t.col === cell.col && t.row === cell.row);
    if (tower) {
      this.selectTower(tower);
    } else {
      this.deselectTowerInternal();
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.placementType && this.phase === 'build') {
      const cell = this.grid.pixelToCell(pointer.x, pointer.y);
      if (cell && this.grid.isBuildable(cell.col, cell.row)) {
        const pos = this.grid.cellToPixel(cell.col, cell.row);
        this.placementHighlight.setPosition(pos.x, pos.y).setVisible(true);
        const canPlace = this.grid.canPlaceTower(cell.col, cell.row);
        this.placementHighlight.setFillStyle(canPlace ? 0x66ffff : 0xff4444, 0.25);
        this.placementHighlight.setStrokeStyle(2, canPlace ? 0x66ffff : 0xff4444, 0.9);
        const previewStats = this.context.getTowerStats(this.placementType, 1);
        this.rangeIndicator.setPosition(pos.x, pos.y);
        this.rangeIndicator.setRadius(previewStats.rangeTiles * CELL_SIZE);
        this.rangeIndicator.setVisible(true);
      } else {
        this.placementHighlight.setVisible(false);
        this.rangeIndicator.setVisible(false);
      }
    } else if (this.selectedTower) {
      // Keep range indicator showing for selected tower
      const c = this.selectedTower.getCenter();
      this.rangeIndicator.setPosition(c.x, c.y);
      this.rangeIndicator.setRadius(this.selectedTower.getRangePx());
      this.rangeIndicator.setVisible(true);
    } else {
      this.placementHighlight.setVisible(false);
      this.rangeIndicator.setVisible(false);
    }
  }

  private onEscape(): void {
    if (this.placementType) {
      this.cancelPlacement();
    } else if (this.selectedTower) {
      this.deselectTowerInternal();
    } else if (this.phase === 'wave') {
      this.onPause();
    }
  }

  // ============================================================
  // Tower placement
  // ============================================================

  private async tryPlaceTower(col: number, row: number, type: TowerType): Promise<void> {
    if (!this.grid.canPlaceTower(col, row)) {
      this.flashMessage('Cannot build here');
      return;
    }
    const placeCost = this.context.getPlaceCost(type);
    if (this.gold < placeCost) {
      this.flashMessage('Not enough gold');
      return;
    }

    // Simulate occupancy and verify all portals still have a path
    const simulated = new Set(this.grid.getOccupiedCells());
    simulated.add(cellKey(col, row));
    const reachable = await this.pathfinder.allPortalsReachable(simulated);
    if (!reachable) {
      this.flashMessage('Path blocked!');
      return;
    }

    // Commit
    this.grid.setOccupied(col, row, true);
    const { x, y } = this.grid.cellToPixel(col, row);
    const tower = new Tower(this, type, col, row, x, y, this.context);
    this.towers.push(tower);
    this.gold -= placeCost;
    this.hud.setGold(this.gold);
    await this.recalculatePaths();
    this.pathRenderer.render(this.cachedPaths, this.getCurrentPathTier());
    this.hideFirstBuildHint();
    this.renderBottomBar();
  }

  private selectTower(tower: Tower): void {
    if (this.selectedTower && this.selectedTower !== tower) {
      this.selectedTower.setSelected(false);
    }
    this.cancelPlacement();
    this.selectedTower = tower;
    tower.setSelected(true);
    const c = tower.getCenter();
    this.rangeIndicator.setPosition(c.x, c.y);
    this.rangeIndicator.setRadius(tower.getRangePx());
    this.rangeIndicator.setVisible(true);
    this.renderBottomBar();
  }

  private deselectTowerInternal(): void {
    if (!this.selectedTower) return;
    this.selectedTower.setSelected(false);
    this.selectedTower = null;
    this.rangeIndicator.setVisible(false);
    this.renderBottomBar();
  }

  // ============================================================
  // BottomBarController
  // ============================================================

  onSelectTowerType(type: TowerType): void {
    if (this.phase !== 'build') return;
    this.deselectTowerInternal();
    this.placementType = type;
    this.renderBottomBar();
  }

  onCancelPlacement(): void {
    this.cancelPlacement();
  }

  private cancelPlacement(): void {
    if (!this.placementType) return;
    this.placementType = null;
    this.placementHighlight.setVisible(false);
    this.rangeIndicator.setVisible(false);
    this.renderBottomBar();
  }

  async onStartWave(): Promise<void> {
    if (this.phase !== 'build') return;
    const nextWave = this.waveIndex + 1;
    if (this.mode === 'campaign' && nextWave > TOTAL_CAMPAIGN_WAVES) return;
    this.cancelPlacement();
    this.deselectTowerInternal();
    this.waveIndex = nextWave;
    this.phase = 'wave';

    // Snapshot paths at wave start — enemies follow these for the duration of the wave
    await this.recalculatePaths();
    this.pathRenderer.render(this.cachedPaths, this.getCurrentPathTier());

    const cfg = this.buildWaveConfig(nextWave);
    if (!cfg) return;
    this.waveManager.start(cfg);

    this.updateWaveLabel();
    this.hud.setPhase(`Wave Phase — Wave ${nextWave}: ${cfg.label}`);
    this.renderBottomBar();
  }

  private buildWaveConfig(waveNumber: number): WaveConfig | null {
    if (this.mode === 'campaign') {
      return getCampaignWaveConfig(waveNumber);
    }
    // Endless mode: waves 1-10 use the campaign config as baseline, then scaling from 11+.
    if (waveNumber <= TOTAL_CAMPAIGN_WAVES) return getCampaignWaveConfig(waveNumber);
    return buildEndlessWave(waveNumber);
  }

  private updateWaveLabel(): void {
    if (this.mode === 'endless') {
      this.hud.setWaveLabel(this.waveIndex === 0 ? 'Wave: 0 (Endless)' : `Wave: ${this.waveIndex}`);
    } else {
      this.hud.setWave(this.waveIndex, TOTAL_CAMPAIGN_WAVES);
    }
  }

  onUpgradeSelected(): void {
    const t = this.selectedTower;
    if (!t || !t.canUpgrade()) return;
    const cost = t.upgradeCost();
    if (this.gold < cost) {
      this.flashMessage('Not enough gold');
      return;
    }
    this.gold -= cost;
    t.upgrade();
    this.hud.setGold(this.gold);
    const c = t.getCenter();
    this.rangeIndicator.setPosition(c.x, c.y);
    this.rangeIndicator.setRadius(t.getRangePx());
    this.renderBottomBar();
  }

  async onSellSelected(): Promise<void> {
    if (this.phase !== 'build') return;
    const t = this.selectedTower;
    if (!t) return;
    this.gold += t.sellRefund();
    this.hud.setGold(this.gold);
    this.grid.setOccupied(t.col, t.row, false);
    this.towers = this.towers.filter((x) => x !== t);
    t.destroy();
    this.selectedTower = null;
    this.rangeIndicator.setVisible(false);
    await this.recalculatePaths();
    this.pathRenderer.render(this.cachedPaths, this.getCurrentPathTier());
    this.renderBottomBar();
  }

  onDeselectTower(): void {
    this.deselectTowerInternal();
  }

  onPause(): void {
    if (this.phase !== 'wave' || this.paused) return;
    this.paused = true;
    this.pauseOverlay.show();
  }

  private resume(): void {
    this.paused = false;
    this.pauseOverlay.hide();
  }

  private quitRun(): void {
    this.paused = false;
    this.pauseOverlay.hide();
    this.endRun('defeat');
  }

  // ============================================================
  // Main update loop
  // ============================================================

  update(_time: number, deltaMs: number): void {
    if (this.phase !== 'wave') return;
    if (this.paused) return;

    const deltaSec = deltaMs / 1000;

    // Spawn enemies per wave timer
    const spawns = this.waveManager.tick(deltaMs);
    for (const spawn of spawns) {
      const path = this.cachedPaths.get(cellKey(spawn.portal.col, spawn.portal.row));
      if (!path) continue;
      const enemy = new Enemy(this, this.grid, spawn.spec, path);
      this.enemies.push(enemy);
    }

    // Move enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const result = enemy.update(deltaSec);
      if (result === 'reached-castle') {
        this.lives -= enemy.livesLostOnReach;
        this.hud.setLives(this.lives);
        enemy.alive = false;
        enemy.destroy();
        if (this.lives <= 0) {
          this.endRun('defeat');
          return;
        }
      }
    }

    // Fire towers
    this.fireTowers(_time);

    // Advance projectiles
    this.advanceProjectiles(deltaSec);

    // Clean up dead enemies
    this.reapDeadEnemies();

    // Wave end check
    if (this.waveManager.allSpawned() && this.enemies.every((e) => !e.alive)) {
      this.onWaveComplete();
    }
  }

  private fireTowers(time: number): void {
    for (const tower of this.towers) {
      const stats = tower.getStats();
      if (time - tower.lastFireAt < stats.attackIntervalMs) continue;

      const center = tower.getCenter();
      const rangePx = tower.getRangePx();
      const target = this.findClosestEnemyInRange(center.x, center.y, rangePx);
      if (!target) continue;

      tower.lastFireAt = time;
      tower.playFireTelegraph();
      const color = TOWER_CONFIGS[tower.type].projectileColor;
      if (tower.type === 'sniper') {
        const critChance = tower.getCritChance();
        const isCrit = critChance > 0 && Math.random() < critChance;
        const damage = isCrit ? stats.damage * 2 : stats.damage;
        this.projectiles.push(
          new SniperProjectile(this, center.x, center.y, damage, target, isCrit ? 0xffee00 : color),
        );
      } else {
        const splashRadius = stats.splashRadiusTiles ?? 1;
        this.projectiles.push(
          new SplashProjectile(
            this,
            center.x,
            center.y,
            stats.damage,
            target.x,
            target.y,
            splashRadius,
            color,
          ),
        );
      }
    }
  }

  private findClosestEnemyInRange(x: number, y: number, range: number): Enemy | null {
    let best: Enemy | null = null;
    let bestDistSq = range * range;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= bestDistSq) {
        best = enemy;
        bestDistSq = d2;
      }
    }
    return best;
  }

  private advanceProjectiles(deltaSec: number): void {
    for (const proj of this.projectiles) {
      if (proj.done) continue;
      const hit = proj.update(deltaSec);
      if (hit) {
        if (proj instanceof SplashProjectile) {
          proj.spawnExplosion();
          this.applySplashDamage(
            hit.position.x,
            hit.position.y,
            hit.splashRadiusPx ?? 0,
            hit.damage,
          );
        } else if (hit.primaryTarget) {
          const killed = hit.primaryTarget.takeDamage(hit.damage);
          if (killed) this.onEnemyKilled(hit.primaryTarget);
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => {
      if (p.done) {
        p.destroy();
        return false;
      }
      return true;
    });
  }

  private applySplashDamage(x: number, y: number, radius: number, damage: number): void {
    if (radius <= 0) return;
    const r2 = radius * radius;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (dx * dx + dy * dy <= r2) {
        const killed = enemy.takeDamage(damage);
        if (killed) this.onEnemyKilled(enemy);
      }
    }
  }

  private onEnemyKilled(enemy: Enemy): void {
    const bounty = this.context.getKillBounty(enemy.goldOnKill);
    this.gold += bounty;
    this.enemiesKilled += 1;
    this.hud.setGold(this.gold);
    this.spawnGoldDropText(enemy.x, enemy.y, bounty);
    enemy.destroy();
  }

  private spawnGoldDropText(x: number, y: number, amount: number): void {
    const text = this.add
      .text(x, y, `+${amount}g`, {
        fontSize: '14px',
        color: '#ffd866',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(100);
    this.tweens.add({
      targets: text,
      y: y - 28,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  private reapDeadEnemies(): void {
    this.enemies = this.enemies.filter((e) => e.alive);
  }

  private onWaveComplete(): void {
    this.waveManager.finish();
    // Campaign completes after wave 10; endless never completes.
    if (this.mode === 'campaign' && this.waveIndex >= TOTAL_CAMPAIGN_WAVES) {
      this.endRun('victory');
      return;
    }
    this.phase = 'build';
    this.hud.setPhase(
      this.mode === 'endless'
        ? 'Endless · Build Phase'
        : 'Build Phase · Place towers, then Start Wave',
    );
    this.pathRenderer.render(this.cachedPaths, this.getCurrentPathTier());
    this.renderBottomBar();
  }

  private endRun(outcome: 'defeat' | 'victory'): void {
    this.phase = outcome === 'defeat' ? 'defeated' : 'victory';
    for (const p of this.projectiles) p.destroy();
    this.projectiles = [];
    this.waveManager.finish();

    const wavesCleared =
      outcome === 'victory' ? TOTAL_CAMPAIGN_WAVES : Math.max(0, this.waveIndex - 1);
    const roarerPointsEarned = wavesCleared;

    const save = loadSave();
    const firstVictory =
      outcome === 'victory' && this.mode === 'campaign' && !save.endlessModeUnlocked;
    save.roarerPoints += roarerPointsEarned;
    save.stats.totalRuns += 1;
    save.stats.totalWavesCleared += wavesCleared;
    save.stats.totalEnemiesKilled += this.enemiesKilled;
    if (this.mode === 'campaign') {
      save.stats.bestWaveReached = Math.max(save.stats.bestWaveReached, wavesCleared);
      if (outcome === 'victory') save.endlessModeUnlocked = true;
    } else {
      save.stats.endlessBestWave = Math.max(save.stats.endlessBestWave, wavesCleared);
    }
    writeSave(save);

    const result: RunResult = {
      outcome,
      mode: this.mode,
      wavesCleared,
      enemiesKilled: this.enemiesKilled,
      towersPlaced: this.towers.length,
      roarerPointsEarned,
      endlessUnlocked: save.endlessModeUnlocked,
      firstVictory,
    };

    this.time.delayedCall(400, () => {
      if (outcome === 'victory') {
        this.scene.start(SCENE_KEYS.VICTORY, result);
      } else {
        this.scene.start(SCENE_KEYS.GAME_OVER, result);
      }
    });
  }

  // ============================================================
  // Rendering helpers
  // ============================================================

  private async recalculatePaths(): Promise<void> {
    this.cachedPaths = await this.pathfinder.recalculatePaths(this.grid.getOccupiedCells());
  }

  private renderBottomBar(): void {
    const nextWaveNum = this.waveIndex + 1;
    const nextCfg = this.buildWaveConfig(nextWaveNum);
    const currentCfg = this.waveIndex > 0 ? this.buildWaveConfig(this.waveIndex) : null;
    this.bottomBar.render({
      phase: this.phase === 'build' ? 'build' : 'wave',
      gold: this.gold,
      placementType: this.placementType,
      selectedTower: this.selectedTower,
      nextWaveLabel: nextCfg ? `Wave ${nextCfg.waveNumber}: ${nextCfg.label}` : null,
      currentWaveLabel: currentCfg ? `Wave ${currentCfg.waveNumber}: ${currentCfg.label}` : null,
    });
  }

  private getCurrentPathTier(): PathTier {
    const targetWave = this.phase === 'wave' ? this.waveIndex : this.waveIndex + 1;
    const cfg = this.buildWaveConfig(targetWave);
    return tierFromWave(cfg);
  }

  private flashMessage(msg: string): void {
    const text = this.add
      .text(CANVAS_WIDTH / 2, GRID_OFFSET_Y + 24, msg, {
        fontSize: '22px',
        color: '#ff6666',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(200);
    this.tweens.add({
      targets: text,
      alpha: 0,
      y: GRID_OFFSET_Y + 4,
      duration: 900,
      onComplete: () => text.destroy(),
    });
  }

  private showFirstBuildHint(): void {
    this.firstBuildHint = this.add
      .text(
        CANVAS_WIDTH / 2,
        GRID_OFFSET_Y + GRID_ROWS * CELL_SIZE - 40,
        'Build towers, defend the castle!',
        {
          fontSize: '20px',
          color: COLORS.textAccent,
          fontFamily: 'sans-serif',
          fontStyle: 'italic',
        },
      )
      .setOrigin(0.5)
      .setDepth(50);
    this.time.delayedCall(4000, () => this.hideFirstBuildHint());
  }

  private hideFirstBuildHint(): void {
    if (!this.firstBuildHint) return;
    const hint = this.firstBuildHint;
    this.firstBuildHint = null;
    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 400,
      onComplete: () => hint.destroy(),
    });
  }

  // ============================================================
  // Static world drawing (unchanged from slice 1)
  // ============================================================

  private drawGridCells() {
    const g = this.add.graphics();
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const type = this.grid.getCellType(col, row);
        const x = GRID_OFFSET_X + col * CELL_SIZE;
        const y = GRID_OFFSET_Y + row * CELL_SIZE;

        let fill: number = COLORS.gridCell;
        if (type === 'portal') fill = COLORS.portal;
        else if (type === 'castle') fill = COLORS.castle;

        g.fillStyle(fill, 1);
        g.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    for (let row = 2; row <= 4; row++) {
      const portalCenter = this.grid.cellToPixel(0, row);
      this.add
        .text(portalCenter.x, portalCenter.y, 'WWW', {
          fontSize: '14px',
          color: COLORS.textPrimary,
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const castleCenter = this.grid.cellToPixel(GRID_COLS - 1, row);
      this.add
        .text(castleCenter.x, castleCenter.y, 'SRV', {
          fontSize: '14px',
          color: COLORS.textPrimary,
          fontFamily: 'sans-serif',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }
  }

  private drawGridLines() {
    const g = this.add.graphics();
    g.lineStyle(1, COLORS.gridBorder, 1);

    const left = GRID_OFFSET_X;
    const top = GRID_OFFSET_Y;
    const right = GRID_OFFSET_X + GRID_COLS * CELL_SIZE;
    const bottom = GRID_OFFSET_Y + GRID_ROWS * CELL_SIZE;

    for (let col = 0; col <= GRID_COLS; col++) {
      const x = GRID_OFFSET_X + col * CELL_SIZE;
      g.lineBetween(x, top, x, bottom);
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      const y = GRID_OFFSET_Y + row * CELL_SIZE;
      g.lineBetween(left, y, right, y);
    }
  }

  private drawPortalArt() {
    const pad = 20;
    const width = GRID_OFFSET_X - pad * 2;
    const topLeft = this.grid.cellToTopLeft(0, 2);
    const height = 3 * CELL_SIZE;

    const g = this.add.graphics();
    g.fillStyle(COLORS.portal, 1);
    g.fillRect(pad, topLeft.y, width, height);
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeRect(pad, topLeft.y, width, height);

    this.add
      .text(pad + width / 2, topLeft.y + height / 2, 'WWW\nPORTAL', {
        fontSize: '28px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
  }

  private drawCastleArt() {
    const pad = 20;
    const width = GRID_OFFSET_X - pad * 2;
    const gridRight = GRID_OFFSET_X + GRID_COLS * CELL_SIZE;
    const x = gridRight + pad;
    const topLeft = this.grid.cellToTopLeft(GRID_COLS - 1, 2);
    const height = 3 * CELL_SIZE;

    const g = this.add.graphics();
    g.fillStyle(COLORS.castle, 1);
    g.fillRect(x, topLeft.y, width, height);
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeRect(x, topLeft.y, width, height);

    this.add
      .text(x + width / 2, topLeft.y + height / 2, 'SERVER\n(castle)', {
        fontSize: '24px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
  }

  private addBackButton() {
    const btn = this.add
      .text(20, 28, '< Back to Menu', {
        fontSize: '16px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor(COLORS.textAccent));
    btn.on('pointerout', () => btn.setColor(COLORS.textPrimary));
    btn.on('pointerdown', () => this.scene.start(SCENE_KEYS.MAIN_MENU));
  }
}
