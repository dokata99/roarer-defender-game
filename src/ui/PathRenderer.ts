import Phaser from 'phaser';
import {
  PATH_LINE_STYLES,
  PATH_TEXTURE_KEYS,
  PATH_TILE_DEPTH,
  PATH_LINE_DEPTH,
  type PathTier,
} from '../config/pathStyle';
import { GridManager, cellKey, type CellCoord } from '../systems/GridManager';

export class PathRenderer {
  private tiles: Phaser.GameObjects.Image[] = [];
  private line: Phaser.GameObjects.Graphics;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private currentTier: PathTier | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly grid: GridManager,
  ) {
    this.line = scene.add.graphics().setDepth(PATH_LINE_DEPTH);
  }

  render(paths: ReadonlyMap<string, CellCoord[]>, tier: PathTier): void {
    this.clearTiles();
    this.paintTiles(paths, tier);
    this.drawLine(paths, tier);
    this.applyTierFx(tier);
    this.currentTier = tier;
  }

  destroy(): void {
    this.clearTiles();
    this.line.destroy();
    this.killPulse();
  }

  private clearTiles(): void {
    for (const t of this.tiles) t.destroy();
    this.tiles = [];
  }

  private paintTiles(paths: ReadonlyMap<string, CellCoord[]>, tier: PathTier): void {
    const textureKey = PATH_TEXTURE_KEYS[tier];
    const painted = new Set<string>();

    for (const path of paths.values()) {
      for (const cell of path) {
        if (this.grid.isPortalCell(cell.col, cell.row)) continue;
        if (this.grid.isCastleCell(cell.col, cell.row)) continue;
        const key = cellKey(cell.col, cell.row);
        if (painted.has(key)) continue;
        painted.add(key);

        const topLeft = this.grid.cellToTopLeft(cell.col, cell.row);
        const img = this.scene.add
          .image(topLeft.x, topLeft.y, textureKey)
          .setOrigin(0, 0)
          .setDepth(PATH_TILE_DEPTH);
        this.tiles.push(img);
      }
    }
  }

  private drawLine(paths: ReadonlyMap<string, CellCoord[]>, tier: PathTier): void {
    const style = PATH_LINE_STYLES[tier];
    this.line.clear();
    this.line.lineStyle(style.width, style.color, 1);
    this.line.setAlpha(style.pulse ? style.pulse.from : style.alpha);

    for (const path of paths.values()) {
      if (path.length < 2) continue;
      if (style.dash) {
        this.strokeDashed(path, style.dash[0], style.dash[1]);
      } else {
        this.strokeSolid(path);
      }
    }
  }

  private strokeSolid(path: CellCoord[]): void {
    const start = this.grid.cellToPixel(path[0].col, path[0].row);
    this.line.beginPath();
    this.line.moveTo(start.x, start.y);
    for (let i = 1; i < path.length; i++) {
      const p = this.grid.cellToPixel(path[i].col, path[i].row);
      this.line.lineTo(p.x, p.y);
    }
    this.line.strokePath();
  }

  private strokeDashed(path: CellCoord[], on: number, off: number): void {
    let carry = 0;
    let inOn = true;

    for (let i = 0; i < path.length - 1; i++) {
      const a = this.grid.cellToPixel(path[i].col, path[i].row);
      const b = this.grid.cellToPixel(path[i + 1].col, path[i + 1].row);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      const ux = dx / len;
      const uy = dy / len;

      let travelled = 0;
      while (travelled < len) {
        const remaining = (inOn ? on : off) - carry;
        const step = Math.min(remaining, len - travelled);
        if (inOn) {
          const sx = a.x + ux * travelled;
          const sy = a.y + uy * travelled;
          const ex = a.x + ux * (travelled + step);
          const ey = a.y + uy * (travelled + step);
          this.line.lineBetween(sx, sy, ex, ey);
        }
        travelled += step;
        carry += step;
        if (carry >= (inOn ? on : off) - 1e-6) {
          carry = 0;
          inOn = !inOn;
        }
      }
    }
  }

  private applyTierFx(tier: PathTier): void {
    if (tier === this.currentTier) return;
    this.killPulse();
    const style = PATH_LINE_STYLES[tier];
    if (!style.pulse) return;
    const { from, to, hz } = style.pulse;
    this.pulseTween = this.scene.tweens.add({
      targets: this.line,
      alpha: { from, to },
      duration: Math.round(1000 / hz / 2),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private killPulse(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween.remove();
      this.pulseTween = null;
    }
  }
}
