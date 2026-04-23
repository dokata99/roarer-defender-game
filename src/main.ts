import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './config/constants';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { VictoryScene } from './scenes/VictoryScene';
import { ShopScene } from './scenes/ShopScene';
import { StatsScene } from './scenes/StatsScene';
import { CreditsScene } from './scenes/CreditsScene';

// Render the canvas backing store at physical pixels so high-DPI / scaled-resolution
// monitors don't see a browser-upscaled 1280x720 bitmap. Coordinate system stays 1280x720.
// Cap at 3 to avoid pathological GPU load on 4K retina displays.
const dpr = Math.min(window.devicePixelRatio || 1, 3);

const config: Phaser.Types.Core.GameConfig = {
  // WebGL required for postFX (bloom, vignette, glow). See 02-03 §8.
  type: Phaser.WEBGL,
  parent: 'app',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: dpr,
  },
  // Trilinear mipmapping — keeps the 512px bear PNG crisp when downscaled to ~67px.
  // Only affects power-of-two textures; non-PoT path tiles are unaffected.
  render: {
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
  },
  scene: [
    MainMenuScene,
    GameScene,
    GameOverScene,
    VictoryScene,
    ShopScene,
    StatsScene,
    CreditsScene,
  ],
};

new Phaser.Game(config);
