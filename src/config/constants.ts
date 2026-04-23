import type { CellCoord } from '../systems/GridManager';

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const GRID_COLS = 13;
export const GRID_ROWS = 7;
export const CELL_SIZE = 79;

export const GRID_PIXEL_WIDTH = GRID_COLS * CELL_SIZE;
export const GRID_PIXEL_HEIGHT = GRID_ROWS * CELL_SIZE;

export const HUD_HEIGHT = 56;
export const BOTTOM_BAR_HEIGHT = 110;

export const GRID_OFFSET_X = Math.floor((CANVAS_WIDTH - GRID_PIXEL_WIDTH) / 2);
export const GRID_OFFSET_Y = HUD_HEIGHT;

export const COLORS = {
  background: 0x0b0f1a,
  gridCell: 0x1a2033,
  gridBorder: 0x2a3a55,
  portal: 0x9933cc,
  castle: 0x3366cc,
  hudBg: 0x141a2a,
  bottomBarBg: 0x141a2a,
  textPrimary: '#ffffff',
  textMuted: '#8896b5',
  textGold: '#ffcc66',
  textAccent: '#66ffff',
  textDanger: '#ff4444',
} as const;

export const SCENE_KEYS = {
  MAIN_MENU: 'MainMenuScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
  VICTORY: 'VictoryScene',
  SHOP: 'ShopScene',
  STATS: 'StatsScene',
  CREDITS: 'CreditsScene',
} as const;

export const PORTAL_CELLS: readonly CellCoord[] = [{ col: 0, row: 3 }];

export const CASTLE_CELLS: readonly CellCoord[] = [{ col: GRID_COLS - 1, row: 3 }];

