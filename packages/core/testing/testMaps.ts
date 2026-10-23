import type { LevelConfig } from '../level/LevelConfig';
import { parseTiledMap, type TiledMapJson } from '../map/TiledMap';

export interface TestMapOptions {
  width?: number;
  height?: number;
  /** Extra solid tiles as [x, y]. */
  solids?: [number, number][];
  objects?: object[];
  spawn?: { x: number; y: number };
}

/** Flat test map: floor on the bottom row, spawn near the left, exit at the far right. */
export function testMap(opts: TestMapOptions = {}) {
  const W = opts.width ?? 20, H = opts.height ?? 6;
  const data = new Array(W * H).fill(0);
  for (let x = 0; x < W; x++) data[(H - 1) * W + x] = 1;
  for (const [x, y] of opts.solids ?? []) data[y * W + x] = 1;
  const spawn = opts.spawn ?? { x: 24, y: (H - 1) * 16 };
  const json = {
    width: W, height: H, tilewidth: 16, tileheight: 16,
    layers: [
      { name: 'solid', type: 'tilelayer', width: W, height: H, data, properties: [{ name: 'collision', type: 'bool', value: true }] },
      { name: 'objects', type: 'objectgroup', objects: [
        { id: 1, name: 'spawn', type: 'spawn', x: spawn.x, y: spawn.y, width: 0, height: 0, point: true },
        { id: 2, name: 'exit', type: 'exit', x: (W - 2) * 16, y: (H - 3) * 16, width: 16, height: 32 },
        ...(opts.objects ?? []),
      ] },
    ],
  } as TiledMapJson;
  return parseTiledMap(json);
}

export const testConfig = (over: Partial<LevelConfig> = {}): LevelConfig => ({
  id: 'T', name: 'Test', venue: 'Test', map: '',
  mechanics: { commit: true, clipboard: false, undo: false, idCard: false },
  limits: { maxGhosts: 3, recordSeconds: 10, clipboardLimit: 0, undoLimit: 0 },
  logic: [], star: { type: 'time', value: 30 }, next: null, ...over,
});

let nextId = 100;
/** Tiled object helper: obj('button', 'b1', x, y, w, h, { prop: value }). */
export function obj(type: string, name: string, x: number, y: number, w: number, h: number, props: Record<string, unknown> = {}) {
  return {
    id: nextId++, name, type, x, y, width: w, height: h,
    properties: Object.entries(props).map(([n, value]) => ({ name: n, value })),
  };
}
