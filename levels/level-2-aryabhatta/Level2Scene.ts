import Phaser from 'phaser';
import type { Copyable } from '@pixa/core/clipboard/Clipboard';
import { BASE_HEIGHT, PALETTE, PLAYER_W } from '@pixa/core/constants';
import { GHOST_COLORS, Hud, HUD_FONT } from '@pixa/core/hud/Hud';
import { KeyboardInput } from '@pixa/core/input/KeyboardInput';
import { WireRenderer } from '@pixa/core/logic/WireRenderer';
import type { MapObject } from '@pixa/core/map/TiledMap';
import { defaultApiUrl, submitRun } from '@pixa/core/net/runs';
import type { Rect } from '@pixa/core/physics/Rect';
import { BIT_PALETTE, drawBit, DRAFT_PALETTE, flatPalette } from '@pixa/core/render/drawBit';
import { FixedStepper } from '@pixa/core/scene/FixedStepper';
import type { LevelWorld } from '@pixa/core/world/LevelWorld';
import { createLevel2World } from './createWorld';
import { Level2Hints } from './hints';
import config from './level.config';

/** Placeholder pixel art until the Figma sprite sheets land in assets/. */
const C = {
  ...PALETTE,
  wallCream: 0xefe4c8,
  wainscot: 0xd9c9a3,
  wallTile: 0xc7b28a,
  wallTileDark: 0xa8936c,
  floor: 0x8e8a7c,
  floorLine: 0x74705f,
  wood: 0x7a4e2d,
  woodLight: 0x9c6b3a,
  woodDark: 0x5a3820,
  board: 0x2f5d3a,
  boardFrame: 0x6b4226,
  chalk: 0xe8efe0,
  glass: 0xbfe3f2,
  cork: 0xb5835a,
  sun: 0xfff1b0,
};

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

export class Level2Scene extends Phaser.Scene {
  private world!: LevelWorld;
  private hints!: Level2Hints;
  private input2!: KeyboardInput;
  private hud!: Hud;
  private wires!: WireRenderer;
  private dyn!: Phaser.GameObjects.Graphics;
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private stepper!: FixedStepper;
  private anim = 0;

  constructor() {
    super('L2');
  }

  create(): void {
    this.labels.clear();
    this.anim = 0;
    this.world = createLevel2World();
    this.hints = new Level2Hints(this.world);
    this.input2 = new KeyboardInput(this);
    this.stepper = new FixedStepper(() => {
      this.world.step(this.input2.read());
      if (!this.world.finished) this.hints.update();
      this.anim++;
    });
    const map = this.world.map;

    // Single screen: the 176-px-tall room sits centred in the 180-px view.
    this.cameras.main.setBackgroundColor(C.navy).setScroll(0, -(BASE_HEIGHT - map.pixelHeight) / 2);
    this.drawRoom();
    for (const o of map.objects.filter((m) => m.layer === 'decor_objects')) this.drawDecor(o);
    this.drawTiles();
    this.wires = new WireRenderer(this, map, this.world.logic, 3);
    const carving = this.world.object('bench_2').props.carving;
    if (carving) {
      const b = this.world.object('bench_2');
      this.add.text(b.x + b.w / 2, b.y + 6, String(carving), { fontFamily: HUD_FONT, fontSize: '6px', color: hex(C.woodDark) }).setOrigin(0.5).setDepth(9);
    }
    this.dyn = this.add.graphics().setDepth(8);

    this.hud = new Hud(this, {
      level: `${config.id} · ${config.name}`,
      venue: config.venue,
      starChip: config.star.type === 'maxCardThrows' ? `★ ${config.star.value} card throw` : undefined,
      keyHints: '[R]Commit [C]Copy\n[V]Paste [F]Throw',
      slim: true,
      maxCommits: config.limits.maxGhosts,
      show: { commits: true, clipboard: true, undo: false, idCard: true },
    });

    const bus = this.world.bus;
    bus.on('player:died', () => this.hud.flashDeath());
    bus.on('level:complete', (r) => {
      this.hud.setToast(null);
      const throws = r.cardThrows ?? 0;
      const hasNext = !!(config.next && this.scene.get(config.next));
      this.hud.showResult(
        {
          title: 'CLASS DISMISSED',
          timeMs: r.timeMs,
          stats: [`pastes ${r.pastesUsed ?? 0}`, `ghosts ${r.ghostsUsed}`, `card throws ${throws}`],
          star: r.star,
          missReason: `ID card used ${throws} times — star needs 1`,
        },
        hasNext ? 'ENTER again   N next level' : 'ENTER  play again',
      );
      void submitRun(r, { baseUrl: defaultApiUrl() });
    });

    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', () => (this.world.finished || this.hud.paused) && this.scene.restart());
    kb.on('keydown-N', () => this.world.finished && config.next && this.scene.get(config.next) && this.scene.start(config.next));
    // ESC cancels paste placement first; otherwise it pauses.
    kb.on('keydown-ESC', () => !this.world.finished && !this.world.clipboard.placing && this.hud.togglePause());
  }

  update(_time: number, delta: number): void {
    if (!this.hud.paused) this.stepper.advance(delta);
    this.render();
  }

  // ---------------------------------------------------------------- per frame

  private render(): void {
    const w = this.world;
    const g = this.dyn.clear();
    this.wires.draw(this.anim);

    // Ceiling fans (2-frame spin).
    for (const f of w.map.objects.filter((m) => m.type === 'fan')) {
      const spin = Math.floor(this.anim / 4) % 2;
      g.fillStyle(C.grey).fillRect(f.x + f.w / 2 - 1, f.y - 2, 2, 3);
      g.fillStyle(C.woodDark);
      if (spin) g.fillRect(f.x, f.y + 1, f.w, 2);
      else g.fillRect(f.x + 6, f.y, f.w - 12, 4);
      g.fillStyle(C.grey).fillRect(f.x + f.w / 2 - 2, f.y, 4, 3);
    }

    // Door: dark doorway, wooden door sliding up as it opens.
    const door = w.gate('classroom_door');
    const da = door.area;
    g.fillStyle(0x2a1f2a).fillRect(da.x, da.y, da.w, da.h);
    const dr = door.rect();
    if (dr) {
      g.fillStyle(C.wood).fillRect(dr.x, dr.y, dr.w, dr.h);
      g.fillStyle(C.woodDark).fillRect(dr.x + 2, dr.y + 2, dr.w - 4, 1).fillRect(dr.x + 2, dr.y + dr.h / 2, dr.w - 4, 1);
      g.fillStyle(C.orange).fillRect(dr.x + dr.w - 4, dr.y + dr.h - 14, 2, 2);
    }

    // Turnstile with a card reader.
    for (const t of w.turnstiles) {
      const a = t.area;
      g.fillStyle(C.grey).fillRect(a.x + 7, a.y + 6, 3, a.h - 6);
      g.fillStyle(0x3a3d52).fillRect(a.x + 3, a.y, 11, 7);
      g.fillStyle(t.open ? C.green : C.red).fillRect(a.x + 5, a.y + 2, 3, 2);
      g.fillStyle(C.white).fillRect(a.x + 10, a.y + 2, 2, 3);
      g.fillStyle(0xc8cbd8);
      if (t.open) g.fillRect(a.x + 8, a.y + 10, 2, 14);
      else g.fillRect(a.x, a.y + 12, a.w, 2).fillRect(a.x, a.y + 18, a.w, 2);
    }

    // Board switch (bright orange, latches on).
    for (const s of w.switches) {
      const r = s.rect;
      g.fillStyle(C.orange).fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      g.fillStyle(C.woodDark).fillRect(r.x + 6, r.y + 5, 4, 6);
      g.fillStyle(s.on ? C.green : C.red).fillRect(r.x + 7, s.on ? r.y + 4 : r.y + 8, 2, 3);
    }

    // Buttons.
    for (const b of w.buttons) {
      const s = b.sensor;
      g.fillStyle(C.grey).fillRect(s.x, s.y + s.h - 1, s.w, 1);
      g.fillStyle(b.pressed ? C.green : C.orange).fillRect(s.x + 2, b.pressed ? s.y + 2 : s.y, s.w - 4, b.pressed ? 2 : 4);
    }

    // Benches (pasted copies get the dotted "copied" outline).
    for (const o of w.clipboard.objects) this.drawBench(g, o);

    // Paste preview: green = valid, red = invalid.
    const pv = w.pastePreview;
    if (pv) {
      const col = pv.valid ? C.green : C.red;
      g.fillStyle(col, 0.25).fillRect(pv.rect.x, pv.rect.y, pv.rect.w, pv.rect.h);
      this.dotted(g, pv.rect, col);
    }

    // Ghosts with their commit hashes.
    const live = new Set<string>();
    for (const gh of w.ghosts.ghosts) {
      const f = gh.frame;
      const color = GHOST_COLORS[gh.slot % 3];
      drawBit(g, f.x, f.y, { facing: f.facing, anim: f.anim, tick: this.anim, palette: flatPalette(color), alpha: 0.5 });
      live.add(gh.id);
      let label = this.labels.get(gh.id);
      if (!label) {
        label = this.add.text(0, 0, gh.id, { fontFamily: HUD_FONT, fontSize: '8px', color: hex(color) }).setOrigin(0.5, 1).setDepth(11);
        this.labels.set(gh.id, label);
      }
      label.setPosition(Math.round(f.x + PLAYER_W / 2), Math.round(f.y - 4));
    }
    for (const [id, t] of this.labels) if (!live.has(id)) (t.destroy(), this.labels.delete(id));

    // Bit.
    const pl = w.player;
    const p = pl.body;
    drawBit(g, p.x, p.y, {
      facing: pl.facing, anim: pl.anim, tick: this.anim,
      palette: pl.draft ? DRAFT_PALETTE : BIT_PALETTE, cursor: !pl.draft, cardInHand: w.card.inHand,
    });
    if (pl.draft && Math.floor(this.anim / 15) % 2 === 0) g.fillStyle(C.red).fillCircle(p.x + PLAYER_W + 3, p.y - 1, 2);

    // Aim arrow while [F] is held.
    if (w.aim) {
      const len = Math.hypot(w.aim.dx, w.aim.dy);
      const ux = w.aim.dx / len, uy = w.aim.dy / len;
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      g.fillStyle(C.white);
      for (let d = 8; d < 30; d += 3) g.fillRect(Math.round(cx + ux * d), Math.round(cy + uy * d), 1, 1);
      const tx = cx + ux * 34, ty = cy + uy * 34;
      g.fillStyle(C.orange).fillTriangle(
        tx + ux * 4, ty + uy * 4,
        tx - uy * 3, ty + ux * 3,
        tx + uy * 3, ty - ux * 3,
      );
    }

    // ID card: spinning in flight, flat when stuck, red-edged when lost.
    const card = w.card;
    if (!card.inHand) {
      const widths = [6, 4, 2, 4];
      const cw = card.flying ? widths[Math.floor(card.age / 3) % 4] : 6;
      const x = Math.round(card.x + (6 - cw) / 2), y = Math.round(card.y + 1);
      if (card.state === 'lost') g.fillStyle(C.red).fillRect(x - 1, y - 1, cw + 2, 6);
      g.fillStyle(C.orange).fillRect(x, y, cw, 4);
      if (cw >= 4) g.fillStyle(C.white).fillRect(x + 1, y + 1, 1, 1);
    }

    this.hud.update({
      timeMs: w.timeMs,
      recording: w.recorder.recording,
      framesLeft: w.recorder.framesLeft,
      maxFrames: w.recorder.maxFrames,
      commits: w.ghosts.ghosts.map((x) => ({ id: x.id, slot: x.slot })),
      clipboard: { item: w.clipboard.item?.kind ?? null, pastesLeft: w.clipboard.pastesLeft, placing: w.clipboard.placing },
      card: card.state,
    });
    if (!w.finished) this.hud.setToast(this.hints.current?.text ?? null);
  }

  private drawBench(g: Phaser.GameObjects.Graphics, o: Copyable): void {
    const { x, y, w, h } = o.area;
    g.fillStyle(C.woodLight).fillRect(x, y, w, 4);
    g.fillStyle(C.wood).fillRect(x + 1, y + 4, w - 2, 4);
    g.fillStyle(C.woodDark).fillRect(x + 2, y + 8, 3, h - 8).fillRect(x + w - 5, y + 8, 3, h - 8);
    if (o.pasted) this.dotted(g, o.area, C.cyan);
  }

  /** 1-px dotted outline (copied / paste-preview style). */
  private dotted(g: Phaser.GameObjects.Graphics, r: Rect, color: number): void {
    g.fillStyle(color);
    for (let i = 0; i < r.w; i += 2) g.fillRect(r.x + i, r.y, 1, 1).fillRect(r.x + i, r.y + r.h - 1, 1, 1);
    for (let i = 0; i < r.h; i += 2) g.fillRect(r.x, r.y + i, 1, 1).fillRect(r.x + r.w - 1, r.y + i, 1, 1);
  }

  // ----------------------------------------------------------------- static

  private drawRoom(): void {
    const map = this.world.map;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(C.wallCream).fillRect(0, 0, map.pixelWidth, map.pixelHeight);
    g.fillStyle(C.wainscot).fillRect(0, 128, map.pixelWidth, 32);
    g.fillStyle(C.wallTileDark).fillRect(0, 127, map.pixelWidth, 1);
  }

  private drawDecor(o: MapObject): void {
    const g = this.add.graphics().setDepth(1);
    const label = (text: string, x: number, y: number, size: number, color: number) =>
      this.add.text(x, y, text, { fontFamily: HUD_FONT, fontSize: `${size}px`, color: hex(color) }).setOrigin(0.5).setDepth(2);
    switch (o.type) {
      case 'blackboard': {
        g.fillStyle(C.boardFrame).fillRect(o.x - 2, o.y - 2, o.w + 4, o.h + 4);
        g.fillStyle(C.board).fillRect(o.x, o.y, o.w, o.h);
        g.fillStyle(C.boardFrame).fillRect(o.x, o.y + o.h, o.w, 2); // chalk ledge
        // Doodles: a binary tree, "x = x + 1" and an AND truth table.
        g.lineStyle(1, C.chalk, 0.7);
        const n = [[16, 6], [8, 14], [24, 14], [4, 22], [12, 22], [20, 22]];
        for (const [a, b] of [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]]) g.lineBetween(o.x + n[a][0], o.y + n[a][1], o.x + n[b][0], o.y + n[b][1]);
        g.fillStyle(C.chalk, 0.9);
        for (const [x, y] of n) g.fillCircle(o.x + x, o.y + y, 1.5);
        label('x = x + 1', o.x + 22, o.y + 40, 8, C.chalk).setAlpha(0.85);
        label('A B|A·B\n0 0| 0\n0 1| 0\n1 0| 0\n1 1| 1', o.x + 48, o.y + 18, 6, C.chalk).setAlpha(0.8);
        break;
      }
      case 'window': {
        g.fillStyle(C.white).fillRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2);
        g.fillStyle(C.glass).fillRect(o.x, o.y, o.w, o.h);
        g.fillStyle(C.white).fillRect(o.x + o.w / 2, o.y, 1, o.h).fillRect(o.x, o.y + o.h / 2, o.w, 1);
        // Morning light falling to the floor.
        g.fillStyle(C.sun, 0.12).fillPoints(
          [{ x: o.x, y: o.y + o.h }, { x: o.x + o.w, y: o.y + o.h }, { x: o.x + o.w - 30, y: 160 }, { x: o.x - 30, y: 160 }],
          true,
        );
        break;
      }
      case 'tube_light':
        g.fillStyle(C.sun, 0.25).fillRect(o.x - 2, o.y - 1, o.w + 4, o.h + 3);
        g.fillStyle(C.white).fillRect(o.x, o.y, o.w, o.h);
        break;
      case 'clock': {
        const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
        g.fillStyle(C.woodDark).fillCircle(cx, cy, o.w / 2 + 1);
        g.fillStyle(C.white).fillCircle(cx, cy, o.w / 2);
        g.lineStyle(1, C.navy).lineBetween(cx, cy, cx, cy - 4).lineBetween(cx, cy, cx + 3, cy + 1);
        break;
      }
      case 'notice_board':
        g.fillStyle(C.woodDark).fillRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2);
        g.fillStyle(C.cork).fillRect(o.x, o.y, o.w, o.h);
        g.fillStyle(C.white).fillRect(o.x + 2, o.y + 3, 7, 9).fillRect(o.x + 11, o.y + 5, 7, 6);
        g.fillStyle(0xffd447).fillRect(o.x + 4, o.y + 15, 10, 8);
        g.fillStyle(C.red).fillRect(o.x + 5, o.y + 3, 1, 1).fillRect(o.x + 14, o.y + 5, 1, 1);
        break;
      case 'poster':
        g.fillStyle(C.white).fillRect(o.x, o.y, o.w, o.h);
        g.lineStyle(1, C.red).strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
        label(String(o.props.text ?? ''), o.x + o.w / 2, o.y + o.h / 2, 8, 0x9e2a36);
        break;
      case 'register':
        g.fillStyle(0x2b4a8a).fillRect(o.x, o.y, o.w, o.h);
        g.fillStyle(C.white).fillRect(o.x + 1, o.y + 1, o.w - 2, 1);
        break;
      case 'chalk_box':
        g.fillStyle(C.white).fillRect(o.x, o.y, o.w, o.h);
        g.fillStyle(C.cyan).fillRect(o.x + 1, o.y - 1, 1, 1).fillRect(o.x + 4, o.y - 1, 1, 1);
        break;
    }
  }

  private drawTiles(): void {
    const map = this.world.map;
    const ts = map.tileSize;
    const g = this.add.graphics().setDepth(2);
    for (const layer of map.tileLayers) {
      layer.data.forEach((gid, i) => {
        if (!gid) return;
        const x = (i % map.width) * ts, y = Math.floor(i / map.width) * ts;
        switch (gid) {
          case 1: // floor
            g.fillStyle(C.floor).fillRect(x, y, ts, ts);
            g.fillStyle(C.floorLine).fillRect(x, y, ts, 1).fillRect(x + ts - 1, y, 1, ts);
            break;
          case 2: // wall / ceiling
            g.fillStyle(C.wallTile).fillRect(x, y, ts, ts);
            g.fillStyle(C.wallTileDark).fillRect(x, y + ts - 1, ts, 1).fillRect(x + ts - 1, y, 1, ts);
            break;
          case 3: { // teacher desk
            const top = !map.solid[i - map.width] || layer.data[i - map.width] !== 3;
            g.fillStyle(C.wood).fillRect(x, y, ts, ts);
            if (top) g.fillStyle(C.woodLight).fillRect(x, y, ts, 3);
            g.fillStyle(C.woodDark).fillRect(x + 2, y + (top ? 5 : 2), ts - 4, 1);
            break;
          }
        }
      });
    }
  }
}
