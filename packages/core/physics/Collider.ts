import type { LevelMap } from '../map/TiledMap';
import type { Body } from './Body';
import { overlaps, type Rect } from './Rect';

/** Something Bit can stand on from above but walk through sideways (ghosts). */
export interface OneWayPlatform {
  rect: Rect;
  ref: unknown;
}

/** A solid that can come and go (gates). `tag` lets drafts/ghosts skip e.g. firewalls. */
export interface DynamicSolid {
  tag: string;
  rect(): Rect | null;
}

export interface MoveResult {
  hitX: boolean;
  hitY: boolean;
  landedOn: unknown; // the platform ref Bit landed on, or 'ground'
}

/**
 * Deterministic AABB collision against the tile grid and dynamic solids.
 * X then Y, one axis at a time. Out of bounds counts as solid so nothing leaves the map.
 */
export class Collider {
  readonly dynamics: DynamicSolid[] = [];

  constructor(private map: LevelMap) {}

  get widthTiles(): number {
    return this.map.width;
  }
  get heightTiles(): number {
    return this.map.height;
  }

  isSolidTile(tx: number, ty: number): boolean {
    const { width, height } = this.map;
    if (tx < 0 || tx >= width || ty < 0 || ty >= height) return true;
    return this.map.solid[ty * width + tx] === 1;
  }

  /** All solid rects touching r. `ignoreTags` skips dynamic solids (e.g. 'firewall' for drafts). */
  solidsIn(r: Rect, ignoreTags: readonly string[] = []): Rect[] {
    const ts = this.map.tileSize;
    const out: Rect[] = [];
    const x0 = Math.floor(r.x / ts);
    const x1 = Math.floor((r.x + r.w - 1e-6) / ts);
    const y0 = Math.floor(r.y / ts);
    const y1 = Math.floor((r.y + r.h - 1e-6) / ts);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++)
        if (this.isSolidTile(tx, ty)) out.push({ x: tx * ts, y: ty * ts, w: ts, h: ts });
    for (const d of this.dynamics) {
      if (ignoreTags.includes(d.tag)) continue;
      const dr = d.rect();
      if (dr && overlaps(dr, r)) out.push(dr);
    }
    return out;
  }

  hitsSolid(r: Rect, ignoreTags: readonly string[] = []): boolean {
    return this.solidsIn(r, ignoreTags).length > 0;
  }

  moveX(body: Body, dx: number, ignoreTags: readonly string[] = []): boolean {
    if (dx === 0) return false;
    body.x += dx;
    const hits = this.solidsIn(body, ignoreTags);
    if (hits.length === 0) return false;
    if (dx > 0) body.x = Math.min(...hits.map((h) => h.x)) - body.w;
    else body.x = Math.max(...hits.map((h) => h.x + h.w));
    body.vx = 0;
    return true;
  }

  moveY(body: Body, dy: number, platforms: OneWayPlatform[] = [], ignoreTags: readonly string[] = []): MoveResult {
    const res: MoveResult = { hitX: false, hitY: false, landedOn: null };
    body.grounded = false;
    if (dy === 0) {
      // Still check whether we're resting on something.
      const probe = { x: body.x, y: body.y + body.h, w: body.w, h: 0.01 };
      if (this.hitsSolid(probe, ignoreTags)) {
        body.grounded = true;
        res.landedOn = 'ground';
      }
      return res;
    }
    const prevBottom = body.y + body.h;
    body.y += dy;
    const hits = this.solidsIn(body, ignoreTags);
    if (hits.length > 0) {
      res.hitY = true;
      if (dy > 0) {
        body.y = Math.min(...hits.map((h) => h.y)) - body.h;
        body.grounded = true;
        res.landedOn = 'ground';
      } else {
        body.y = Math.max(...hits.map((h) => h.y + h.h));
      }
      body.vy = 0;
    }
    if (dy > 0) {
      for (const p of platforms) {
        const top = p.rect.y;
        const xOverlap = body.x < p.rect.x + p.rect.w && body.x + body.w > p.rect.x;
        if (xOverlap && prevBottom <= top + 0.001 && body.y + body.h > top) {
          body.y = top - body.h;
          body.vy = 0;
          body.grounded = true;
          res.hitY = true;
          res.landedOn = p.ref;
        }
      }
    }
    return res;
  }
}
