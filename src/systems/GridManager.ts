import {
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
} from '../config/constants';

export type CellType = 'portal' | 'castle' | 'buildable' | 'out-of-bounds';

export interface CellCoord {
  col: number;
  row: number;
}

export interface PixelCoord {
  x: number;
  y: number;
}

export class GridManager {
  readonly cols = GRID_COLS;
  readonly rows = GRID_ROWS;
  readonly cellSize = CELL_SIZE;

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
}
