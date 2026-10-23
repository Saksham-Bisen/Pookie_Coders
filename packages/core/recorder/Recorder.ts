import { packAction, type ActionFrame } from '../input/ActionFrame';

export type AnimState = 'idle' | 'run' | 'jump' | 'fall';

/** One recorded frame. Positions are stored, not just inputs, so ghosts never drift. */
export interface RecordedFrame {
  x: number;
  y: number;
  facing: 1 | -1;
  anim: AnimState;
  /** ActionFrame packed as bits, see packAction(). */
  actions: number;
}

export interface Commit {
  /** 6-char hex hash, e.g. "a1f3c9". */
  id: string;
  frames: RecordedFrame[];
  startX: number;
  startY: number;
  createdAt: number; // world frame number
}

/** FNV-1a over the recorded path, so a commit's hash depends on what was recorded. */
export function commitHash(frames: RecordedFrame[], salt: number): string {
  let h = 0x811c9dc5 ^ salt;
  const mix = (n: number) => {
    h ^= n & 0xffff;
    h = Math.imul(h, 0x01000193);
    h ^= n >>> 16;
    h = Math.imul(h, 0x01000193);
  };
  for (const f of frames) {
    mix(Math.round(f.x * 16));
    mix(Math.round(f.y * 16));
    mix(f.actions);
  }
  mix(frames.length);
  return ((h >>> 0) & 0xffffff).toString(16).padStart(6, '0');
}

/** Commit & Replay recorder: [R] starts, [R] again or the frame cap ends it. */
export class Recorder {
  private frames: RecordedFrame[] = [];
  private _recording = false;
  private startX = 0;
  private startY = 0;
  private commitCount = 0;

  constructor(readonly maxFrames = 600) {}

  get recording(): boolean {
    return this._recording;
  }
  get frameCount(): number {
    return this.frames.length;
  }
  get framesLeft(): number {
    return this.maxFrames - this.frames.length;
  }
  get start(): { x: number; y: number } {
    return { x: this.startX, y: this.startY };
  }

  begin(x: number, y: number): void {
    this._recording = true;
    this.frames = [];
    this.startX = x;
    this.startY = y;
  }

  /** Adds a frame. Returns true when the recording is full and should be committed. */
  push(x: number, y: number, facing: 1 | -1, anim: AnimState, a: ActionFrame): boolean {
    if (!this._recording) return false;
    if (this.frames.length < this.maxFrames) this.frames.push({ x, y, facing, anim, actions: packAction(a) });
    return this.frames.length >= this.maxFrames;
  }

  /** Ends recording. Returns null if nothing was recorded. */
  end(nowFrame: number): Commit | null {
    if (!this._recording) return null;
    this._recording = false;
    const frames = this.frames;
    this.frames = [];
    if (frames.length === 0) return null;
    this.commitCount++;
    return {
      id: commitHash(frames, this.commitCount),
      frames,
      startX: this.startX,
      startY: this.startY,
      createdAt: nowFrame,
    };
  }

  cancel(): void {
    this._recording = false;
    this.frames = [];
  }
}
