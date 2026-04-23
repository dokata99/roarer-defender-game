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

// Palette aligned to 02-01 / 02-03 §1 column B. Cyberpunk neon — cool defense, warm threats.
export const COLORS = {
  background: 0x0b0c10,
  gridCell: 0x141726,
  gridBorder: 0x2a2f4a,
  portal: 0x6a00ff,
  portalEdge: 0xff3cf2,
  castle: 0x00e5ff,
  hudBg: 0x141726,
  bottomBarBg: 0x141726,
  textPrimary: '#c9d1d9',
  textMuted: '#667788',
  textGold: '#f7ff4a',
  textAccent: '#00e5ff',
  textDanger: '#ff2e63',
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

