import { PLAYER_H, PLAYER_W } from '../constants';
import { overlaps, type Rect } from '../physics/Rect';
import type { Commit, RecordedFrame } from '../recorder/Recorder';

/** A looping replay of one commit. */
export class Ghost {
  index = 0;
  /** True on the frame the loop jumped from the last frame back to the first. */
  wrapped = false;
  prevX: number;
  prevY: number;

  constructor(readonly commit: Commit, readonly slot: number) {
    const f = commit.frames[0];
    this.prevX = f.x;
    this.prevY = f.y;
  }

  get id(): string {
    return this.commit.id;
  }
  get frame(): RecordedFrame {
    return this.commit.frames[this.index];
  }
  get x(): number {
    return this.frame.x;
  }
  get y(): number {
    return this.frame.y;
  }
  get rect(): Rect {
    return { x: this.x, y: this.y, w: PLAYER_W, h: PLAYER_H };
  }

  frameRect(i: number): Rect {
    const f = this.commit.frames[i];
    return { x: f.x, y: f.y, w: PLAYER_W, h: PLAYER_H };
  }

  step(): void {
    this.prevX = this.x;
    this.prevY = this.y;
    const n = this.commit.frames.length;
    this.index = (this.index + 1) % n;
    this.wrapped = this.index === 0;
  }

  /**
   * Loop-seam rule: if the ghost was on `sensor` on its last frame and is on it again on
   * its first frame, the sensor counts as held through the restart (no flicker).
   */
  holdsThroughSeam(sensor: Rect): boolean {
    if (!this.wrapped) return false;
    const last = this.frameRect(this.commit.frames.length - 1);
    return overlaps(last, sensor) && overlaps(this.rect, sensor);
  }
}

export interface GhostManagerEvents {
  onDropped?(ghost: Ghost): void;
}

/** Keeps up to `max` ghosts; a new commit past the cap drops the oldest. */
export class GhostManager {
  readonly ghosts: Ghost[] = [];
  private nextSlot = 0;

  constructor(readonly max = 3, private events: GhostManagerEvents = {}) {}

  add(commit: Commit): Ghost {
    while (this.ghosts.length >= this.max) {
      const dropped = this.ghosts.shift()!;
      this.events.onDropped?.(dropped);
    }
    const g = new Ghost(commit, this.nextSlot++ % this.max);
    this.ghosts.push(g);
    return g;
  }

  step(): void {
    for (const g of this.ghosts) g.step();
  }

  clear(): void {
    this.ghosts.length = 0;
  }
}
