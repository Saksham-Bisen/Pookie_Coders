/** Shared engine constants. All physics values are per frame at a fixed 60 fps. */
export const TILE = 16;
export const FPS = 60;
export const FRAME_MS = 1000 / FPS;

export const BASE_WIDTH = 320;
export const BASE_HEIGHT = 180;
export const ZOOM = 4;

export const PHYS = {
  gravity: 0.25, // px/frame² (900 px/s²)
  maxFall: 6, // px/frame
  runSpeed: 1.5, // px/frame (90 px/s)
  groundAccel: 0.3,
  airAccel: 0.2,
  /** 4.5 px/frame gives a jump height of ~2.5 tiles. */
  jumpVelocity: 4.5,
  coyoteFrames: 5,
  jumpBufferFrames: 6,
  stompBounce: 0.6,
} as const;

/** Bit's hitbox (sprite is 16x24, hitbox is a bit smaller so he doesn't snag). */
export const PLAYER_W = 10;
export const PLAYER_H = 22;

export const PALETTE = {
  navy: 0x1b1f3b,
  green: 0x3dff8a,
  cyan: 0x3fd0ff,
  orange: 0xff9f43,
  red: 0xff4d5e,
  white: 0xf2f2e9,
  grey: 0x6b7089,
  violet: 0xb48cff,
} as const;
