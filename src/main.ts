import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './config/constants';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { VictoryScene } from './scenes/VictoryScene';
import { ShopScene } from './scenes/ShopScene';
import { StatsScene } from './scenes/StatsScene';
import { CreditsScene } from './scenes/CreditsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
