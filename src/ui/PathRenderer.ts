import Phaser from 'phaser';
import { CELL_SIZE } from '../config/constants';
import { PATH_TILE_DEPTH, type PathTier } from '../config/pathStyle';
import type { PixelCoord } from '../systems/GridManager';

/** Tier-specific ribbon colors — mirrors the old per-tile textures. */
const TIER_COLORS: Record<PathTier, { base: number; top: number; edge: number }> = {
  normal: { base: 0x2d4a2b, top: 0x4a7841, edge: 0x1c2f1a },
  elite: { base: 0x2a2d31, top: 0x5d6066, edge: 0x17191c },
  boss: { base: 0x3a1212, top: 0x7a2424, edge: 0x1a0808 },
};

/** Ribbon widths — base stroke slightly narrower than a cell, inner highlight narrower still. */
const BASE_WIDTH = CELL_SIZE - 6;
const TOP_WIDTH = CELL_SIZE - 22;

export class PathRenderer {
  private graphics: Phaser.GameObjects.Graphics | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  render(pixelPaths: ReadonlyMap<string, PixelCoord[]>, tier: PathTier): void {
    this.graphics?.destroy();
    const g = this.scene.add.graphics().setDepth(PATH_TILE_DEPTH);
    const colors = TIER_COLORS[tier];

    for (const points of pixelPaths.values()) {
      if (points.length < 2) continue;
      this.strokeRibbon(g, points, BASE_WIDTH, colors.edge, 1);
      this.strokeRibbon(g, points, BASE_WIDTH - 4, colors.base, 1);
      this.strokeRibbon(g, points, TOP_WIDTH, colors.top, 1);
    }

    this.graphics = g;
  }

  destroy(): void {
    this.graphics?.destroy();
    this.graphics = null;
  }

  private strokeRibbon(
    g: Phaser.GameObjects.Graphics,
    points: PixelCoord[],
    thickness: number,
    color: number,
    alpha: number,
  ): void {
    g.lineStyle(thickness, color, alpha);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y);
    }
    g.strokePath();
  }
}
