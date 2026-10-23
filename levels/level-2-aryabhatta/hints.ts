import { overlaps } from '@pixa/core/physics/Rect';
import type { LevelWorld } from '@pixa/core/world/LevelWorld';

export type HintId = 'start' | 'copy' | 'paste' | 'and' | 'locked' | 'lost';

export interface Hint {
  id: HintId;
  text: string;
  shownAt: number;
}

export const HINT_FRAMES = 300;

/**
 * Level 2 tutorial hints. One at a time; each shows once. The card-lost hint stays up
 * because the level can't be finished without a restart.
 */
export class Level2Hints {
  current: Hint | null = null;
  readonly shown: HintId[] = [];
  private copied = false;
  private lost = false;

  constructor(private world: LevelWorld) {
    this.show('start', 'That desk is too high. Notice anything you could copy?');
    world.bus.on('clipboard:copy', () => (this.copied = true));
    world.bus.on('card:lost', () => (this.lost = true));
    // A hint goes away as soon as its step is done.
    world.bus.on('clipboard:paste', () => this.clearIf('paste'));
    world.bus.on('switch:on', () => this.clearIf('locked'));
  }

  private clearIf(id: HintId): void {
    if (this.current?.id === id) this.current = null;
  }

  update(): void {
    const w = this.world;
    const p = w.player.body;
    const once = (id: HintId) => !this.shown.includes(id);
    const touch = { x: p.x - 1, y: p.y - 1, w: p.w + 2, h: p.h + 2 };
    const a = w.button('button_A').pressed;
    const b = w.button('button_B').pressed;

    if (this.lost && once('lost')) {
      this.show('lost', 'Lost your ID? Security won’t let you out. [ESC] → Restart.');
    } else if (this.copied && once('paste')) {
      this.show('paste', '[V] Paste — place it near the desk.');
    } else if (once('copy') && !this.copied && w.clipboard.objects.some((o) => !o.pasted && overlaps(touch, o.area))) {
      this.show('copy', '[C] Copy');
    } else if (once('and') && b && !a) {
      this.show('and', 'AND gate: both buttons must be pressed at once.');
    } else if (once('locked') && w.logic.value('and_1') && !w.logic.value('board_switch')) {
      this.show('locked', 'Door is still locked. Check the blackboard. [F] Throw ID card.');
    }

    const c = this.current;
    if (!c || c.id === 'lost') return;
    if (c.id === 'start') {
      if (Math.abs(p.x - w.spawn.x) > 24 && w.frame - c.shownAt > HINT_FRAMES) this.current = null;
    } else if (w.frame - c.shownAt > HINT_FRAMES) {
      this.current = null;
    }
  }

  private show(id: HintId, text: string): void {
    this.shown.push(id);
    this.current = { id, text, shownAt: this.world.frame };
  }
}
