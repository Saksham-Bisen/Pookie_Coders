import { FPS } from '../constants';
import type { Body } from '../physics/Body';
import type { Collider, DynamicSolid } from '../physics/Collider';
import { overlaps, type Rect } from '../physics/Rect';

export interface GateOptions {
  /** Seconds to fully open or close. */
  openTime?: number;
}

/**
 * Sliding gate. The bar retracts upward as it opens: the solid part is the top
 * (1 - progress) of its rect. While closing it pushes bodies out sideways, never crushes.
 */
export class Gate implements DynamicSolid {
  readonly tag = 'gate';
  /** 0 = closed, 1 = open. */
  progress = 0;
  powered = false;
  private readonly step: number;

  constructor(readonly id: string, readonly area: Rect, opts: GateOptions = {}) {
    this.step = 1 / Math.max(1, Math.round((opts.openTime ?? 0.3) * FPS));
  }

  get isOpen(): boolean {
    return this.progress >= 1;
  }
  get isClosed(): boolean {
    return this.progress <= 0;
  }

  /** Sets the logic input. Returns 'open'/'close' on change. */
  setPowered(on: boolean): 'open' | 'close' | null {
    if (on === this.powered) return null;
    this.powered = on;
    return on ? 'open' : 'close';
  }

  rect(): Rect | null {
    const h = this.area.h * (1 - this.progress);
    if (h <= 0.001) return null;
    return { x: this.area.x, y: this.area.y, w: this.area.w, h };
  }

  update(bodies: Body[], collider: Collider): void {
    const target = this.powered ? 1 : 0;
    if (this.progress < target) this.progress = Math.min(1, this.progress + this.step);
    else if (this.progress > target) this.progress = Math.max(0, this.progress - this.step);
    const r = this.rect();
    if (!r) return;
    for (const b of bodies) if (overlaps(b, r)) this.pushOut(b, r, collider);
  }

  /** Push the body to the side its centre is on; if that side is blocked, the other side. */
  private pushOut(b: Body, r: Rect, collider: Collider): void {
    const leftX = r.x - b.w;
    const rightX = r.x + r.w;
    const preferLeft = b.x + b.w / 2 <= r.x + r.w / 2;
    const fits = (x: number) => !collider.hitsSolid({ x, y: b.y, w: b.w, h: b.h }, [this.tag]);
    const order = preferLeft ? [leftX, rightX] : [rightX, leftX];
    b.x = order.find(fits) ?? order[0];
    b.vx = 0;
  }
}
