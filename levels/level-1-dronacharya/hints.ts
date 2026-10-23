import { overlaps } from '@pixa/core/physics/Rect';
import type { LevelWorld } from '@pixa/core/world/LevelWorld';

export type HintId = 'move' | 'button_on' | 'button_off' | 'commit' | 'bug';

export interface Hint {
  id: HintId;
  text: string;
  shownAt: number; // world frame
}

/** How long a hint stays up (frames). The first hint stays until Bit moves. */
export const HINT_FRAMES = 300;

/**
 * Level 1 tutorial hints. One at a time; each shows once, triggered by position or events.
 * Pure logic so it can be tested headless; the scene just draws `current`.
 */
export class Level1Hints {
  current: Hint | null = null;
  readonly shown: HintId[] = [];
  private pendingCommit: string | null = null;

  constructor(private world: LevelWorld) {
    this.show('move', '[A][D] move  [SPACE] jump');
    world.bus.on('commit:end', ({ id }) => {
      if (!this.shown.includes('commit')) this.pendingCommit = id;
    });
  }

  update(): void {
    const w = this.world;
    const p = w.player.body;
    const onButton = overlaps(p, w.button('start_button').sensor);

    if (this.pendingCommit) {
      this.show('commit', `> commit ${this.pendingCommit} created. Your ghost holds the button.`);
      this.pendingCommit = null;
    } else if (onButton && !this.shown.includes('button_on') && w.ghostsUsed === 0) {
      this.show('button_on', 'Gate open... but only while you stand here.');
    } else if (
      !onButton &&
      this.shown.includes('button_on') &&
      !this.shown.includes('button_off') &&
      w.ghostsUsed === 0 &&
      !w.recorder.recording
    ) {
      this.show('button_off', 'Need a teammate? Press [R] to commit yourself.');
    } else if (!this.shown.includes('bug')) {
      const bug = w.object('bug_1');
      const minX = ((bug.props.minTileX as number) ?? 0) * w.map.tileSize;
      if (p.x + p.w > minX - 6 * w.map.tileSize) this.show('bug', 'Bugs? Stomp them.');
    }

    const c = this.current;
    if (c && c.id !== 'move' && w.frame - c.shownAt > HINT_FRAMES) this.current = null;
    if (c && c.id === 'move' && Math.abs(p.x - w.spawn.x) > 24 && w.frame - c.shownAt > HINT_FRAMES) this.current = null;
  }

  private show(id: HintId, text: string): void {
    this.shown.push(id);
    this.current = { id, text, shownAt: this.world.frame };
  }
}
