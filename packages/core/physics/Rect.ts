export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Strict overlap: touching edges do not count. */
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function rect(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h };
}
