import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH, PALETTE } from '../constants';

export const GHOST_COLORS = [PALETTE.green, PALETTE.cyan, PALETTE.violet] as const;
export const HEADING_FONT = '"Press Start 2P", monospace';
export const HUD_FONT = '"VT323", monospace';

export interface HudOptions {
  level: string; // "L1 · Relay Race"
  venue: string;
  starTargetSec?: number;
  maxCommits: number;
  /** Widgets this level does not use stay hidden. */
  show: { commits: boolean; clipboard: boolean; undo: boolean; idCard: boolean };
}

export interface HudState {
  timeMs: number;
  recording: boolean;
  framesLeft: number;
  maxFrames: number;
  commits: { id: string; slot: number }[];
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

/** HUD overlay drawn in screen space (scroll factor 0). Shared by all levels. */
export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private timer: Phaser.GameObjects.Text;
  private toastBg: Phaser.GameObjects.Graphics;
  private toastText: Phaser.GameObjects.Text;
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private flashText: Phaser.GameObjects.Text;
  private flashUntil = 0;
  private result: Phaser.GameObjects.Container | null = null;
  private tick = 0;

  constructor(private scene: Phaser.Scene, private opts: HudOptions) {
    const fixed = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Depth>(o: T) =>
      o.setScrollFactor(0).setDepth(1000);
    const txt = (x: number, y: number, s: string, size: number, color: number, font = HUD_FONT) =>
      fixed(scene.add.text(x, y, s, { fontFamily: font, fontSize: `${size}px`, color: hex(color) }));

    // Dark strips behind the HUD so it reads over any background art.
    const back = fixed(scene.add.graphics());
    back.fillStyle(PALETTE.navy, 0.9).fillRect(0, 0, BASE_WIDTH, 26);
    if (opts.show.commits) back.fillStyle(PALETTE.navy, 0.85).fillRect(0, BASE_HEIGHT - 32, 96, 32).fillRect(BASE_WIDTH - 46, BASE_HEIGHT - 13, 46, 13);
    this.g = fixed(scene.add.graphics());
    txt(4, 3, opts.level, 8, PALETTE.white, HEADING_FONT);
    txt(4, 12, opts.venue, 10, PALETTE.grey);
    this.timer = txt(BASE_WIDTH / 2, 2, '0:00.00', 14, PALETTE.white).setOrigin(0.5, 0);
    if (opts.starTargetSec) {
      txt(BASE_WIDTH / 2, 15, `★ < ${formatTime(opts.starTargetSec * 1000).replace(/\.00$/, '')}`, 10, PALETTE.orange).setOrigin(0.5, 0);
    }
    if (opts.show.commits) {
      txt(4, BASE_HEIGHT - 30, 'COMMITS', 10, PALETTE.grey);
      txt(BASE_WIDTH - 4, BASE_HEIGHT - 12, '[R] Commit', 10, PALETTE.white).setOrigin(1, 0);
      for (let i = 0; i < opts.maxCommits; i++) this.slotTexts.push(txt(10 + i * 30, BASE_HEIGHT - 11, '', 9, PALETTE.white));
    }
    this.toastBg = fixed(scene.add.graphics());
    this.toastText = txt(BASE_WIDTH / 2, 30, '', 10, PALETTE.green).setOrigin(0.5, 0).setWordWrapWidth(BASE_WIDTH - 40);
    this.flashText = txt(BASE_WIDTH / 2, BASE_HEIGHT / 2 - 6, 'SEGMENTATION FAULT — respawning', 8, PALETTE.red, HEADING_FONT)
      .setOrigin(0.5)
      .setVisible(false);
  }

  update(s: HudState): void {
    this.tick++;
    this.timer.setText(formatTime(s.timeMs));
    const g = this.g;
    g.clear();
    if (this.opts.show.commits) {
      const y = BASE_HEIGHT - 16;
      g.lineStyle(1, PALETTE.grey).lineBetween(8, y, 8 + (this.opts.maxCommits - 1) * 30 + 6, y);
      for (let i = 0; i < this.opts.maxCommits; i++) {
        const c = s.commits[i];
        const x = 10 + i * 30;
        g.fillStyle(PALETTE.navy).fillCircle(x, y, 4);
        g.lineStyle(1, c ? GHOST_COLORS[c.slot % 3] : PALETTE.grey).strokeCircle(x, y, 4);
        if (c) g.fillStyle(GHOST_COLORS[c.slot % 3]).fillCircle(x, y, 2);
        this.slotTexts[i].setText(c ? c.id : '').setColor(c ? hex(GHOST_COLORS[c.slot % 3]) : '#000');
      }
      if (s.recording) {
        // Red pulse with a countdown ring for the remaining record time.
        const cx = 10 + Math.min(s.commits.length, this.opts.maxCommits - 1) * 30;
        const pulse = 0.5 + 0.5 * Math.sin(this.tick / 6);
        g.fillStyle(PALETTE.red, 0.4 + 0.6 * pulse).fillCircle(cx, y, 3);
        const frac = s.framesLeft / s.maxFrames;
        g.lineStyle(1, PALETTE.red).beginPath()
          .arc(cx, y, 7, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2, false).strokePath();
        g.fillStyle(PALETTE.red).fillCircle(BASE_WIDTH - 40, 8, 2);
      }
    }
    this.flashText.setVisible(this.tick < this.flashUntil);
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

  showResult(r: ResultView, prompt = 'ENTER  play again'): void {
    this.result?.destroy();
    const s = this.scene;
    const W = 200, H = 110, x = (BASE_WIDTH - W) / 2, y = (BASE_HEIGHT - H) / 2;
    const bg = s.add.graphics();
    bg.fillStyle(PALETTE.navy, 0.95).fillRect(x, y, W, H);
    bg.lineStyle(1, PALETTE.green).strokeRect(x + 0.5, y + 0.5, W - 1, H - 1);
    const t = (ty: number, str: string, size: number, color: number, font = HUD_FONT) =>
      s.add.text(BASE_WIDTH / 2, ty, str, { fontFamily: font, fontSize: `${size}px`, color: hex(color), align: 'center' }).setOrigin(0.5, 0);
    const items: Phaser.GameObjects.GameObject[] = [
      bg,
      t(y + 8, r.title, 8, PALETTE.green, HEADING_FONT),
      t(y + 20, 'BUILD PASSED', 10, PALETTE.grey),
      t(y + 32, formatTime(r.timeMs), 20, PALETTE.white),
      t(y + 52, r.stats.join('   '), 10, PALETTE.white),
      t(y + 66, r.star ? '★  STAR EARNED' : '☆  ' + (r.missReason ?? 'star missed'), 10, r.star ? PALETTE.orange : PALETTE.grey),
      t(y + H - 16, prompt, 10, PALETTE.grey),
    ];
    this.result = s.add.container(0, 0, items).setScrollFactor(0).setDepth(2000);
  }
}
