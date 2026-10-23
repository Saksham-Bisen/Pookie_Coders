import { describe, expect, it } from 'vitest';
import type { PixaEvents } from '@pixa/core/events';
import { action, expandScript, type InputScript } from '@pixa/core/input/ActionFrame';
import type { LevelWorld } from '@pixa/core/world/LevelWorld';
import { createLevel1World } from './createWorld';
import { Level1Hints } from './hints';
import { LEVEL1_SOLUTION } from './solution';

function run(script: InputScript, w: LevelWorld = createLevel1World()) {
  const log: { type: keyof PixaEvents; frame: number; payload: unknown }[] = [];
  const types: (keyof PixaEvents)[] = [
    'commit:start', 'commit:end', 'ghost:dropped', 'button:down', 'button:up',
    'gate:open', 'gate:close', 'bug:stomped', 'player:died', 'level:complete',
  ];
  for (const t of types) w.bus.on(t, (payload) => log.push({ type: t, frame: w.frame, payload }));
  const hints = new Level1Hints(w);
  for (const a of expandScript(script)) {
    if (w.finished) break;
    w.step(a);
    hints.update();
  }
  return { w, log, hints, count: (t: keyof PixaEvents) => log.filter((e) => e.type === t).length };
}

describe('Level 1 — Relay Race', () => {
  it('map loads with the spec layout', () => {
    const w = createLevel1World();
    expect(w.map.width).toBe(64);
    expect(w.map.height).toBe(12);
    expect(w.collider.isSolidTile(10, 10)).toBe(true); // track row
    expect(w.collider.isSolidTile(18, 9)).toBe(true); // hurdle 1
    expect(w.collider.isSolidTile(44, 9)).toBe(true); // hurdle 2
    expect(w.collider.isSolidTile(30, 9)).toBe(false);
    expect(w.spawn.x + w.player.body.w / 2).toBe(2 * 16 + 8);
    expect(w.gate('sports_gate').isClosed).toBe(true);
  });

  it('expected solution completes the level with the star', () => {
    const { w, count, log } = run(LEVEL1_SOLUTION);
    expect(w.finished).toBe(true);
    expect(count('commit:end')).toBe(1);
    expect(count('bug:stomped')).toBe(1);
    expect(count('player:died')).toBe(0);
    expect(count('gate:close')).toBe(0); // ghost held it through every loop seam
    const done = log.find((e) => e.type === 'level:complete')!.payload;
    expect(done).toMatchObject({ levelId: 'L1', ghostsUsed: 1, deaths: 0, star: true });
    expect(w.result!.timeMs).toBeLessThan(30_000);
  });

  it('without a ghost the gate stays shut and Bit cannot finish', () => {
    const { w } = run([[60 * 20, 'R']]);
    expect(w.finished).toBe(false);
    expect(w.player.body.x + w.player.body.w).toBeLessThanOrEqual(58 * 16);
  });

  it('gate opens only while Bit stands on the button', () => {
    const w = createLevel1World();
    const gate = w.gate('sports_gate');
    for (const a of expandScript([[22, 'R'], [30, '']])) w.step(a);
    expect(w.button('start_button').pressed).toBe(true);
    expect(gate.isOpen).toBe(true);
    for (const a of expandScript([[40, 'R'], [30, '']])) w.step(a);
    expect(w.button('start_button').pressed).toBe(false);
    expect(gate.isClosed).toBe(true);
  });

  it('ghost keeps the button pressed with no flicker across many loops', () => {
    const w = createLevel1World();
    for (const a of expandScript([[22, 'R'], [20, ''], [1, 'C'], [60, ''], [1, 'C']])) w.step(a);
    let ups = 0;
    w.bus.on('button:up', () => ups++);
    // Walk away and wait long enough for 10+ loop restarts.
    for (const a of expandScript([[40, 'R'], [700, '']])) w.step(a);
    expect(ups).toBe(0);
    expect(w.gate('sports_gate').isOpen).toBe(true);
  });

  it('touching the bug from the side kills Bit; ghosts stay, timer keeps running', () => {
    const w = createLevel1World();
    for (const a of expandScript([[22, 'R'], [20, ''], [1, 'C'], [60, ''], [1, 'C']])) w.step(a);
    const died: PixaEvents['player:died'][] = [];
    w.bus.on('player:died', (e) => died.push(e));
    // Walk right, hop hurdle 1, then walk into the bug.
    for (const a of expandScript([[134, 'R'], [1, 'RJ'], [200, 'R']])) {
      w.step(a);
      if (died.length) break;
    }
    expect(died.length).toBe(1);
    expect(w.deaths).toBe(1);
    expect(w.ghosts.ghosts.length).toBe(1);
    expect(w.player.body.x).toBe(w.spawn.x);
    const t = w.timeMs;
    w.step(action());
    expect(w.timeMs).toBeGreaterThan(t);
  });

  it('shows the tutorial hints in order', () => {
    const { hints } = run(LEVEL1_SOLUTION);
    expect(hints.shown).toEqual(['move', 'button_on', 'commit', 'bug']);
    const r = run([[22, 'R'], [20, ''], [40, 'R'], [5, '']]);
    expect(r.hints.shown).toEqual(['move', 'button_on', 'button_off']);
    expect(r.hints.current?.text).toContain('Press [R]');
  });

  it('commit hint shows the real commit hash', () => {
    const { w, hints, log } = run([[22, 'R'], [20, ''], [1, 'C'], [60, ''], [1, 'C'], [2, '']]);
    const id = (log.find((e) => e.type === 'commit:end')!.payload as { id: string }).id;
    expect(id).toMatch(/^[0-9a-f]{6}$/);
    expect(w.ghosts.ghosts[0].id).toBe(id);
    expect(hints.current?.text).toBe(`> commit ${id} created. Your ghost holds the button.`);
  });
});
