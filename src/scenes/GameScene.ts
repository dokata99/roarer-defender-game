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
import { ParticleManager } from '../ui/ParticleManager';
import { registerParticleTextures } from '../ui/ParticleTextures';
import { PLACEMENT_HIGHLIGHT_DEPTH, RANGE_INDICATOR_DEPTH } from '../config/gameplay';
import { TOWER_CONFIGS, TOWER_ART_KEYS, type TowerType } from '../config/towers';
import { ENEMY_ART_KEYS } from '../config/enemies';
import {
  getCampaignWaveConfig,
  TOTAL_CAMPAIGN_WAVES,
  ENDLESS_WARMUP_WAVES,
  type WaveConfig,
} from '../config/waves';
import { buildEndlessWave } from '../config/endless';
import {
  getCampaignFlavor,
  getEndlessFlavor,
  getMilestoneForWave,
  pickWaveCompleteMessage,
  resetEndlessFlavorCache,
  type WaveFlavor,
} from '../config/waveFlavor';
import { GridManager, cellKey, type CellCoord, type PixelCoord } from '../systems/GridManager';
import { PathfindingManager } from '../systems/PathfindingManager';
import { smoothCellPath } from '../systems/pathSmoothing';
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
  private particles!: ParticleManager;
  /** Persistent postFX vignette that fades in when security drops below 30%. */
  private dangerVignette: Phaser.FX.Vignette | null = null;
  private placementHighlight!: Phaser.GameObjects.Rectangle;
  private rangeIndicator!: Phaser.GameObjects.Arc;

  private cachedPaths = new Map<string, CellCoord[]>();
  private cachedPixelPaths = new Map<string, PixelCoord[]>();
  private context!: RunContext;

  private phase: Phase = 'build';
  private gold = 0;
  private security = 0;
  private leakedThisWave = false;
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

  preload() {
    // Path-tile image assets. If a file is missing, Phaser logs a 404 and
    // registerPathTextures() draws a procedural fallback — safe either way.
    this.load.image('path-tile-grass', 'assets/path-tiles/grass.png');
    this.load.image('path-tile-cobble', 'assets/path-tiles/cobble.png');
    this.load.image('path-tile-brick', 'assets/path-tiles/brick.png');
    this.load.image(TOWER_ART_KEYS.splashBody, 'assets/towers/Splash_Bear_Nemetschek.png');
    this.load.image(TOWER_ART_KEYS.splashProjectile, 'assets/projectiles/Splash_Bear_Projectile.png');
    this.load.image(TOWER_ART_KEYS.sniperBody, 'assets/towers/Lazer_Bear_BB.png');
    this.load.image(TOWER_ART_KEYS.sniperProjectile, 'assets/projectiles/Lazer_Bear_Projectile.png');
    this.load.image(ENEMY_ART_KEYS.fast, 'assets/enemies/Bug.png');
    this.load.image(ENEMY_ART_KEYS.elite, 'assets/enemies/Ogre.png');
    this.load.image(ENEMY_ART_KEYS.flying, 'assets/enemies/Dragon.png');
    this.load.image(ENEMY_ART_KEYS.boss, 'assets/enemies/Scope_Creep_Boss.png');
    this.load.image('env-portal', 'assets/environment/Portal.png');
    this.load.image('env-base', 'assets/environment/server-healthy.png');
  }

  async create() {
    this.resetState();
    this.cameras.main.setBackgroundColor(COLORS.background);

    // Prescale tower art so heavy downscales (512 → 67 px) render crisp.
    // WebGL mipmapping only kicks in for power-of-two sources; the Lazer Bear PNG
    // isn't PoT, so we let the browser's canvas resampler do the downsample once.
    this.prescaleArtTexture(TOWER_ART_KEYS.splashBody, 128);
    this.prescaleArtTexture(TOWER_ART_KEYS.sniperBody, 128);

    this.grid = new GridManager();
    this.pathfinder = new PathfindingManager(this.grid, PORTAL_CELLS, CASTLE_CELLS);

    this.drawGridCells();
    this.drawGridLines();
    this.drawPortalArt();
    this.drawCastleArt();

    registerPathTextures(this);
    this.pathRenderer = new PathRenderer(this);
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
    this.pathRenderer.render(this.cachedPixelPaths, this.getCurrentPathTier());

    this.hud = new HUD(this);
    this.hud.setSecurity(this.security);
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

    this.applyCameraFX();

    registerParticleTextures(this);
    this.particles = new ParticleManager(this);
  }

  /** Range-indicator takes on the tower's accent color per 02-03 §2.6. */
  private tintRangeIndicator(type: TowerType): void {
    const color = TOWER_CONFIGS[type].color;
    this.rangeIndicator.setFillStyle(color, 0.08);
    this.rangeIndicator.setStrokeStyle(1.5, color, 0.75);
  }

  /**
   * Downsample a loaded image texture to a bounding box of `maxDim` via an offscreen
   * canvas using the browser's high-quality resampler, then replace the texture in-place.
   * Fixes blur on non-power-of-two art that can't benefit from WebGL mipmaps.
   */
  private prescaleArtTexture(key: string, maxDim: number): void {
    if (!this.textures.exists(key)) return;
    const source = this.textures.get(key).source[0];
    const w0 = source.width;
    const h0 = source.height;
    if (Math.max(w0, h0) <= maxDim) return;
    const scale = maxDim / Math.max(w0, h0);
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source.image as CanvasImageSource, 0, 0, w, h);
    this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
  }

  /** Scene-wide postFX: low-HP vignette only. WebGL-only. */
  private applyCameraFX(): void {
    const cam = this.cameras.main;
    if (this.game.renderer.type !== Phaser.WEBGL) return;
    // Low-security danger vignette only. Parked at strength 0; tweens in when security < 30%.
    // No baseline vignette — the one in earlier builds crushed the corners too hard.
    this.dangerVignette = cam.postFX.addVignette(0.5, 0.5, 0.85, 0);
  }

  /** Toggle the danger vignette when security crosses the 30% threshold. */
  private updateDangerVignette(): void {
    if (!this.dangerVignette) return;
    const ratio = this.security / this.context.startingSecurity;
    // Gentler peak strength — 0.55 looked like black corners, 0.35 reads as "uh oh".
    const target = ratio < 0.3 ? 0.35 : 0;
    if (Math.abs(this.dangerVignette.strength - target) < 0.01) return;
    this.tweens.add({
      targets: this.dangerVignette,
      strength: target,
      duration: 400,
      ease: 'Sine.InOut',
    });
  }

  private resetState(): void {
    const save = loadSave();
    this.context = new RunContext(save.shopUpgrades);
    this.phase = 'build';
    this.gold = this.context.startingGold;
    this.security = this.context.startingSecurity;
    this.leakedThisWave = false;
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
    this.cachedPixelPaths = new Map();
    this.firstBuildHint = null;
    resetEndlessFlavorCache();
  }

  private getWaveFlavor(waveNumber: number): WaveFlavor | null {
    if (waveNumber <= 0) return null;
    if (this.mode === 'campaign') return getCampaignFlavor(waveNumber);
    if (waveNumber <= ENDLESS_WARMUP_WAVES) return getCampaignFlavor(waveNumber);
    return getEndlessFlavor(waveNumber);
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
        this.tintRangeIndicator(this.placementType);
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
      this.tintRangeIndicator(this.selectedTower.type);
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
    this.pathRenderer.render(this.cachedPixelPaths, this.getCurrentPathTier());
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
    this.leakedThisWave = false;

    // Snapshot paths at wave start — enemies follow these for the duration of the wave
    await this.recalculatePaths();
    this.pathRenderer.render(this.cachedPixelPaths, this.getCurrentPathTier());

    const cfg = this.buildWaveConfig(nextWave);
    if (!cfg) return;
    this.waveManager.start(cfg);

    this.updateWaveLabel();
    const flavor = this.getWaveFlavor(nextWave);
    const flavorTag = flavor ? flavor.name : cfg.label;
    this.hud.setPhase(`Wave Phase — Wave ${nextWave}: ${flavorTag}`);
    this.renderBottomBar();
  }

  private buildWaveConfig(waveNumber: number): WaveConfig | null {
    if (this.mode === 'campaign') {
      return getCampaignWaveConfig(waveNumber);
    }
    // Endless mode: first ENDLESS_WARMUP_WAVES reuse the campaign arc-1/arc-2 pacing as
    // a warmup, then the endless scaling formulas take over. Campaign can grow past this
    // without changing the endless difficulty curve.
    if (waveNumber <= ENDLESS_WARMUP_WAVES) return getCampaignWaveConfig(waveNumber);
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
    this.pathRenderer.render(this.cachedPixelPaths, this.getCurrentPathTier());
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
      const path =
        spawn.spec.type === 'flying'
          ? this.buildFlyingPath(spawn.portal)
          : this.cachedPixelPaths.get(cellKey(spawn.portal.col, spawn.portal.row));
      if (!path) continue;
      const enemy = new Enemy(this, spawn.spec, path);
      this.enemies.push(enemy);
      // Boss spawn: brief camera shake per 02-01 §6.
      if (spawn.spec.type === 'boss') {
        this.cameras.main.shake(300, 0.003);
      }
    }

    // Move enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const result = enemy.update(deltaSec);
      if (result === 'reached-castle') {
        this.security -= enemy.securityLostOnReach;
        this.leakedThisWave = true;
        this.hud.setSecurity(this.security);
        this.updateDangerVignette();
        enemy.alive = false;
        enemy.destroy();
        if (this.security <= 0) {
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
      const target = this.findClosestEnemyInRange(center.x, center.y, rangePx, tower.type);
      if (!target) continue;

      tower.lastFireAt = time;
      tower.playFireTelegraph();
      const color = TOWER_CONFIGS[tower.type].projectileColor;
      if (tower.type === 'sniper') {
        const critChance = tower.getCritChance();
        const isCrit = critChance > 0 && Math.random() < critChance;
        const damage = isCrit ? stats.damage * 2 : stats.damage;
        this.projectiles.push(
          new SniperProjectile(this, center.x, center.y, damage, target, isCrit ? 0xffee00 : color, {
            textureKey: TOWER_CONFIGS[tower.type].art?.projectileKey,
          }),
        );
      } else {
        const splashRadius = stats.splashRadiusTiles ?? 1;
        const slow =
          tower.type === 'frost' && stats.slowMultiplier !== undefined && stats.slowDurationMs !== undefined
            ? { multiplier: stats.slowMultiplier, durationMs: stats.slowDurationMs }
            : undefined;
        const textureKey = TOWER_CONFIGS[tower.type].art?.projectileKey;
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
            { slow, canHitFlying: tower.type === 'frost', textureKey },
          ),
        );
      }
    }
  }

  private findClosestEnemyInRange(
    x: number,
    y: number,
    range: number,
    towerType: TowerType,
  ): Enemy | null {
    let best: Enemy | null = null;
    let bestDistSq = range * range;
    // Firewall (splash) cannot target flying; Killswitch (sniper) and Cryolock (frost) can.
    const skipsFlying = towerType === 'splash';
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (skipsFlying && enemy.isFlying) continue;
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
          // Splash debris — ice shards for frost, cyan chips for firewall.
          this.particles.emitSplashFragments(
            hit.position.x,
            hit.position.y,
            hit.slow !== undefined,
          );
          this.applySplashDamage(
            hit.position.x,
            hit.position.y,
            hit.splashRadiusPx ?? 0,
            hit.damage,
            hit.slow,
            hit.canHitFlying ?? false,
          );
        } else if (hit.primaryTarget) {
          this.particles.emitHitSpark(hit.position.x, hit.position.y);
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

  private applySplashDamage(
    x: number,
    y: number,
    radius: number,
    damage: number,
    slow: { multiplier: number; durationMs: number } | undefined,
    canHitFlying: boolean,
  ): void {
    if (radius <= 0) return;
    const r2 = radius * radius;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.isFlying && !canHitFlying) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (dx * dx + dy * dy <= r2) {
        if (slow) enemy.applySlow(slow.multiplier, slow.durationMs);
        this.particles.emitHitSpark(enemy.x, enemy.y);
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
    // Death burst — per 02-03 §6, each enemy type has its own palette.
    this.particles.emitEnemyDeath(enemy.type, enemy.x, enemy.y);
    this.particles.emitGoldSparkle(enemy.x, enemy.y);
    // Boss death: camera shake + chromatic flash per 02-01 §6.
    if (enemy.type === 'boss') {
      this.cameras.main.shake(400, 0.008);
      this.cameras.main.flash(80, 255, 60, 160);
    }
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
    // Campaign completes after the final wave; endless never completes.
    if (this.mode === 'campaign' && this.waveIndex >= TOTAL_CAMPAIGN_WAVES) {
      this.endRun('victory');
      return;
    }
    // Perfect wave regen: +5% security if no enemies leaked this wave
    if (!this.leakedThisWave && this.security < 100) {
      this.security = Math.min(100, this.security + 5);
      this.hud.setSecurity(this.security);
      this.updateDangerVignette();
      this.flashMessage('PERFECT WAVE — +5% Security');
    }
    this.showWaveCompleteMessage();
    if (this.mode === 'campaign') {
      const milestone = getMilestoneForWave(this.waveIndex);
      if (milestone) {
        this.showMilestoneCallout(milestone.headline, milestone.subtitle);
      }
    }
    this.phase = 'build';
    this.hud.setPhase(
      this.mode === 'endless'
        ? 'Endless · Build Phase'
        : 'Build Phase · Place towers, then Start Wave',
    );
    this.pathRenderer.render(this.cachedPixelPaths, this.getCurrentPathTier());
    this.renderBottomBar();
  }

  private showWaveCompleteMessage(): void {
    const msg = pickWaveCompleteMessage();
    const text = this.add
      .text(CANVAS_WIDTH / 2, GRID_OFFSET_Y + 40, msg, {
        fontSize: '26px',
        color: '#66ffcc',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setAlpha(0);
    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 180,
      yoyo: true,
      hold: 900,
      onComplete: () => text.destroy(),
    });
  }

  private showMilestoneCallout(headline: string, subtitle: string): void {
    const centerY = GRID_OFFSET_Y + (GRID_ROWS * CELL_SIZE) / 2;

    const shade = this.add
      .rectangle(CANVAS_WIDTH / 2, centerY, CANVAS_WIDTH, 180, 0x000000, 0.55)
      .setDepth(999)
      .setAlpha(0);

    const head = this.add
      .text(CANVAS_WIDTH / 2, centerY - 22, headline, {
        fontSize: '44px',
        color: '#66ffff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setAlpha(0);

    const sub = this.add
      .text(CANVAS_WIDTH / 2, centerY + 28, subtitle, {
        fontSize: '20px',
        color: COLORS.textPrimary,
        fontFamily: 'sans-serif',
        fontStyle: 'italic',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setAlpha(0);

    this.tweens.add({
      targets: [shade, head, sub],
      alpha: { from: 0, to: 1 },
      duration: 250,
      yoyo: true,
      hold: 1500,
      onComplete: () => {
        shade.destroy();
        head.destroy();
        sub.destroy();
      },
    });
  }

  private endRun(outcome: 'defeat' | 'victory'): void {
    this.phase = outcome === 'defeat' ? 'defeated' : 'victory';
    for (const p of this.projectiles) p.destroy();
    this.projectiles = [];
    this.waveManager.finish();

    const wavesCleared =
      outcome === 'victory' && this.mode === 'campaign'
        ? TOTAL_CAMPAIGN_WAVES
        : Math.max(0, this.waveIndex - 1);
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
    this.cachedPixelPaths = new Map();
    for (const [key, cells] of this.cachedPaths) {
      const smooth = smoothCellPath(cells, this.grid);
      this.cachedPixelPaths.set(key, smooth.points);
    }
  }

  /** Straight-line path for flying enemies: [portal pixel, nearest castle pixel]. Bypasses A*. */
  private buildFlyingPath(portal: CellCoord): PixelCoord[] {
    let nearest = CASTLE_CELLS[0];
    let bestDistSq = Infinity;
    for (const castle of CASTLE_CELLS) {
      const dx = castle.col - portal.col;
      const dy = castle.row - portal.row;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        nearest = castle;
      }
    }
    const start = this.grid.cellToPixel(portal.col, portal.row);
    const end = this.grid.cellToPixel(nearest.col, nearest.row);
    return [start, end];
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
      nextWaveNumber: nextCfg ? nextCfg.waveNumber : null,
      nextWaveFlavor: nextCfg ? this.getWaveFlavor(nextCfg.waveNumber) : null,
      currentWaveNumber: currentCfg ? currentCfg.waveNumber : null,
      currentWaveFlavor: currentCfg ? this.getWaveFlavor(currentCfg.waveNumber) : null,
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

        g.fillStyle(fill, type === 'portal' || type === 'castle' ? 0.18 : 1);
        g.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
    // Circuit-trace overlay per 02-01 §4 — deterministic pseudo-random from grid pos.
    this.drawCircuitOverlay(g);
  }

  /** Thin circuit traces and node dots between grid intersections, per 02-01 §4. */
  private drawCircuitOverlay(g: Phaser.GameObjects.Graphics) {
    const nodeColor = COLORS.gridBorder;
    for (let row = 0; row <= GRID_ROWS; row++) {
      for (let col = 0; col <= GRID_COLS; col++) {
        const seed = row * 17 + col * 31;
        const ix = GRID_OFFSET_X + col * CELL_SIZE;
        const iy = GRID_OFFSET_Y + row * CELL_SIZE;

        if (seed % 3 === 0) {
          g.fillStyle(nodeColor, 0.5);
          g.fillCircle(ix, iy, 1.5);
        }
        if (seed % 5 === 0 && col < GRID_COLS) {
          g.lineStyle(0.5, nodeColor, 0.3);
          g.lineBetween(ix, iy, ix + CELL_SIZE, iy);
        }
        if (seed % 7 === 0 && row < GRID_ROWS) {
          g.lineStyle(0.5, nodeColor, 0.3);
          g.lineBetween(ix, iy, ix, iy + CELL_SIZE);
        }
      }
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

  /** Portal slot on the left edge — Portal.png scaled to fit, preserving aspect ratio. */
  private drawPortalArt() {
    const pad = 20;
    const width = GRID_OFFSET_X - pad * 2;
    const topLeft = this.grid.cellToTopLeft(0, 3);
    const height = CELL_SIZE;
    const cx = pad + width / 2;
    const cy = topLeft.y + height / 2;

    const img = this.add.image(cx, cy, 'env-portal');
    const scale = Math.min(width / img.width, height / img.height) * 2;
    img.setScale(scale);
  }

  /** Server rack on the right — server-healthy.png scaled to fit, preserving aspect ratio. */
  private drawCastleArt() {
    const pad = 20;
    const width = GRID_OFFSET_X - pad * 2;
    const gridRight = GRID_OFFSET_X + GRID_COLS * CELL_SIZE;
    const topLeft = this.grid.cellToTopLeft(GRID_COLS - 1, 3);
    const height = CELL_SIZE;
    const cx = gridRight + pad + width / 2;
    const cy = topLeft.y + height / 2;

    const img = this.add.image(cx, cy, 'env-base');
    const scale = Math.min(width / img.width, height / img.height) * 2;
    img.setScale(scale);
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
