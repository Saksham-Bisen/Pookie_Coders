import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH, PALETTE } from '../constants';

export const GHOST_COLORS = [PALETTE.green, PALETTE.cyan, PALETTE.violet] as const;
export const HEADING_FONT = '"Press Start 2P", monospace';
export const HUD_FONT = '"VT323", monospace';

export interface HudOptions {
  level: string; // "L1 · Relay Race"
  venue: string;
  /** Star target chip, e.g. "★ < 0:30" or "★ 1 card throw". */
  starChip?: string;
  /** Key hint chips, e.g. "[R] Commit". Bottom right, or top right when `slim` (may hold a \n). */
  keyHints?: string;
  /**
   * Single-screen levels: the bottom HUD is one 14-px row so it only covers the floor tiles,
   * and the key hints move to the top bar.
   */
  slim?: boolean;
  maxCommits: number;
  /** Widgets this level does not use stay hidden. */
  show: { commits: boolean; clipboard: boolean; undo: boolean; idCard: boolean };
}

export type CardStatus = 'hand' | 'out' | 'back' | 'stuck' | 'lost';

export interface HudState {
  timeMs: number;
  recording: boolean;
  framesLeft: number;
  maxFrames: number;
  commits: { id: string; slot: number }[];
  clipboard?: { item: string | null; pastesLeft: number; placing: boolean };
  card?: CardStatus;
}

export interface ResultView {
  title: string;
  timeMs: number;
  stats: string[];
  star: boolean;
  missReason?: string;
}

export function formatTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

const CARD_TEXT: Record<CardStatus, [string, number]> = {
  hand: ['ID CARD: IN HAND', PALETTE.green],
  out: ['ID CARD: THROWN', PALETTE.orange],
  back: ['ID CARD: THROWN', PALETTE.orange],
  stuck: ['ID CARD: STUCK', PALETTE.orange],
  lost: ['ID CARD: LOST', PALETTE.red],
};

/** HUD overlay drawn in screen space (scroll factor 0). Shared by all levels. */
export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private timer: Phaser.GameObjects.Text;
  private toastBg: Phaser.GameObjects.Graphics;
  private toastText: Phaser.GameObjects.Text;
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private clipText?: Phaser.GameObjects.Text;
  private cardText?: Phaser.GameObjects.Text;
  private flashText: Phaser.GameObjects.Text;
  private flashUntil = 0;
  private result: Phaser.GameObjects.Container | null = null;
  private pause: Phaser.GameObjects.Container | null = null;
  private tick = 0;
  private clipX = 108;

  constructor(private scene: Phaser.Scene, private opts: HudOptions) {
    const fixed = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Depth>(o: T) =>
      o.setScrollFactor(0).setDepth(1000);
    const txt = (x: number, y: number, s: string, size: number, color: number, font = HUD_FONT) =>
      fixed(scene.add.text(x, y, s, { fontFamily: font, fontSize: `${size}px`, color: hex(color) }));
    const show = opts.show;

    const slim = !!opts.slim;
    this.clipX = slim ? 118 : 108;

    // Dark strips behind the HUD so it reads over any background art.
    const back = fixed(scene.add.graphics());
    back.fillStyle(PALETTE.navy, 0.9).fillRect(0, 0, BASE_WIDTH, 26);
    if (slim) back.fillStyle(PALETTE.navy, 0.85).fillRect(0, BASE_HEIGHT - 14, BASE_WIDTH, 14);
    else {
      if (show.commits) back.fillStyle(PALETTE.navy, 0.85).fillRect(0, BASE_HEIGHT - 32, 96, 32);
      if (show.clipboard) back.fillStyle(PALETTE.navy, 0.85).fillRect(104, BASE_HEIGHT - 14, 76, 14);
    }

    this.g = fixed(scene.add.graphics());
    txt(4, 3, opts.level, 8, PALETTE.white, HEADING_FONT);
    txt(4, 12, opts.venue, 10, PALETTE.grey);
    this.timer = txt(BASE_WIDTH / 2, 2, '0:00.00', 14, PALETTE.white).setOrigin(0.5, 0);
    if (opts.starChip) txt(BASE_WIDTH / 2, 15, opts.starChip, 10, PALETTE.orange).setOrigin(0.5, 0);
    if (show.commits) {
      if (!slim) txt(4, BASE_HEIGHT - 30, 'COMMITS', 10, PALETTE.grey);
      for (let i = 0; i < opts.maxCommits; i++) {
        this.slotTexts.push(slim ? txt(14 + i * 36, BASE_HEIGHT - 12, '', 9, PALETTE.white) : txt(10 + i * 30, BASE_HEIGHT - 11, '', 9, PALETTE.white));
      }
    }
    let hints: Phaser.GameObjects.Text | null = null;
    if (opts.keyHints) {
      hints = slim
        ? txt(BASE_WIDTH - 4, 2, opts.keyHints, 10, PALETTE.white).setOrigin(1, 0).setLineSpacing(-3).setAlign('right')
        : txt(BASE_WIDTH - 4, BASE_HEIGHT - 12, opts.keyHints, 10, PALETTE.white).setOrigin(1, 0);
    }
    if (show.idCard) this.cardText = txt(BASE_WIDTH - 4, BASE_HEIGHT - 12 - (opts.keyHints && !slim ? 11 : 0), '', 10, PALETTE.green).setOrigin(1, 0);
    if (show.clipboard) this.clipText = txt(this.clipX + 16, BASE_HEIGHT - 12, '', 10, PALETTE.white);
    // Backing for the bottom-right stack, sized to the key hints (ID card status fits in 80 px).
    const rightRows = slim ? 0 : (opts.keyHints ? 1 : 0) + (show.idCard ? 1 : 0);
    if (rightRows) {
      const w = Math.max(hints?.width ?? 0, show.idCard ? 80 : 0) + 8;
      back.fillStyle(PALETTE.navy, 0.85).fillRect(BASE_WIDTH - w, BASE_HEIGHT - 2 - rightRows * 11, w, 2 + rightRows * 11);
    }
    this.toastBg = fixed(scene.add.graphics());
    this.toastText = txt(BASE_WIDTH / 2, 30, '', 10, PALETTE.green).setOrigin(0.5, 0).setWordWrapWidth(BASE_WIDTH - 40);
    this.flashText = txt(BASE_WIDTH / 2, BASE_HEIGHT / 2 - 6, 'SEGMENTATION FAULT — respawning', 8, PALETTE.red, HEADING_FONT)
      .setOrigin(0.5)
      .setVisible(false);
  }

  get paused(): boolean {
    return this.pause !== null;
  }

  update(s: HudState): void {
    this.tick++;
    this.timer.setText(formatTime(s.timeMs));
    const g = this.g;
    g.clear();
    if (this.opts.show.commits) this.drawCommits(s);
    if (this.clipText && s.clipboard) {
      const c = s.clipboard;
      this.clipText.setText(c.item ? `Ctrl+V x${c.pastesLeft}${c.placing ? '  placing' : ''}` : 'CLIPBOARD empty');
      this.clipText.setColor(hex(c.item && c.pastesLeft > 0 ? PALETTE.white : PALETTE.grey));
      // Item icon: a tiny bench.
      const ix = this.clipX, iy = BASE_HEIGHT - 9;
      if (c.item) {
        g.fillStyle(PALETTE.orange).fillRect(ix, iy, 12, 3).fillRect(ix + 1, iy + 3, 1, 3).fillRect(ix + 10, iy + 3, 1, 3);
      } else {
        g.lineStyle(1, PALETTE.grey).strokeRect(ix + 0.5, iy - 1.5, 11, 7);
      }
    }
    if (this.cardText && s.card) {
      const [text, color] = CARD_TEXT[s.card];
      this.cardText.setText(text).setColor(hex(color));
    }
    this.flashText.setVisible(this.tick < this.flashUntil);
  }

  private drawCommits(s: HudState): void {
    const g = this.g;
    const slim = !!this.opts.slim;
    const y = slim ? BASE_HEIGHT - 7 : BASE_HEIGHT - 16;
    const slotX = (i: number) => (slim ? 8 + i * 36 : 10 + i * 30);
    g.lineStyle(1, PALETTE.grey).lineBetween(slotX(0) - 2, y, slotX(this.opts.maxCommits - 1) + 4, y);
    for (let i = 0; i < this.opts.maxCommits; i++) {
      const c = s.commits[i];
      const x = slotX(i);
      const col = c ? GHOST_COLORS[c.slot % 3] : PALETTE.grey;
      g.fillStyle(PALETTE.navy).fillCircle(x, y, 4);
      g.lineStyle(1, col).strokeCircle(x, y, 4);
      if (c) g.fillStyle(col).fillCircle(x, y, 2);
      this.slotTexts[i].setText(c ? c.id : '').setColor(c ? hex(col) : '#000000');
    }
    if (s.recording) {
      // Red pulse with a countdown ring for the remaining record time.
      const cx = slotX(Math.min(s.commits.length, this.opts.maxCommits - 1));
      const pulse = 0.5 + 0.5 * Math.sin(this.tick / 6);
      g.fillStyle(PALETTE.red, 0.4 + 0.6 * pulse).fillCircle(cx, y, 3);
      const frac = s.framesLeft / s.maxFrames;
      g.lineStyle(1, PALETTE.red).beginPath().arc(cx, y, slim ? 6 : 7, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2, false).strokePath();
      g.fillStyle(PALETTE.red).fillCircle(BASE_WIDTH / 2 + 34, 9, 2); // REC dot beside the timer
    }
  }

  setToast(text: string | null): void {
    this.toastBg.clear();
    if (!text) {
      this.toastText.setText('');
      return;
    }
    if (this.toastText.text !== text) this.toastText.setText(text);
    const b = this.toastText.getBounds();
    this.toastBg.fillStyle(0x000000, 0.92).fillRect(b.x - 4, b.y - 2, b.width + 8, b.height + 4);
    this.toastBg.lineStyle(1, PALETTE.green, 0.6).strokeRect(b.x - 4, b.y - 2, b.width + 8, b.height + 4);
  }

  flashDeath(frames = 60): void {
    this.flashUntil = this.tick + frames;
  }

  private panel(w: number, h: number, border: number, lines: [string, number, number, string?][]): Phaser.GameObjects.Container {
    const s = this.scene;
    const x = (BASE_WIDTH - w) / 2, y = (BASE_HEIGHT - h) / 2;
    const bg = s.add.graphics();
    bg.fillStyle(PALETTE.navy, 0.95).fillRect(x, y, w, h);
    bg.lineStyle(1, border).strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const items: Phaser.GameObjects.GameObject[] = [bg];
    for (const [str, dy, size, colorFont] of lines) {
      const [color, font] = (colorFont ?? `${PALETTE.white}|${HUD_FONT}`).split('|');
      items.push(
        s.add.text(BASE_WIDTH / 2, y + dy, str, { fontFamily: font, fontSize: `${size}px`, color: hex(Number(color)), align: 'center' }).setOrigin(0.5, 0),
      );
    }
    return s.add.container(0, 0, items).setScrollFactor(0).setDepth(2000);
  }

  showResult(r: ResultView, prompt = 'ENTER  play again'): void {
    this.result?.destroy();
    const c = (color: number, font = HUD_FONT) => `${color}|${font}`;
    this.result = this.panel(200, 110, PALETTE.green, [
      [r.title, 8, 8, c(PALETTE.green, HEADING_FONT)],
      ['BUILD PASSED', 20, 10, c(PALETTE.grey)],
      [formatTime(r.timeMs), 32, 20, c(PALETTE.white)],
      [r.stats.join('   '), 52, 10, c(PALETTE.white)],
      [r.star ? '★  STAR EARNED' : '☆  ' + (r.missReason ?? 'star missed'), 66, 10, c(r.star ? PALETTE.orange : PALETTE.grey)],
      [prompt, 94, 10, c(PALETTE.grey)],
    ]);
  }

  /** Toggles the pause panel. Returns true when now paused. */
  togglePause(): boolean {
    if (this.pause) {
      this.pause.destroy();
      this.pause = null;
      return false;
    }
    const c = (color: number, font = HUD_FONT) => `${color}|${font}`;
    this.pause = this.panel(160, 56, PALETTE.cyan, [
      ['PAUSED', 10, 8, c(PALETTE.cyan, HEADING_FONT)],
      ['[ESC] resume', 26, 10, c(PALETTE.white)],
      ['[ENTER] restart', 38, 10, c(PALETTE.white)],
    ]);
    return true;
  }
}
