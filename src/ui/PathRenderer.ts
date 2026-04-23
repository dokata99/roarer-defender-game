import Phaser from 'phaser';
import { PATH_TEXTURE_KEYS, PATH_TILE_DEPTH, type PathTier } from '../config/pathStyle';
import { GridManager, cellKey, type CellCoord } from '../systems/GridManager';

export class PathRenderer {
  private tiles: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly grid: GridManager,
  ) {}

  render(paths: ReadonlyMap<string, CellCoord[]>, tier: PathTier): void {
    this.clearTiles();
    this.paintTiles(paths, tier);
  }

  destroy(): void {
    this.clearTiles();
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
}
