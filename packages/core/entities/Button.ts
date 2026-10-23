import type { Ghost } from '../ghosts/GhostManager';
import { overlaps, type Rect } from '../physics/Rect';

/** Floor button. Pressed while any presser (Bit, a ghost, a crate) overlaps its plate. */
export class Button {
  pressed = false;

  constructor(readonly id: string, readonly sensor: Rect) {}

  /** Returns 'down' / 'up' when the state changed this frame, else null. */
  update(pressers: readonly Rect[], ghosts: readonly Ghost[] = []): 'down' | 'up' | null {
    const now =
      pressers.some((r) => overlaps(r, this.sensor)) ||
      ghosts.some((g) => overlaps(g.rect, this.sensor) || g.holdsThroughSeam(this.sensor));
    if (now === this.pressed) return null;
    this.pressed = now;
    return now ? 'down' : 'up';
  }
}
