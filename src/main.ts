import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH, PALETTE, ZOOM } from '@pixa/core/constants';
import { Level1Scene } from '../levels/level-1-dronacharya/Level1Scene';
import { Level2Scene } from '../levels/level-2-aryabhatta/Level2Scene';

/** All level scenes, keyed by level id. `?level=L2` starts on that level. */
const LEVELS: Record<string, typeof Phaser.Scene> = { L1: Level1Scene, L2: Level2Scene };

async function boot() {
  // Pixel fonts must be ready before Phaser rasterises any text.
  try {
    await Promise.race([
      Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('10px "VT323"')]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    /* fall back to monospace */
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'app',
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    zoom: ZOOM,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: PALETTE.navy,
    // 320x180 scaled up (4x on a 1280x720 window), fitted to whatever screen the laptop has.
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // Phaser starts the first scene in the list; the rest are reachable by key.
    scene: startOrder(),
  });
  // Handy for poking at the world from the browser console during development.
  if (import.meta.env.DEV) (window as unknown as { pixa: Phaser.Game }).pixa = game;
}

function startOrder(): (typeof Phaser.Scene)[] {
  const wanted = new URLSearchParams(location.search).get('level')?.toUpperCase() ?? 'L1';
  const first = LEVELS[wanted] ?? Level1Scene;
  return [first, ...Object.values(LEVELS).filter((s) => s !== first)];
}

void boot();
