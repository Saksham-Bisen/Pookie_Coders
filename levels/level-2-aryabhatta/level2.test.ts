import { describe, expect, it } from 'vitest';
import type { PixaEvents } from '@pixa/core/events';
import { jumpRise } from '@pixa/core/entities/IdCard';
import { action, expandScript, type InputScript } from '@pixa/core/input/ActionFrame';
import type { LevelWorld } from '@pixa/core/world/LevelWorld';
import { createLevel2World } from './createWorld';
import { Level2Hints } from './hints';
import { LEVEL2_SOLUTION } from './solution';

function run(script: InputScript, w: LevelWorld = createLevel2World()) {
  const log: { type: keyof PixaEvents; payload: unknown }[] = [];
  const types: (keyof PixaEvents)[] = ['clipboard:copy', 'clipboard:paste', 'commit:end', 'card:thrown', 'switch:on',
    'card:returned', 'card:lost', 'gate:open', 'gate:close', 'player:died', 'level:complete'];
  for (const t of types) w.bus.on(t, (payload) => log.push({ type: t, payload }));
  const hints = new Level2Hints(w);
  for (const a of expandScript(script)) {
    if (w.finished) break;
    w.step(a);
    hints.update();
  }
  return { w, hints, log, count: (t: keyof PixaEvents) => log.filter((e) => e.type === t).length };
}

/** The solution up to (not including) the throw: ghost on B, Bit on A. */
const UP_TO_THROW = LEVEL2_SOLUTION.slice(0, LEVEL2_SOLUTION.findIndex(([, k]) => k.includes('F')));

describe('Level 2 — Back Bench', () => {
  it('map loads with the agreed layout', () => {
    const w = createLevel2World();
    expect([w.map.width, w.map.height]).toEqual([20, 11]);
    expect(w.collider.isSolidTile(4, 7)).toBe(true); // desk top row
    expect(w.collider.isSolidTile(4, 6)).toBe(false);
    expect(w.button('button_A').sensor.x).toBe(11 * 16);
    expect(w.switchById('board_switch').rect).toMatchObject({ x: 96, y: 64 });
    expect(w.clipboard.objects.map((o) => o.id)).toEqual(['bench_1', 'bench_2']);
    expect(w.gate('classroom_door').latch).toBe(true);
  });

  it('expected solution completes the level with the star', () => {
    const { w, count } = run(LEVEL2_SOLUTION);
    expect(w.finished).toBe(true);
    expect(w.result).toMatchObject({ levelId: 'L2', ghostsUsed: 1, cardThrows: 1, pastesUsed: 1, deaths: 0, star: true });
    expect(count('switch:on')).toBe(1);
    expect(count('card:returned')).toBe(1);
    expect(count('gate:close')).toBe(0); // the door latched open
  });

  it('the desk top is out of jump reach from the floor, but not from a bench', () => {
    const rise = jumpRise();
    expect(160 - rise).toBeGreaterThan(112); // floor: feet never reach the desk top
    expect(144 - rise).toBeLessThan(112); // bench top: they do
    // And in the sim: jumping at the desk from the floor never lands on it.
    const w = createLevel2World();
    w.player.teleport(110, 138);
    for (const a of expandScript([[200, 'LJ']])) w.step(a);
    expect(w.player.body.y + w.player.body.h).toBe(160);
  });

  it('door stays shut with only one button, or without the switch', () => {
    // Ghost on B, Bit on A, but no throw.
    const { w } = run([...UP_TO_THROW, [200, '']]);
    expect(w.logic.value('and_1')).toBe(true);
    expect(w.gate('classroom_door').isClosed).toBe(true);
    // Throw from the floor without the ghost: switch latches, but and_1 is off.
    const w2 = createLevel2World();
    w2.player.teleport(179, 138);
    for (const a of expandScript([[10, 'LUF'], [100, '']])) w2.step(a);
    expect(w2.switchById('board_switch').on).toBe(true);
    expect(w2.gate('classroom_door').isClosed).toBe(true);
  });

  it('three throws means no star', () => {
    const extra: InputScript = [[10, 'UF'], [80, ''], [10, 'UF'], [80, '']]; // straight up: returns
    const throwAt = LEVEL2_SOLUTION.findIndex(([, k]) => k.includes('F'));
    const script = [...LEVEL2_SOLUTION.slice(0, throwAt), ...extra, ...LEVEL2_SOLUTION.slice(throwAt)];
    const { w } = run(script);
    expect(w.finished).toBe(true);
    expect(w.result).toMatchObject({ cardThrows: 3, star: false });
  });

  it('a lost card keeps the turnstile shut', () => {
    const w = createLevel2World();
    let lost = 0;
    w.bus.on('card:lost', () => lost++);
    w.player.teleport(250, 122); // standing on bench_2
    for (const a of expandScript([[5, 'UF'], [100, '']])) w.step(a); // straight up into the ceiling
    expect(lost).toBe(1);
    expect(w.card.state).toBe('lost');
    expect(w.turnstiles[0].open).toBe(false);
    expect(w.collider.hitsSolid({ x: 20, y: 140, w: 4, h: 4 })).toBe(true);
  });

  it('shows the tutorial hints in order', () => {
    const { hints } = run(LEVEL2_SOLUTION);
    expect(hints.shown).toEqual(['start', 'copy', 'paste', 'and', 'locked']);
    const w = createLevel2World();
    const h = new Level2Hints(w);
    w.player.teleport(250, 122);
    for (const a of expandScript([[5, 'UF'], [60, '']])) { w.step(a); h.update(); }
    expect(h.current?.id).toBe('lost');
    for (let i = 0; i < 600; i++) { w.step(action()); h.update(); }
    expect(h.current?.id).toBe('lost'); // stays up until restart
  });
});
