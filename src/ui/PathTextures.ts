import Phaser from 'phaser';
import { CELL_SIZE } from '../config/constants';
import { PATH_TEXTURE_KEYS } from '../config/pathStyle';

export function registerPathTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(PATH_TEXTURE_KEYS.normal)) drawGrass(scene);
  if (!scene.textures.exists(PATH_TEXTURE_KEYS.elite)) drawCobble(scene);
  if (!scene.textures.exists(PATH_TEXTURE_KEYS.boss)) drawBrick(scene);
}

function drawGrass(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x2d4a2b, 1);
  g.fillRect(0, 0, CELL_SIZE, CELL_SIZE);

  const rng = seededRng(42);
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(rng() * CELL_SIZE);
    const y = Math.floor(rng() * CELL_SIZE);
    const len = 3 + Math.floor(rng() * 4);
    const angle = rng() * Math.PI;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;
    g.lineStyle(2, 0x4a7841, 1);
    g.lineBetween(x, y, x + dx, y + dy);
  }

  g.fillStyle(0x3d5a32, 0.6);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(rng() * CELL_SIZE);
    const y = Math.floor(rng() * CELL_SIZE);
    g.fillEllipse(x, y, 3 + rng() * 3, 2 + rng() * 2);
  }

  g.generateTexture(PATH_TEXTURE_KEYS.normal, CELL_SIZE, CELL_SIZE);
  g.destroy();
}

function drawCobble(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x23262a, 1);
  g.fillRect(0, 0, CELL_SIZE, CELL_SIZE);

  const rng = seededRng(7);
  const stoneColors = [0x5a5d62, 0x6a6d72, 0x7a7d82, 0x63666b];

  for (let i = 0; i < 7; i++) {
    const w = 14 + Math.floor(rng() * 10);
    const h = 14 + Math.floor(rng() * 10);
    const x = Math.floor(rng() * (CELL_SIZE - w));
    const y = Math.floor(rng() * (CELL_SIZE - h));
    const color = stoneColors[i % stoneColors.length];

    g.fillStyle(0x15171a, 1);
    g.fillRoundedRect(x + 1, y + 1, w, h, 4);
    g.fillStyle(color, 1);
    g.fillRoundedRect(x, y, w, h, 4);
  }

  g.generateTexture(PATH_TEXTURE_KEYS.elite, CELL_SIZE, CELL_SIZE);
  g.destroy();
}

function drawBrick(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x1a0808, 1);
  g.fillRect(0, 0, CELL_SIZE, CELL_SIZE);

  const brickH = 22;
  const brickW = 24;
  const mortar = 1;
  const colors = [0x6b2020, 0x7a2424, 0x8c2828, 0x702222];
  const rng = seededRng(99);

  for (let row = 0; row < 3; row++) {
    const y = row * (brickH + mortar);
    const offset = row % 2 === 0 ? 0 : -brickW / 2;
    for (let col = -1; col < 4; col++) {
      const x = offset + col * (brickW + mortar);
      const clipX = Math.max(0, x);
      const clipW = Math.min(CELL_SIZE, x + brickW) - clipX;
      if (clipW <= 0) continue;
      const color = colors[Math.floor(rng() * colors.length)];
      g.fillStyle(color, 1);
      g.fillRect(clipX, y, clipW, brickH);
    }
  }

  g.generateTexture(PATH_TEXTURE_KEYS.boss, CELL_SIZE, CELL_SIZE);
  g.destroy();
}

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
