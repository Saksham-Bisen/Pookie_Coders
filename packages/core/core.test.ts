import { describe, expect, it, vi } from 'vitest';
import { Bug } from './entities/Bug';
import { Button } from './entities/Button';
import { Gate } from './entities/Gate';
import { EventBus, type PixaEvents } from './events';
import { GhostManager } from './ghosts/GhostManager';
import { action } from './input/ActionFrame';
import type { LevelConfig } from './level/LevelConfig';
import { LogicGraph } from './logic/LogicGraph';
import { parseTiledMap, type TiledMapJson } from './map/TiledMap';
import { submitRun } from './net/runs';
import { createBody } from './physics/Body';
import { Collider } from './physics/Collider';
import { Recorder, type Commit } from './recorder/Recorder';
import { LevelWorld } from './world/LevelWorld';

/** 20x6 flat test map: floor on row 5. */
function flatMap(extraObjects: object[] = []) {
  const W = 20, H = 6;
  const data = new Array(W * H).fill(0);
  for (let x = 0; x < W; x++) data[5 * W + x] = 1;
  const json = {
    width: W, height: H, tilewidth: 16, tileheight: 16,
    layers: [
      { name: 'solid', type: 'tilelayer', width: W, height: H, data, properties: [{ name: 'collision', type: 'bool', value: true }] },
      { name: 'objects', type: 'objectgroup', objects: [
        { id: 1, name: 'spawn', type: 'spawn', x: 24, y: 80, width: 0, height: 0, point: true },
        { id: 2, name: 'exit', type: 'exit', x: 288, y: 48, width: 16, height: 32 },
        ...extraObjects,
      ] },
    ],
  } as TiledMapJson;
  return parseTiledMap(json);
}

const cfg = (over: Partial<LevelConfig> = {}): LevelConfig => ({
  id: 'T', name: 'Test', venue: 'Test', map: '',
  mechanics: { commit: true, clipboard: false, undo: false, idCard: false },
  limits: { maxGhosts: 3, recordSeconds: 10, clipboardLimit: 0, undoLimit: 0 },
  logic: [], star: { type: 'time', value: 30 }, next: null, ...over,
});

const fakeCommit = (id: string, n = 3): Commit => ({
  id, startX: 0, startY: 0, createdAt: 0,
  frames: Array.from({ length: n }, (_, i) => ({ x: i, y: 0, facing: 1 as const, anim: 'idle' as const, actions: 0 })),
});

describe('Recorder', () => {
  it('caps at maxFrames and reports full', () => {
    const r = new Recorder(600);
    r.begin(5, 6);
    let full = false, n = 0;
    while (!full) { full = r.push(n, 0, 1, 'idle', action()); n++; }
    expect(n).toBe(600);
    const c = r.end(0)!;
    expect(c.frames.length).toBe(600);
    expect(c.id).toMatch(/^[0-9a-f]{6}$/);
    expect(c.startX).toBe(5);
  });

  it('auto-commits at 10 s in the world and snaps Bit back', () => {
    const w = new LevelWorld(flatMap(), cfg());
    const ends: PixaEvents['commit:end'][] = [];
    w.bus.on('commit:end', (e) => ends.push(e));
    const startX = w.player.body.x;
    w.step(action({ commit: true }));
    for (let i = 0; i < 700 && ends.length === 0; i++) w.step(action({ right: i < 60 }));
    expect(ends[0].frames).toBe(600);
    expect(w.player.body.x).toBe(startX);
    expect(w.player.draft).toBe(false);
  });
});

describe('GhostManager', () => {
  it('keeps max 3 and drops the oldest with an event', () => {
    const dropped: string[] = [];
    const gm = new GhostManager(3, { onDropped: (g) => dropped.push(g.id) });
    ['aaaaaa', 'bbbbbb', 'cccccc', 'dddddd'].forEach((id) => gm.add(fakeCommit(id)));
    expect(gm.ghosts.map((g) => g.id)).toEqual(['bbbbbb', 'cccccc', 'dddddd']);
    expect(dropped).toEqual(['aaaaaa']);
  });

  it('world emits ghost:dropped on the 4th commit', () => {
    const w = new LevelWorld(flatMap(), cfg());
    const dropped: string[] = [];
    w.bus.on('ghost:dropped', (e) => dropped.push(e.id));
    for (let i = 0; i < 4; i++) {
      w.step(action({ commit: true }));
      for (let f = 0; f < 10; f++) w.step(action({ right: true }));
      w.step(action({ commit: true }));
      w.step(action());
    }
    expect(w.ghosts.ghosts.length).toBe(3);
    expect(dropped.length).toBe(1);
  });

  it('ghost loops and flags the seam', () => {
    const gm = new GhostManager();
    const g = gm.add(fakeCommit('abcdef', 3));
    gm.step(); gm.step();
    expect(g.index).toBe(2);
    gm.step();
    expect(g.index).toBe(0);
    expect(g.wrapped).toBe(true);
  });

  it('Bit can stand on a ghost from above but walks through it sideways', () => {
    const w = new LevelWorld(flatMap(), cfg());
    // Ghost stands still at x=100 for its whole loop.
    const gy = 80 - 22;
    w.ghosts.add({ id: 'abcdef', startX: 100, startY: gy, createdAt: 0,
      frames: Array.from({ length: 30 }, () => ({ x: 100, y: gy, facing: 1 as const, anim: 'idle' as const, actions: 0 })) });
    for (let i = 0; i < 80; i++) w.step(action({ right: true }));
    expect(w.player.body.x).toBeGreaterThan(110); // walked through
    // Drop Bit onto the ghost from above.
    w.player.teleport(100, 10);
    for (let i = 0; i < 40; i++) w.step(action());
    expect(w.player.body.y + w.player.body.h).toBeCloseTo(gy, 5);
  });
});

describe('Button + seam rule', () => {
  it('stays pressed when the ghost wraps from last to first frame on the plate', () => {
    const sensor = { x: 0, y: 18, w: 16, h: 4 };
    const b = new Button('b', sensor);
    const gm = new GhostManager();
    gm.add({ id: 'abcdef', startX: 2, startY: 0, createdAt: 0,
      frames: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 0 }].map((f) => ({ ...f, facing: 1 as const, anim: 'idle' as const, actions: 0 })) });
    const changes: (string | null)[] = [];
    for (let i = 0; i < 10; i++) { gm.step(); changes.push(b.update([], gm.ghosts)); }
    expect(changes.filter(Boolean)).toEqual(['down']);
  });
});

describe('Gate', () => {
  it('takes 0.3 s to open and pushes Bit back while closing', () => {
    const map = flatMap();
    const col = new Collider(map);
    const gate = new Gate('g', { x: 160, y: 48, w: 16, h: 32 });
    col.dynamics.push(gate);
    gate.setPowered(true);
    for (let i = 0; i < 17; i++) gate.update([], col);
    expect(gate.isOpen).toBe(false);
    gate.update([], col);
    expect(gate.isOpen).toBe(true);
    const bit = createBody(163, 58, 10, 22); // standing in the doorway, centre left of gate centre
    gate.setPowered(false);
    for (let i = 0; i < 18; i++) gate.update([bit], col);
    expect(gate.isClosed).toBe(true);
    expect(bit.x + bit.w).toBeLessThanOrEqual(160);
    expect(bit.y).toBe(58); // pushed sideways, never crushed
  });

  it('blocks movement when closed', () => {
    const col = new Collider(flatMap());
    const gate = new Gate('g', { x: 160, y: 48, w: 16, h: 32 });
    col.dynamics.push(gate);
    const bit = createBody(140, 58, 10, 22);
    for (let i = 0; i < 20; i++) col.moveX(bit, 2);
    expect(bit.x).toBe(150);
  });
});

describe('Bug', () => {
  it('patrols between bounds and turns around', () => {
    const col = new Collider(flatMap());
    const bug = new Bug(32, 80, { minX: 32, maxX: 64, speed: 30 });
    const xs: number[] = [];
    for (let i = 0; i < 200; i++) { bug.update(col); xs.push(bug.x); }
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(32);
    expect(Math.max(...xs) + bug.w).toBeLessThanOrEqual(64);
    expect(bug.dir).toBeDefined();
    expect(new Set(xs.map((x, i) => Math.sign(x - (xs[i - 1] ?? x)))).has(-1)).toBe(true);
  });

  it('stomp squashes; splits: true spawns 2 small bugs', () => {
    expect(new Bug(0, 80, { minX: 0, maxX: 100 }).stomp()).toEqual([]);
    const kids = new Bug(0, 80, { minX: 0, maxX: 100, splits: true }).stomp();
    expect(kids.length).toBe(2);
    expect(kids.every((k) => k.w === 8 && !k.opts.splits)).toBe(true);
  });

  it('in the world: stomp bounces Bit, side contact kills', () => {
    const bugObj = { id: 9, name: 'bug_1', type: 'bug', x: 96, y: 68, width: 16, height: 12,
      properties: [{ name: 'minTileX', value: 6 }, { name: 'maxTileX', value: 6 }, { name: 'speed', value: 0 }] };
    const w = new LevelWorld(flatMap([bugObj]), cfg());
    const bus = w.bus as EventBus<PixaEvents>;
    const stomped = vi.fn();
    bus.on('bug:stomped', stomped);
    w.player.teleport(99, 20);
    for (let i = 0; i < 20 && !stomped.mock.calls.length; i++) w.step(action());
    expect(stomped).toHaveBeenCalledOnce();
    expect(w.player.body.vy).toBeLessThan(0);

    const w2 = new LevelWorld(flatMap([bugObj]), cfg());
    for (let i = 0; i < 120; i++) w2.step(action({ right: true }));
    expect(w2.deaths).toBeGreaterThanOrEqual(1);
  });
});

describe('LogicGraph', () => {
  it('evaluates AND / OR / NOT', () => {
    const g = new LogicGraph([
      { id: 'a', type: 'button' }, { id: 'b', type: 'button' },
      { id: 'and', type: 'AND', in: ['a', 'b'] }, { id: 'or', type: 'OR', in: ['a', 'b'] },
      { id: 'not', type: 'NOT', in: ['a'] }, { id: 'door', type: 'door', in: 'and' },
    ]);
    g.setInput('a', true);
    g.evaluate();
    expect([g.value('and'), g.value('or'), g.value('not'), g.value('door')]).toEqual([false, true, false, false]);
    g.setInput('b', true);
    g.evaluate();
    expect(g.value('door')).toBe(true);
  });

  it('rejects unknown wires', () => {
    expect(() => new LogicGraph([{ id: 'd', type: 'gate', in: 'nope' }])).toThrow();
  });
});

describe('submitRun', () => {
  const result = { levelId: 'L1', timeMs: 12000, ghostsUsed: 1, deaths: 0, star: true };
  const mem = () => { const s = new Map<string, string>(); return { getItem: (k: string) => s.get(k) ?? null, setItem: (k: string, v: string) => void s.set(k, v) }; };

  it('queues in storage when the backend is down, then flushes', async () => {
    const storage = mem();
    const down = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await submitRun(result, { baseUrl: 'http://x', fetch: down, storage })).toBe('queued');
    expect(JSON.parse(storage.getItem('pixa.pendingRuns')!)).toHaveLength(1);
    const up = vi.fn().mockResolvedValue({ ok: true });
    expect(await submitRun(result, { baseUrl: 'http://x', fetch: up, storage })).toBe('sent');
    expect(up).toHaveBeenCalledTimes(2);
    expect(JSON.parse(up.mock.calls[0][1].body)).toMatchObject({ levelId: 'L1', star: 1 });
    expect(JSON.parse(storage.getItem('pixa.pendingRuns')!)).toHaveLength(0);
  });
});
