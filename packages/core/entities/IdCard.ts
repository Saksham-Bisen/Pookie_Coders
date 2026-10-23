import { PHYS, PLAYER_H, TILE } from '../constants';
import type { Collider } from '../physics/Collider';
import { overlaps, type Rect } from '../physics/Rect';

export type CardState = 'hand' | 'out' | 'back' | 'stuck' | 'lost';

export const CARD = {
  size: 6,
  speed: 4, // px/frame = 240 px/s
  range: 8 * TILE, // path length before it turns back
  /** Solids the card flies through. */
  ignoreTags: ['turnstile', 'copyable'] as readonly string[],
} as const;

/** Highest Bit's feet rise in one jump, from the real per-frame physics. */
export function jumpRise(): number {
  let v = -PHYS.jumpVelocity, y = 0, top = 0;
  for (let i = 0; i < 200; i++) {
    v = Math.min(PHYS.maxFall, v + PHYS.gravity);
    y += v;
    top = Math.min(top, y);
    if (v > 0) break;
  }
  return -top;
}

/** Can Bit touch `r` from some standable surface within 2 tiles sideways? */
export function isReachable(r: Rect, collider: Collider, extraTops: readonly Rect[] = []): boolean {
  const reach = jumpRise() + PLAYER_H; // how far above a surface Bit's head can get
  const bottom = r.y + r.h;
  const x0 = Math.floor((r.x - 2 * TILE) / TILE);
  const x1 = Math.floor((r.x + r.w + 2 * TILE) / TILE);
  for (let tx = x0; tx <= x1; tx++) {
    for (let ty = 0; ty < collider.heightTiles; ty++) {
      // A standable top: solid tile with open space above it.
      const isTop = collider.isSolidTile(tx, ty) && !collider.isSolidTile(tx, ty - 1);
      if (isTop && ty * TILE - reach < bottom) return true;
    }
  }
  return extraTops.some((t) => Math.abs(t.x + t.w / 2 - (r.x + r.w / 2)) <= t.w / 2 + 2 * TILE && t.y - reach < bottom);
}

/** The ID card: thrown in 8 directions, comes back like a boomerang, sticks to walls. */
export class IdCard {
  state: CardState = 'hand';
  x = 0;
  y = 0;
  private dx = 0;
  private dy = 0;
  private travelled = 0;
  throws = 0;
  /** Frames since thrown, for the spin animation. */
  age = 0;

  get rect(): Rect {
    return { x: this.x, y: this.y, w: CARD.size, h: CARD.size };
  }
  get inHand(): boolean {
    return this.state === 'hand';
  }
  get flying(): boolean {
    return this.state === 'out' || this.state === 'back';
  }

  /** Throw from (cx, cy) towards (dirX, dirY), each -1/0/1. */
  throw(cx: number, cy: number, dirX: number, dirY: number): boolean {
    if (this.state !== 'hand' || (dirX === 0 && dirY === 0)) return false;
    const len = Math.hypot(dirX, dirY);
    this.dx = dirX / len;
    this.dy = dirY / len;
    this.x = cx - CARD.size / 2;
    this.y = cy - CARD.size / 2;
    this.travelled = 0;
    this.age = 0;
    this.state = 'out';
    this.throws++;
    return true;
  }

  /**
   * One frame. `owner` is Bit's body; `tops` are extra standable surfaces (copyables)
   * for the reachability check. Returns what happened this frame, if anything.
   */
  update(owner: Rect, collider: Collider, tops: readonly Rect[] = []): 'returned' | 'stuck' | 'lost' | null {
    if (this.state === 'hand' || this.state === 'lost') return null;
    this.age++;
    if (this.state === 'stuck') {
      if (overlaps(owner, this.rect)) return this.catch();
      return null;
    }
    if (this.state === 'back') {
      const tx = owner.x + owner.w / 2 - CARD.size / 2;
      const ty = owner.y + owner.h / 2 - CARD.size / 2;
      const d = Math.hypot(tx - this.x, ty - this.y) || 1;
      this.dx = (tx - this.x) / d;
      this.dy = (ty - this.y) / d;
    }
    const nx = this.x + this.dx * CARD.speed;
    const ny = this.y + this.dy * CARD.speed;
    if (collider.hitsSolid({ x: nx, y: ny, w: CARD.size, h: CARD.size }, CARD.ignoreTags)) {
      this.state = isReachable(this.rect, collider, tops) ? 'stuck' : 'lost';
      return this.state;
    }
    this.x = nx;
    this.y = ny;
    if (this.state === 'out') {
      this.travelled += CARD.speed;
      if (this.travelled >= CARD.range) this.state = 'back';
    } else if (overlaps(owner, this.rect)) {
      return this.catch();
    }
    return null;
  }

  private catch(): 'returned' {
    this.state = 'hand';
    return 'returned';
  }

  reset(): void {
    this.state = 'hand';
    this.throws = 0;
  }
}
