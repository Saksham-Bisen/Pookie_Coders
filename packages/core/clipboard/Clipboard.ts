import type { Collider, DynamicSolid } from '../physics/Collider';
import { overlaps, type Rect } from '../physics/Rect';

/** A copyable object (bench, crate, platform…): solid and standable. */
export class Copyable implements DynamicSolid {
  readonly tag = 'copyable';

  constructor(readonly id: string, readonly kind: string, readonly area: Rect, readonly pasted = false) {}

  rect(): Rect {
    return this.area;
  }
}

export interface ClipItem {
  kind: string;
  w: number;
  h: number;
}

export interface PastePreview {
  rect: Rect;
  valid: boolean;
}

/** Most tiles a preview may sit from Bit (horizontally, edge to edge, and as a drop). */
const MAX_TILES = 3;

/**
 * One-slot clipboard. [C] copies a touched copyable; [V] starts placing a preview in front of
 * Bit, [V] again pastes it there (if valid and under the level limit), [ESC] cancels.
 */
export class Clipboard {
  item: ClipItem | null = null;
  placing = false;
  pastesUsed = 0;
  readonly objects: Copyable[] = [];
  private pasteCount = 0;

  constructor(private collider: Collider, readonly limit: number, private tile = 16) {}

  get pastesLeft(): number {
    return Math.max(0, this.limit - this.pastesUsed);
  }

  add(obj: Copyable): void {
    this.objects.push(obj);
    this.collider.dynamics.push(obj);
  }

  /** Copies the first copyable Bit touches (standing on it counts). */
  tryCopy(body: Rect): Copyable | null {
    const touch = { x: body.x - 1, y: body.y - 1, w: body.w + 2, h: body.h + 2 };
    const hit = this.objects.find((o) => overlaps(touch, o.area));
    if (!hit) return null;
    this.item = { kind: hit.kind, w: hit.area.w, h: hit.area.h };
    this.placing = false;
    return hit;
  }

  /** Enters placement mode. Returns false if there is nothing to paste or no pastes left. */
  startPlacing(): boolean {
    if (!this.item || this.pastesLeft === 0) return false;
    this.placing = true;
    return true;
  }

  cancel(): void {
    this.placing = false;
  }

  /** Where the item would land: the tiles just in front of Bit, dropped onto the ground. */
  preview(body: Rect, facing: 1 | -1, blockers: readonly Rect[]): PastePreview | null {
    if (!this.item) return null;
    const ts = this.tile;
    const { w, h } = this.item;
    const wT = Math.round(w / ts);
    const tx = facing > 0 ? Math.ceil((body.x + body.w) / ts - 1e-6) : Math.floor(body.x / ts + 1e-6) - wT;
    const feetRow = Math.floor((body.y + body.h - 0.01) / ts);
    let r: Rect = { x: tx * ts, y: (feetRow + 1) * ts - h, w, h };
    const onGround = (q: Rect) => this.collider.hitsSolid({ x: q.x, y: q.y + q.h, w: q.w, h: 0.5 });
    for (let drop = 0; drop < MAX_TILES && !onGround(r) && r.y + h < this.collider.heightTiles * ts; drop++) {
      r = { ...r, y: r.y + ts };
    }
    const inMap = r.x >= 0 && r.x + w <= this.collider.widthTiles * ts && r.y >= 0;
    const valid =
      inMap &&
      onGround(r) &&
      !this.collider.hitsSolid(r) &&
      !blockers.some((b) => overlaps(b, r));
    return { rect: r, valid };
  }

  /** Pastes at `p` if valid. Returns the new object or null. */
  paste(p: PastePreview | null): Copyable | null {
    if (!this.placing || !this.item || !p || !p.valid || this.pastesLeft === 0) return null;
    const obj = new Copyable(`paste_${++this.pasteCount}`, this.item.kind, { ...p.rect }, true);
    this.add(obj);
    this.pastesUsed++;
    this.placing = false;
    return obj;
  }
}
