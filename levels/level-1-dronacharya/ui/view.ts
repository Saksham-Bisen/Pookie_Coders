import { BASE_HEIGHT, BASE_WIDTH, ZOOM } from '@pixa/core/constants';
import type { LevelWorld } from '@pixa/core/world/LevelWorld';

/** The design frame: the 320x180 world at 4x. */
export const SCREEN_W = BASE_WIDTH * ZOOM; // 1280
export const SCREEN_H = BASE_HEIGHT * ZOOM; // 720

/**
 * World px -> design px. The camera is pinned vertically to the bottom of the map
 * (same as the Phaser scene), so y is shifted up by the rows above the screen.
 */
export interface View {
  /** Design px of the left edge of the screen. */
  camX: number;
  x(worldX: number): number;
  y(worldY: number): number;
  /** Map size in design px. */
  width: number;
}

export function makeView(world: LevelWorld): View {
  const map = world.map;
  const camY = map.pixelHeight - BASE_HEIGHT;
  const p = world.player.body;
  const width = map.pixelWidth * ZOOM;
  const camX = Math.round(Math.min(Math.max((p.x + p.w / 2) * ZOOM - SCREEN_W / 2, 0), width - SCREEN_W));
  return {
    camX,
    x: (wx) => wx * ZOOM,
    y: (wy) => (wy - camY) * ZOOM,
    width,
  };
}

/** 0:24.18 */
export function formatTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}
