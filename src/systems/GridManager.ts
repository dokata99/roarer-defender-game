import { GRID_COLS, GRID_ROWS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../config/constants';

export type CellType = 'portal' | 'castle' | 'buildable' | 'out-of-bounds';

export interface CellCoord {
  col: number;
  row: number;
}

export interface PixelCoord {
  x: number;
  y: number;
}

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export class GridManager {
  readonly cols = GRID_COLS;
  readonly rows = GRID_ROWS;
  readonly cellSize = CELL_SIZE;

  private occupied: Set<string> = new Set();

  cellToPixel(col: number, row: number): PixelCoord {
    return {
      x: GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2,
      y: GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  cellToTopLeft(col: number, row: number): PixelCoord {
    return {
      x: GRID_OFFSET_X + col * CELL_SIZE,
      y: GRID_OFFSET_Y + row * CELL_SIZE,
    };
  }

  pixelToCell(x: number, y: number): CellCoord | null {
    const col = Math.floor((x - GRID_OFFSET_X) / CELL_SIZE);
    const row = Math.floor((y - GRID_OFFSET_Y) / CELL_SIZE);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return { col, row };
  }

  getCellType(col: number, row: number): CellType {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
      return 'out-of-bounds';
    }
    if (col === 0 && row >= 2 && row <= 4) return 'portal';
    if (col === GRID_COLS - 1 && row >= 2 && row <= 4) return 'castle';
    return 'buildable';
  }

  isPortalCell(col: number, row: number): boolean {
    return this.getCellType(col, row) === 'portal';
  }

  isCastleCell(col: number, row: number): boolean {
    return this.getCellType(col, row) === 'castle';
  }

  isBuildable(col: number, row: number): boolean {
    return this.getCellType(col, row) === 'buildable';
  }

  isOccupied(col: number, row: number): boolean {
    return this.occupied.has(cellKey(col, row));
  }

  canPlaceTower(col: number, row: number): boolean {
    return this.isBuildable(col, row) && !this.isOccupied(col, row);
  }

  setOccupied(col: number, row: number, occupied: boolean): void {
    const key = cellKey(col, row);
    if (occupied) this.occupied.add(key);
    else this.occupied.delete(key);
  }

  getOccupiedCells(): ReadonlySet<string> {
    return this.occupied;
  }
}
