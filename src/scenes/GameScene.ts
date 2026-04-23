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
  PATH_LINE_COLOR,
  PATH_LINE_ALPHA,
  PATH_LINE_WIDTH,
  PATH_LINE_DEPTH,
} from '../config/constants';
import { GridManager, type CellCoord } from '../systems/GridManager';
import { PathfindingManager } from '../systems/PathfindingManager';
import { HUD } from '../ui/HUD';
import { BottomBar } from '../ui/BottomBar';

export class GameScene extends Phaser.Scene {
  private grid!: GridManager;
  private pathfinder!: PathfindingManager;
  private pathLineGraphics!: Phaser.GameObjects.Graphics;
  private cachedPaths: Map<string, CellCoord[]> = new Map();

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  async create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.grid = new GridManager();
    this.pathfinder = new PathfindingManager(this.grid, PORTAL_CELLS, CASTLE_CELLS);

    this.drawGridCells();
    this.drawGridLines();
    this.drawPortalArt();
    this.drawCastleArt();

    this.pathLineGraphics = this.add.graphics();
    this.pathLineGraphics.setDepth(PATH_LINE_DEPTH);

    this.cachedPaths = await this.pathfinder.recalculatePaths(new Set());
    this.drawPathLines();

    new HUD(this);
    new BottomBar(this);

    this.addBackButton();
    this.addDevDefeatButton();
  }

  private drawPathLines() {
    this.pathLineGraphics.clear();
    this.pathLineGraphics.lineStyle(PATH_LINE_WIDTH, PATH_LINE_COLOR, PATH_LINE_ALPHA);

    for (const path of this.cachedPaths.values()) {
      if (path.length < 2) continue;
      const start = this.grid.cellToPixel(path[0].col, path[0].row);
      this.pathLineGraphics.beginPath();
      this.pathLineGraphics.moveTo(start.x, start.y);
      for (let i = 1; i < path.length; i++) {
        const p = this.grid.cellToPixel(path[i].col, path[i].row);
        this.pathLineGraphics.lineTo(p.x, p.y);
      }
      this.pathLineGraphics.strokePath();
    }
  }

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

  private addDevDefeatButton() {
    const btn = this.add
      .text(CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20, '[DEV] Trigger Defeat', {
        fontSize: '14px',
        color: COLORS.textDanger,
        fontFamily: 'sans-serif',
      })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#ffaaaa'));
    btn.on('pointerout', () => btn.setColor(COLORS.textDanger));
    btn.on('pointerdown', () => this.scene.start(SCENE_KEYS.GAME_OVER));
  }
}
