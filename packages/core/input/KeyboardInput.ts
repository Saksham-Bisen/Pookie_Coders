import Phaser from 'phaser';
import { action, type ActionFrame } from './ActionFrame';

/** Actions where a quick tap must never be lost, even if down+up land between two reads. */
const LATCHED = ['jump', 'commit', 'interact', 'throw', 'copy', 'paste', 'undo', 'cancel'] as const;
type Latched = (typeof LATCHED)[number];

/** Reads the keyboard into an ActionFrame. Default keys from the architecture doc. */
export class KeyboardInput {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private bindings: Record<keyof ActionFrame, Phaser.Input.Keyboard.Key[]>;
  private tapped = new Set<Latched>();

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({
      a: K.A, d: K.D, left: K.LEFT, right: K.RIGHT, up: K.UP, down: K.DOWN, w: K.W, s: K.S,
      space: K.SPACE, e: K.E, r: K.R, f: K.F, c: K.C, v: K.V, z: K.Z, esc: K.ESC,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    kb.addCapture([K.SPACE, K.UP, K.DOWN, K.LEFT, K.RIGHT]);
    const k = this.keys;
    this.bindings = {
      left: [k.a, k.left], right: [k.d, k.right], jump: [k.space], interact: [k.e],
      commit: [k.r], throw: [k.f], copy: [k.c], paste: [k.v], undo: [k.z],
      up: [k.w, k.up], down: [k.s, k.down], cancel: [k.esc],
    };
    for (const name of LATCHED) for (const key of this.bindings[name]) key.on('down', () => this.tapped.add(name));
  }

  read(): ActionFrame {
    const a = action();
    for (const name of Object.keys(this.bindings) as (keyof ActionFrame)[]) {
      a[name] = this.bindings[name].some((key) => key.isDown) || this.tapped.has(name as Latched);
    }
    this.tapped.clear();
    return a;
  }
}
