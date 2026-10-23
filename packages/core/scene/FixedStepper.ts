import { FRAME_MS } from '../constants';

/** Turns variable frame deltas into fixed 1/60 s steps, so ghosts replay exactly everywhere. */
export class FixedStepper {
  private acc = 0;

  constructor(private step: () => void, private maxDeltaMs = 100) {}

  /** Runs as many fixed steps as `deltaMs` covers. Returns how many ran. */
  advance(deltaMs: number): number {
    this.acc += Math.min(deltaMs, this.maxDeltaMs);
    let n = 0;
    while (this.acc >= FRAME_MS) {
      this.acc -= FRAME_MS;
      this.step();
      n++;
    }
    return n;
  }

  reset(): void {
    this.acc = 0;
  }
}
