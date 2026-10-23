import type { Body } from './Body';
import type { Collider } from './Collider';
import type { Rect } from './Rect';

/**
 * Moves a body sideways out of `r` (never up or down, so nothing gets crushed).
 * Goes to `prefer` side (or the side the body's centre is on), else the other side if blocked.
 */
export function pushOutSideways(b: Body, r: Rect, collider: Collider, ignoreTags: readonly string[], prefer?: 1 | -1): void {
  const leftX = r.x - b.w;
  const rightX = r.x + r.w;
  const side = prefer ?? (b.x + b.w / 2 <= r.x + r.w / 2 ? -1 : 1);
  const fits = (x: number) => !collider.hitsSolid({ x, y: b.y, w: b.w, h: b.h }, ignoreTags);
  const order = side < 0 ? [leftX, rightX] : [rightX, leftX];
  b.x = order.find(fits) ?? order[0];
  b.vx = 0;
}
