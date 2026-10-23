import { action, type ActionFrame } from './ActionFrame';

/** Same default keys as KeyboardInput (architecture doc), as KeyboardEvent.code values. */
const BINDINGS: Record<keyof ActionFrame, string[]> = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  interact: ['KeyE'],
  commit: ['KeyR'],
  throw: ['KeyF'],
  copy: ['KeyC'],
  paste: ['KeyV'],
  undo: ['KeyZ'],
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  cancel: ['Escape'],
};

/** Actions where a quick tap must never be lost, even if down+up land between two reads. */
const LATCHED = new Set<keyof ActionFrame>(['jump', 'commit', 'interact', 'throw', 'copy', 'paste', 'undo', 'cancel']);

/** Keys the browser would otherwise use to scroll the page. */
const CAPTURE = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

type KeyTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/**
 * Reads the keyboard into an ActionFrame without Phaser, for DOM/React renderers.
 * Mirrors KeyboardInput: held keys, plus latched taps so a press between two reads still counts.
 */
export class DomKeyboardInput {
  private held = new Set<string>();
  private tapped = new Set<keyof ActionFrame>();
  private readonly byCode = new Map<string, keyof ActionFrame>();

  constructor(private target: KeyTarget = window) {
    for (const name of Object.keys(BINDINGS) as (keyof ActionFrame)[]) for (const code of BINDINGS[name]) this.byCode.set(code, name);
    target.addEventListener('keydown', this.onDown as EventListener);
    target.addEventListener('keyup', this.onUp as EventListener);
    target.addEventListener('blur', this.onBlur);
  }

  private onDown = (e: KeyboardEvent): void => {
    if (CAPTURE.has(e.code)) e.preventDefault?.();
    if (e.repeat) return;
    this.held.add(e.code);
    const name = this.byCode.get(e.code);
    if (name && LATCHED.has(name)) this.tapped.add(name);
  };

  private onUp = (e: KeyboardEvent): void => {
    this.held.delete(e.code);
  };

  /** Window lost focus: keyup events will never arrive, so let go of everything. */
  private onBlur = (): void => this.reset();

  read(): ActionFrame {
    const a = action();
    for (const name of Object.keys(BINDINGS) as (keyof ActionFrame)[]) {
      a[name] = BINDINGS[name].some((code) => this.held.has(code)) || this.tapped.has(name);
    }
    this.tapped.clear();
    return a;
  }

  /** Forget every key (used when a menu swallows the key that closed it). */
  reset(): void {
    this.held.clear();
    this.tapped.clear();
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.onDown as EventListener);
    this.target.removeEventListener('keyup', this.onUp as EventListener);
    this.target.removeEventListener('blur', this.onBlur);
  }
}
