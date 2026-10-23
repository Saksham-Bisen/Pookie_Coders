import { describe, expect, it } from 'vitest';
import { CARD, IdCard, jumpRise } from './entities/IdCard';
import type { PixaEvents } from './events';
import { expandScript } from './input/ActionFrame';
import { Collider } from './physics/Collider';
import { testConfig, testMap, obj } from './testing/testMaps';
import { LevelWorld } from './world/LevelWorld';

const owner = (cx: number, cy: number) => ({ x: cx - 5, y: cy - 11, w: 10, h: 22 });
const cardCfg = (logic = testConfig().logic) =>
  testConfig({ mechanics: { commit: true, clipboard: false, undo: false, idCard: true }, logic });

describe('IdCard', () => {
  it('flies 8 tiles out, then comes back to Bit', () => {
    const col = new Collider(testMap({ width: 40, height: 12 }));
    const card = new IdCard();
    const me = owner(100, 100);
    card.throw(105, 100, 1, 0);
    let maxX = 0, result = null, frames = 0;
    while (!result && frames < 200) {
      result = card.update(me, col);
      maxX = Math.max(maxX, card.x + CARD.size / 2);
      frames++;
    }
    expect(result).toBe('returned');
    expect(maxX - 105).toBeCloseTo(CARD.range, 0);
    expect(card.inHand).toBe(true);
    expect(frames).toBeGreaterThan(CARD.range / CARD.speed);
  });

  it('aims in all 8 directions', () => {
    const col = new Collider(testMap({ width: 40, height: 40 }));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const card = new IdCard();
      card.throw(320, 320, dx, dy);
      for (let i = 0; i < 10; i++) card.update(owner(320, 320), col);
      const mx = card.x + 3 - 320, my = card.y + 3 - 320;
      expect([Math.sign(Math.round(mx)), Math.sign(Math.round(my))]).toEqual([dx, dy]);
    }
  });

  it('sticks to a wall it hits, and Bit picks it up by touching it', () => {
    const col = new Collider(testMap({ width: 30, solids: [[12, 3], [12, 4]] }));
    const card = new IdCard();
    card.throw(100, 70, 1, 0);
    let r = null;
    for (let i = 0; i < 40 && !r; i++) r = card.update(owner(100, 70), col);
    expect(r).toBe('stuck');
    expect(card.x + CARD.size).toBeLessThanOrEqual(12 * 16);
    expect(card.update(owner(100, 70), col)).toBeNull(); // still stuck
    expect(card.update({ x: card.x - 2, y: card.y - 4, w: 10, h: 22 }, col)).toBe('returned');
  });

  it('is lost when it sticks out of reach (ceiling)', () => {
    const ceiling = Array.from({ length: 20 }, (_, x) => [x, 0] as [number, number]);
    const col = new Collider(testMap({ height: 9, solids: ceiling }));
    const card = new IdCard();
    card.throw(100, 114, 0, -1);
    let r = null;
    for (let i = 0; i < 60 && !r; i++) r = card.update(owner(100, 114), col);
    expect(r).toBe('lost');
    expect(jumpRise()).toBeGreaterThan(36); // ~2.4 tiles
    expect(jumpRise()).toBeLessThan(40);
  });

  it('in the world: hold [F] to aim (Bit stands still), release to throw; hits and latches a switch', () => {
    const map = testMap({ width: 30, objects: [obj('switch', 'sw', 120, 56, 16, 16)] });
    const w = new LevelWorld(map, cardCfg([{ id: 'sw', type: 'switch' }, { id: 'door', type: 'door', in: 'sw' }]));
    const ev: string[] = [];
    for (const t of ['card:thrown', 'switch:on', 'card:returned'] as (keyof PixaEvents)[]) w.bus.on(t, () => ev.push(t));
    const x0 = w.player.body.x;
    for (const a of expandScript([[10, 'FR'], [1, ''], [120, '']])) w.step(a);
    expect(w.player.body.x).toBe(x0); // aiming froze movement
    expect(ev).toEqual(['card:thrown', 'switch:on', 'card:returned']);
    expect(w.switchById('sw').on).toBe(true);
    expect(w.logic.value('door')).toBe(true);
    expect(w.card.throws).toBe(1);
    for (const a of expandScript([[5, 'F'], [1, ''], [100, ''], [5, 'F'], [1, ''], [100, '']])) w.step(a);
    expect(w.card.throws).toBe(3);
    expect(w.switchById('sw').on).toBe(true); // latched
  });

  it('[F] does nothing while the card is away', () => {
    const w = new LevelWorld(testMap({ width: 30 }), cardCfg());
    for (const a of expandScript([[3, 'F'], [1, ''], [3, 'F'], [1, '']])) w.step(a);
    expect(w.card.throws).toBe(1);
  });
});
