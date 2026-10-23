import type { Collider } from '../physics/Collider';
import type { Rect } from '../physics/Rect';

export interface BugOptions {
  /** Patrol bounds in px (left edge min, right edge max). */
  minX: number;
  maxX: number;
  /** px per second. */
  speed?: number;
  dir?: 1 | -1;
  /** On stomp, spawn 2 small bugs. */
  splits?: boolean;
  small?: boolean;
}

export type BugState = 'walk' | 'squashed' | 'gone';

const SQUASH_FRAMES = 20;

/** Patrolling enemy. Kills Bit from the side or below; stomping from above squashes it. */
export class Bug {
  x: number;
  y: number;
  readonly w: number;
  readonly h: number;
  dir: 1 | -1;
  state: BugState = 'walk';
  private squashTimer = 0;
  readonly speed: number;

  constructor(x: number, bottom: number, readonly opts: BugOptions) {
    this.w = opts.small ? 8 : 16;
    this.h = opts.small ? 6 : 12;
    this.x = x;
    this.y = bottom - this.h;
    this.dir = opts.dir ?? 1;
    this.speed = (opts.speed ?? 30) / 60;
  }

  get alive(): boolean {
    return this.state === 'walk';
  }
  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(collider: Collider): void {
    if (this.state === 'squashed') {
      if (--this.squashTimer <= 0) this.state = 'gone';
      return;
    }
    if (this.state !== 'walk') return;
    const nx = this.x + this.dir * this.speed;
    const blocked = collider.hitsSolid({ x: nx, y: this.y, w: this.w, h: this.h }, ['firewall']);
    if (blocked || nx < this.opts.minX || nx + this.w > this.opts.maxX) {
      this.dir = this.dir === 1 ? -1 : 1;
      this.x = Math.min(Math.max(this.x, this.opts.minX), this.opts.maxX - this.w);
    } else {
      this.x = nx;
    }
  }

  /** Squash this bug. Returns the small bugs it splits into (empty unless `splits`). */
  stomp(): Bug[] {
    this.state = 'squashed';
    this.squashTimer = SQUASH_FRAMES;
    if (!this.opts.splits) return [];
    const bottom = this.y + this.h;
    const base = { minX: this.opts.minX, maxX: this.opts.maxX, speed: (this.opts.speed ?? 30) * 1.5, small: true, splits: false };
    return [
      new Bug(this.x, bottom, { ...base, dir: -1 }),
      new Bug(this.x + this.w - 8, bottom, { ...base, dir: 1 }),
    ];
  }
}
