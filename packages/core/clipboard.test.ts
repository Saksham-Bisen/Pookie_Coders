import { describe, expect, it } from 'vitest';
import { Clipboard, Copyable } from './clipboard/Clipboard';
import type { PixaEvents } from './events';
import { expandScript } from './input/ActionFrame';
import { Collider } from './physics/Collider';
import { testConfig, testMap, obj } from './testing/testMaps';
import { LevelWorld } from './world/LevelWorld';

const bench = () => new Copyable('bench_1', 'bench', { x: 96, y: 64, w: 32, h: 16 });
const body = (x: number, feet = 80) => ({ x, y: feet - 22, w: 10, h: 22 });

describe('Clipboard', () => {
  it('copies only a copyable Bit touches (standing on it counts)', () => {
    const cb = new Clipboard(new Collider(testMap()), 2);
    cb.add(bench());
    expect(cb.tryCopy(body(40))).toBeNull();
    expect(cb.tryCopy(body(86))?.id).toBe('bench_1'); // touching its left side
    expect(cb.item).toEqual({ kind: 'bench', w: 32, h: 16 });
    const cb2 = new Clipboard(new Collider(testMap()), 2);
    cb2.add(bench());
    expect(cb2.tryCopy(body(100, 64))).not.toBeNull(); // standing on top
  });

  it('previews in front of Bit, snapped to tiles, green when clear', () => {
    const cb = new Clipboard(new Collider(testMap()), 2);
    cb.add(bench());
    cb.tryCopy(body(86));
    const right = cb.preview(body(20), 1, [])!;
    expect(right.rect).toEqual({ x: 32, y: 64, w: 32, h: 16 });
    expect(right.valid).toBe(true);
    const left = cb.preview(body(70), -1, [])!;
    expect(left.rect.x).toBe(32);
  });

  it('preview is red when it overlaps a solid, Bit/ghosts, or would float', () => {
    const col = new Collider(testMap({ solids: [[2, 4]] }));
    const cb = new Clipboard(col, 2);
    cb.add(bench());
    cb.tryCopy(body(86));
    expect(cb.preview(body(20), 1, [])!.valid).toBe(false); // tile in the way
    const cb2 = new Clipboard(new Collider(testMap()), 2);
    cb2.add(bench());
    cb2.tryCopy(body(86));
    expect(cb2.preview(body(20), 1, [{ x: 40, y: 60, w: 10, h: 20 }])!.valid).toBe(false); // a ghost there
    // Standing on a 5-tile pillar: the preview can drop at most 3 tiles, so it floats.
    const tall = testMap({ height: 10, solids: [0, 1].flatMap((x) => [5, 6, 7, 8].map((y) => [x, y] as [number, number])) });
    const cb3 = new Clipboard(new Collider(tall), 2);
    cb3.item = { kind: 'bench', w: 32, h: 16 };
    expect(cb3.preview(body(22), 1, [])!.valid).toBe(false); // Bit at the pillar edge
  });

  it('enforces the paste limit', () => {
    const cb = new Clipboard(new Collider(testMap({ width: 30 })), 2);
    cb.add(bench());
    cb.tryCopy(body(86));
    for (const x of [140, 220]) {
      expect(cb.startPlacing()).toBe(true);
      expect(cb.paste(cb.preview(body(x), 1, []))).not.toBeNull();
    }
    expect(cb.pastesUsed).toBe(2);
    expect(cb.startPlacing()).toBe(false);
  });

  it('in the world: [C] copy, [V][V] paste; the copy is solid, standable and presses buttons', () => {
    const map = testMap({ objects: [
      obj('copyable', 'bench_1', 96, 64, 32, 16, { kind: 'bench' }),
      obj('button', 'b', 48, 76, 16, 4),
    ] });
    const w = new LevelWorld(map, testConfig({
      mechanics: { commit: true, clipboard: true, undo: false, idCard: false },
      limits: { maxGhosts: 3, recordSeconds: 10, clipboardLimit: 2, undoLimit: 0 },
      logic: [{ id: 'b', type: 'button' }],
    }));
    const events: string[] = [];
    const on = (t: keyof PixaEvents) => w.bus.on(t, () => events.push(t));
    on('clipboard:copy'); on('clipboard:paste'); on('button:down');
    w.player.teleport(86, 58);
    for (const a of expandScript([[1, 'K'], [1, '']])) w.step(a);
    w.player.teleport(20, 58);
    w.player.facing = 1;
    for (const a of expandScript([[1, 'V'], [1, ''], [1, 'V'], [2, '']])) w.step(a);
    expect(events).toEqual(['clipboard:copy', 'clipboard:paste', 'button:down']);
    const pasted = w.clipboard.objects.find((o) => o.pasted)!;
    expect(pasted.area).toEqual({ x: 32, y: 64, w: 32, h: 16 });
    expect(w.collider.hitsSolid(pasted.area)).toBe(true);
    w.player.teleport(40, 0); // drop onto it
    for (let i = 0; i < 60; i++) w.step(expandScript([[1, '']])[0]);
    expect(w.player.body.y + w.player.body.h).toBe(64);
  });

  it('[ESC] cancels placement', () => {
    const map = testMap({ objects: [obj('copyable', 'bench_1', 96, 64, 32, 16, { kind: 'bench' })] });
    const w = new LevelWorld(map, testConfig({
      mechanics: { commit: true, clipboard: true, undo: false, idCard: false },
      limits: { maxGhosts: 3, recordSeconds: 10, clipboardLimit: 2, undoLimit: 0 },
    }));
    w.player.teleport(86, 58);
    for (const a of expandScript([[1, 'K'], [1, ''], [1, 'V'], [1, '']])) w.step(a);
    expect(w.pastePreview).not.toBeNull();
    for (const a of expandScript([[1, 'Q'], [1, '']])) w.step(a);
    expect(w.clipboard.placing).toBe(false);
    expect(w.pastePreview).toBeNull();
  });
});
