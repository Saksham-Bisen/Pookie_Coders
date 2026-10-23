import type { Rect } from '../physics/Rect';

/** Wall switch hit by the ID card. A latch: once on, it stays on. */
export class Switch {
  on = false;

  constructor(readonly id: string, readonly rect: Rect) {}

  /** Returns true if this hit turned it on. */
  hit(): boolean {
    if (this.on) return false;
    this.on = true;
    return true;
  }
}
