import type { Body } from '../physics/Body';
import type { Collider, DynamicSolid } from '../physics/Collider';
import { pushOutSideways } from '../physics/pushOut';
import { overlaps, type Rect } from '../physics/Rect';

/** ID-card turnstile: lets Bit through only while the card is in his hand. */
export class Turnstile implements DynamicSolid {
  readonly tag = 'turnstile';
  open = false;

  /** `inside` = the side Bit gets pushed to if it shuts on him (1 = right). */
  constructor(readonly id: string, readonly area: Rect, private inside: 1 | -1 = 1) {}

  rect(): Rect | null {
    return this.open ? null : this.area;
  }

  update(open: boolean, bodies: Body[], collider: Collider): void {
    this.open = open;
    if (open) return;
    for (const b of bodies) if (overlaps(b, this.area)) pushOutSideways(b, this.area, collider, [this.tag], this.inside);
  }
}
