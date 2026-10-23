/** Minimal loader for Tiled JSON (orthogonal, uncompressed CSV/array tile data). */

export interface TiledProperty {
  name: string;
  type?: string;
  value: unknown;
}

interface TiledObjectJson {
  id: number;
  name: string;
  type?: string;
  class?: string; // Tiled >= 1.9 calls `type` `class`
  x: number;
  y: number;
  width: number;
  height: number;
  point?: boolean;
  polyline?: { x: number; y: number }[];
  properties?: TiledProperty[];
}

interface TiledLayerJson {
  name: string;
  type: 'tilelayer' | 'objectgroup' | string;
  width?: number;
  height?: number;
  data?: number[];
  objects?: TiledObjectJson[];
  properties?: TiledProperty[];
  visible?: boolean;
}

export interface TiledMapJson {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayerJson[];
  properties?: TiledProperty[];
}

export interface MapObject {
  id: number;
  name: string;
  type: string;
  layer: string;
  x: number;
  y: number;
  w: number;
  h: number;
  point: boolean;
  /** Absolute points for polyline objects (wires), else undefined. */
  points?: { x: number; y: number }[];
  props: Record<string, unknown>;
}

export interface TileLayer {
  name: string;
  data: number[];
  collision: boolean;
}

export interface LevelMap {
  width: number;
  height: number;
  tileSize: number;
  pixelWidth: number;
  pixelHeight: number;
  /** 1 where a tile is solid. Row-major, width*height. */
  solid: Uint8Array;
  tileLayers: TileLayer[];
  objects: MapObject[];
  props: Record<string, unknown>;
}

function propsOf(list?: TiledProperty[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const p of list ?? []) out[p.name] = p.value;
  return out;
}

/** Tiled GIDs carry flip flags in the top 3 bits. */
const GID_MASK = 0x1fffffff;

export function parseTiledMap(json: TiledMapJson): LevelMap {
  if (json.tilewidth !== json.tileheight) throw new Error('Pixa maps need square tiles');
  const { width, height } = json;
  const solid = new Uint8Array(width * height);
  const tileLayers: TileLayer[] = [];
  const objects: MapObject[] = [];

  for (const layer of json.layers) {
    const lp = propsOf(layer.properties);
    if (layer.type === 'tilelayer') {
      const data = (layer.data ?? []).map((g) => g & GID_MASK);
      if (data.length !== width * height) throw new Error(`Layer "${layer.name}" has wrong size`);
      const collision = lp.collision === true;
      if (collision) data.forEach((g, i) => g && (solid[i] = 1));
      tileLayers.push({ name: layer.name, data, collision });
    } else if (layer.type === 'objectgroup') {
      for (const o of layer.objects ?? []) {
        objects.push({
          id: o.id,
          name: o.name,
          type: o.type || o.class || '',
          layer: layer.name,
          x: o.x,
          y: o.y,
          w: o.width,
          h: o.height,
          point: !!o.point,
          points: o.polyline?.map((p) => ({ x: o.x + p.x, y: o.y + p.y })),
          props: propsOf(o.properties),
        });
      }
    }
  }

  return {
    width,
    height,
    tileSize: json.tilewidth,
    pixelWidth: width * json.tilewidth,
    pixelHeight: height * json.tileheight,
    solid,
    tileLayers,
    objects,
    props: propsOf(json.properties),
  };
}

export function findObject(map: LevelMap, name: string): MapObject {
  const o = map.objects.find((m) => m.name === name);
  if (!o) throw new Error(`Map object "${name}" not found`);
  return o;
}

export function objectsOfType(map: LevelMap, type: string): MapObject[] {
  return map.objects.filter((m) => m.type === type);
}
