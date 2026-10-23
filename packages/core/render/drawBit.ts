import type Phaser from 'phaser';
import type { AnimState } from '../recorder/Recorder';

/** Bit's colours from docs/03-character-bit.md. */
export interface BitPalette {
  hoodie: number;
  hoodieShade: number;
  skin: number;
  hair: number;
  legs: number;
  shoes: number;
  lanyard: number;
  card: number;
}

export const BIT_PALETTE: BitPalette = {
  hoodie: 0xffd447,
  hoodieShade: 0xc99a1e,
  skin: 0xa86b4c,
  hair: 0x14162b,
  legs: 0x3a4170,
  shoes: 0xf2f2e9,
  lanyard: 0x3fd0ff,
  card: 0xff9f43,
};

/** While recording: a desaturated, red-shifted draft. */
export const DRAFT_PALETTE: BitPalette = {
  hoodie: 0xff8a8a,
  hoodieShade: 0xc25a64,
  skin: 0xc08a7a,
  hair: 0x4a1a24,
  legs: 0x6a3050,
  shoes: 0xe0c0c0,
  lanyard: 0xff9aa5,
  card: 0xffb0a0,
};

/** Ghosts are one flat colour. */
export function flatPalette(c: number): BitPalette {
  return { hoodie: c, hoodieShade: c, skin: c, hair: c, legs: c, shoes: c, lanyard: c, card: c };
}

export interface DrawBitOptions {
  facing: 1 | -1;
  anim: AnimState;
  tick: number;
  palette: BitPalette;
  alpha?: number;
  /** False while the ID card is thrown: the lanyard hangs empty. */
  cardInHand?: boolean;
  /** The blinking text cursor above the head (Bit only, never ghosts). */
  cursor?: boolean;
}

/** Draws the 16x24 Bit sprite around his 10x22 hitbox at (hx, hy). Placeholder until Figma art. */
export function drawBit(g: Phaser.GameObjects.Graphics, hx: number, hy: number, o: DrawBitOptions): void {
  const x = Math.round(hx) - 3;
  const y = Math.round(hy) - 2;
  const a = o.alpha ?? 1;
  const c = o.palette;
  const f = o.facing;
  const run = o.anim === 'run' ? Math.floor(o.tick / 5) % 2 : 0;
  const air = o.anim === 'jump' || o.anim === 'fall';

  // Legs + sneakers.
  g.fillStyle(c.legs, a);
  if (air) g.fillRect(x + 4, y + 17, 3, 4).fillRect(x + 9, y + 16, 3, 4);
  else g.fillRect(x + 4 + run, y + 18, 3, 5).fillRect(x + 9 - run, y + 18, 3, 5);
  g.fillStyle(c.shoes, a);
  if (air) g.fillRect(x + 4, y + 21, 3, 1).fillRect(x + 9, y + 20, 3, 1);
  else g.fillRect(x + 4 + run, y + 23, 4, 1).fillRect(x + 9 - run, y + 23, 4, 1);

  // Hoodie with slightly-too-long sleeves and a pocket row.
  g.fillStyle(c.hoodie, a).fillRect(x + 3, y + 10, 10, 9);
  g.fillRect(x + 2, y + 11, 2, air ? 5 : 8).fillRect(x + 12, y + 11, 2, air ? 5 : 8);
  g.fillStyle(c.hoodieShade, a).fillRect(x + 5, y + 16, 6, 1);

  // Head: skin, messy hair with a tuft, two 1-px eyes on the facing side.
  g.fillStyle(c.skin, a).fillRect(x + 4, y + 1, 8, 9);
  g.fillStyle(c.hair, a).fillRect(x + 4, y + 0, 8, 3).fillRect(f > 0 ? x + 4 : x + 11, y + 3, 1, 2);
  g.fillRect(f > 0 ? x + 9 : x + 6, y - 1, 1, 1);
  g.fillRect(f > 0 ? x + 8 : x + 6, y + 5, 1, 1).fillRect(f > 0 ? x + 10 : x + 8, y + 5, 1, 1);

  // Lanyard + ID card on the chest (empty while thrown).
  g.fillStyle(c.lanyard, a).fillRect(x + 6, y + 10, 1, 3).fillRect(x + 9, y + 10, 1, 3);
  if (o.cardInHand ?? true) {
    g.fillStyle(c.card, a).fillRect(x + 6, y + 13, 4, 3);
    g.fillStyle(c.shoes, a).fillRect(x + 7, y + 14, 1, 1);
  }

  // Blinking cursor caret above the head.
  if (o.cursor && Math.floor(o.tick / 30) % 2 === 0) {
    g.fillStyle(c.lanyard, 0.35 * a).fillRect(x + 7, y - 7, 3, 5);
    g.fillStyle(c.shoes, a).fillRect(x + 8, y - 6, 1, 3);
  }
}
