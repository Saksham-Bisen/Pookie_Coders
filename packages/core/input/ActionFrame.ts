/** One frame of player intent. Produced by the keyboard, or by a script in tests. */
export interface ActionFrame {
  left: boolean;
  right: boolean;
  jump: boolean;
  interact: boolean;
  /** [R] start/stop commit. Held state; the world detects the press edge. */
  commit: boolean;
  throw: boolean;
  copy: boolean;
  paste: boolean;
  undo: boolean;
  /** Aim keys (W/S, Up/Down). Jump is Space only. */
  up: boolean;
  down: boolean;
  /** [ESC] cancels paste placement. */
  cancel: boolean;
}

export const EMPTY_ACTION: Readonly<ActionFrame> = Object.freeze({
  left: false,
  right: false,
  jump: false,
  interact: false,
  commit: false,
  throw: false,
  copy: false,
  paste: false,
  undo: false,
  up: false,
  down: false,
  cancel: false,
});

export function action(partial: Partial<ActionFrame> = {}): ActionFrame {
  return { ...EMPTY_ACTION, ...partial };
}

export function anyAction(a: ActionFrame): boolean {
  for (const k in a) if (a[k as keyof ActionFrame]) return true;
  return false;
}

/** Packs an ActionFrame into a bit field (stored per recorded frame). */
// New keys go at the end so older recordings keep their meaning.
const KEYS: (keyof ActionFrame)[] = ['left', 'right', 'jump', 'interact', 'commit', 'throw', 'copy', 'paste', 'undo', 'up', 'down', 'cancel'];
export function packAction(a: ActionFrame): number {
  let bits = 0;
  KEYS.forEach((k, i) => {
    if (a[k]) bits |= 1 << i;
  });
  return bits;
}
export function unpackAction(bits: number): ActionFrame {
  const a = action();
  KEYS.forEach((k, i) => {
    a[k] = (bits & (1 << i)) !== 0;
  });
  return a;
}

/**
 * Tiny script format for tests and demos: [frames, keys] where keys is a string of
 * L left, R right, J jump, C commit [R key], E interact, U up, N down,
 * K copy [C key], V paste, F throw, Q cancel [ESC]. E.g. [[20, 'R'], [1, 'C']].
 */
export type InputScript = [frames: number, keys: string][];
export function expandScript(script: InputScript): ActionFrame[] {
  const out: ActionFrame[] = [];
  for (const [n, keys] of script) {
    const a = action({
      left: keys.includes('L'),
      right: keys.includes('R'),
      jump: keys.includes('J'),
      commit: keys.includes('C'),
      interact: keys.includes('E'),
      up: keys.includes('U'),
      down: keys.includes('N'),
      copy: keys.includes('K'),
      paste: keys.includes('V'),
      throw: keys.includes('F'),
      cancel: keys.includes('Q'),
    });
    for (let i = 0; i < n; i++) out.push({ ...a });
  }
  return out;
}
