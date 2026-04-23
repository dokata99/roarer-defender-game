import Phaser from 'phaser';
import type { CellCoord, GridManager, PixelCoord } from './GridManager';

export interface SmoothedPath {
  /** Dense polyline approximating a Catmull-Rom spline through cell centers. */
  points: PixelCoord[];
  /** Total arc length of the polyline in pixels. */
  totalLength: number;
}

/** Samples per cell-segment used when approximating the spline. Higher = smoother curve. */
const SAMPLES_PER_SEGMENT = 10;

/**
 * Build a smooth polyline that passes through every cell center on the path.
 * Uses Phaser's Catmull-Rom spline so 90° corners turn into rounded arcs.
 */
export function smoothCellPath(cells: CellCoord[], grid: GridManager): SmoothedPath {
  if (cells.length === 0) return { points: [], totalLength: 0 };
  if (cells.length === 1) {
    const p = grid.cellToPixel(cells[0].col, cells[0].row);
    return { points: [p], totalLength: 0 };
  }

  const vectors = cells.map((c) => {
    const p = grid.cellToPixel(c.col, c.row);
    return new Phaser.Math.Vector2(p.x, p.y);
  });

  const spline = new Phaser.Curves.Spline(vectors);
  const totalSamples = SAMPLES_PER_SEGMENT * (cells.length - 1);
  // getSpacedPoints returns N+1 points evenly distributed along arc length.
  const raw = spline.getSpacedPoints(totalSamples);
  const points: PixelCoord[] = raw.map((v) => ({ x: v.x, y: v.y }));

  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLength += Math.hypot(dx, dy);
  }

  return { points, totalLength };
}
