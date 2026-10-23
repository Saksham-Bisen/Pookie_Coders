import type { Rect } from './Rect';

export interface Body extends Rect {
  vx: number;
  vy: number;
  grounded: boolean;
}

export function createBody(x: number, y: number, w: number, h: number): Body {
  return { x, y, w, h, vx: 0, vy: 0, grounded: false };
}
