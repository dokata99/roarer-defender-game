import EasyStar from 'easystarjs';
import type { CellCoord } from './GridManager';
import { GridManager } from './GridManager';

const WALKABLE = 0;
const BLOCKED = 1;

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

type EasyStarInstance = InstanceType<typeof EasyStar.js>;

export class PathfindingManager {
  private readonly easystar: EasyStarInstance;

  constructor(
    private readonly grid: GridManager,
    private readonly portals: readonly CellCoord[],
    private readonly castles: readonly CellCoord[],
  ) {
    this.easystar = new EasyStar.js();
    this.easystar.setAcceptableTiles([WALKABLE]);
    this.easystar.enableDiagonals();
    this.easystar.disableCornerCutting();
  }

  async recalculatePaths(
    blockedCells: ReadonlySet<string>,
  ): Promise<Map<string, CellCoord[]>> {
    this.easystar.setGrid(this.buildGrid(blockedCells));

    const results = new Map<string, CellCoord[]>();

    for (const portal of this.portals) {
      const path = await this.findShortestPathToAnyCastle(portal);
      if (path) {
        results.set(cellKey(portal.col, portal.row), path);
      }
    }

    return results;
  }

  private buildGrid(blockedCells: ReadonlySet<string>): number[][] {
    const matrix: number[][] = [];
    for (let row = 0; row < this.grid.rows; row++) {
      const r: number[] = [];
      for (let col = 0; col < this.grid.cols; col++) {
        r.push(blockedCells.has(cellKey(col, row)) ? BLOCKED : WALKABLE);
      }
      matrix.push(r);
    }
    return matrix;
  }

  private async findShortestPathToAnyCastle(
    portal: CellCoord,
  ): Promise<CellCoord[] | null> {
    let best: CellCoord[] | null = null;
    for (const castle of this.castles) {
      const path = await this.findPathOnce(portal, castle);
      if (path && (best === null || path.length < best.length)) {
        best = path;
      }
    }
    return best;
  }

  private findPathOnce(from: CellCoord, to: CellCoord): Promise<CellCoord[] | null> {
    return new Promise((resolve) => {
      this.easystar.findPath(from.col, from.row, to.col, to.row, (result) => {
        if (!result) {
          resolve(null);
          return;
        }
        resolve(result.map((p) => ({ col: p.x, row: p.y })));
      });
      this.easystar.calculate();
    });
  }
}
