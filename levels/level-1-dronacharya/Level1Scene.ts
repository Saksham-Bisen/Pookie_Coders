import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH, PALETTE, PLAYER_W } from '@pixa/core/constants';
import { GHOST_COLORS, HEADING_FONT, Hud, HUD_FONT } from '@pixa/core/hud/Hud';
import { KeyboardInput } from '@pixa/core/input/KeyboardInput';
import type { MapObject } from '@pixa/core/map/TiledMap';
import { defaultApiUrl, submitRun } from '@pixa/core/net/runs';
import { BIT_PALETTE, drawBit, DRAFT_PALETTE, flatPalette } from '@pixa/core/render/drawBit';
import { FixedStepper } from '@pixa/core/scene/FixedStepper';
import type { LevelWorld } from '@pixa/core/world/LevelWorld';
import { createLevel1World } from './createWorld';
import { Level1Hints } from './hints';
import config from './level.config';

/** Placeholder pixel art until the Figma sprite sheets land in assets/. */
const C = {
  ...PALETTE,
  track: 0xc8423a,
  trackHi: 0xe86a5a,
  grass: 0x3b7d3a,
  grassDark: 0x2c5e2b,
  wall: 0x8a5a44,
  wallDark: 0x6a4434,
  concrete: 0x8c8fa3,
  concreteDark: 0x5d6075,
  skin: 0xe0a070,
};


export class Level1Scene extends Phaser.Scene {
  private world!: LevelWorld;
  private hints!: Level1Hints;
  private input2!: KeyboardInput;
  private hud!: Hud;
  private dyn!: Phaser.GameObjects.Graphics;
  private crowd!: Phaser.GameObjects.Graphics;
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private stepper!: FixedStepper;
  private anim = 0;

  constructor() {
    super('L1');
  }

  create(): void {
    this.labels.clear();
    this.world = createLevel1World();
    this.hints = new Level1Hints(this.world);
    this.input2 = new KeyboardInput(this);
    // Fixed 60 fps timestep so ghosts replay exactly on every laptop.
    this.stepper = new FixedStepper(() => {
      this.world.step(this.input2.read());
      if (!this.world.finished) this.hints.update();
      this.anim++;
    });
    const map = this.world.map;

    this.cameras.main.setBounds(0, 0, map.pixelWidth, map.pixelHeight).setBackgroundColor(C.navy);
    this.drawBackdrop();
    for (const o of map.objects.filter((m) => m.layer === 'decor_objects')) this.drawDecor(o);
    this.crowd = this.add.graphics();
    this.drawTiles();
    this.dyn = this.add.graphics().setDepth(10);

    this.hud = new Hud(this, {
      level: `${config.id} · ${config.name}`,
      venue: config.venue,
      starChip: config.star.type === 'time' ? `★ < 0:${config.star.value}` : undefined,
      keyHints: '[R] Commit',
      maxCommits: config.limits.maxGhosts,
      show: { commits: config.mechanics.commit, clipboard: false, undo: false, idCard: false },
    });

    const bus = this.world.bus;
    bus.on('player:died', () => this.hud.flashDeath());
    bus.on('level:complete', (r) => {
      this.hud.setToast(null);
      this.hud.showResult({
        title: 'RELAY COMPLETE',
        timeMs: r.timeMs,
        stats: [`ghosts ${r.ghostsUsed}`, `deaths ${r.deaths}`],
        star: r.star,
        missReason: `Run under 0:${config.star.type === 'time' ? config.star.value : 30} for the star`,
      }, config.next ? 'ENTER again   N next level' : 'ENTER  play again');
      void submitRun(r, { baseUrl: defaultApiUrl() });
    });

    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', () => (this.world.finished || this.hud.paused) && this.scene.restart());
    kb.on('keydown-N', () => this.world.finished && config.next && this.scene.get(config.next) && this.scene.start(config.next));
    kb.on('keydown-ESC', () => !this.world.finished && this.hud.togglePause());
  }

  update(_time: number, delta: number): void {
    if (!this.hud.paused) this.stepper.advance(delta);
    this.render();
  }

  // ---------------------------------------------------------------- per frame

  private render(): void {
    const w = this.world;
    const g = this.dyn.clear();
    const p = w.player.body;

    // Camera follows Bit horizontally, clamped; vertically pinned to the track.
    const cam = this.cameras.main;
    cam.scrollX = Phaser.Math.Clamp(Math.round(p.x + p.w / 2 - BASE_WIDTH / 2), 0, w.map.pixelWidth - BASE_WIDTH);
    cam.scrollY = w.map.pixelHeight - BASE_HEIGHT;

    if (this.anim % 30 === 0 || this.crowd.commandBuffer.length === 0) this.drawCrowd();

    // Wire: button -> gate along the track edge, glows when powered.
    const btn = w.button('start_button');
    const gate = w.gate('sports_gate');
    const wireY = btn.sensor.y + btn.sensor.h + 2;
    const powered = w.logic.value('start_button');
    if (powered) g.lineStyle(3, C.cyan, 0.25).lineBetween(btn.sensor.x + 16, wireY, gate.area.x, wireY);
    g.lineStyle(1, powered ? C.cyan : C.grey).lineBetween(btn.sensor.x + 16, wireY, gate.area.x, wireY);

    // Button plate.
    const s = btn.sensor;
    g.fillStyle(C.grey).fillRect(s.x, s.y + s.h - 1, s.w, 1);
    g.fillStyle(btn.pressed ? C.green : C.orange).fillRect(s.x + 2, btn.pressed ? s.y + 2 : s.y, s.w - 4, btn.pressed ? 2 : 4);

    // Gate: posts + chain-link bar retracting upward + lock light.
    const a = gate.area;
    g.fillStyle(C.concreteDark).fillRect(a.x - 1, a.y, 1, a.h).fillRect(a.x + a.w, a.y, 1, a.h);
    const r = gate.rect();
    if (r) {
      g.fillStyle(C.grey, 0.9).fillRect(r.x, r.y, r.w, r.h);
      g.lineStyle(1, C.white, 0.5);
      for (let i = -r.h; i < r.w; i += 4) {
        g.lineBetween(r.x + Math.max(0, i), r.y + Math.max(0, -i), r.x + Math.min(r.w, i + r.h), r.y + Math.min(r.h, r.w - i));
      }
      g.fillStyle(C.concreteDark).fillRect(r.x, r.y + r.h - 2, r.w, 2);
    }
    g.fillStyle(gate.isOpen ? C.green : C.red).fillRect(a.x + 5, a.y - 5, 6, 3);

    // Bugs.
    for (const b of w.bugs) {
      if (b.state === 'squashed') {
        g.fillStyle(C.red).fillRect(b.x, b.y + b.h - 3, b.w, 3);
        continue;
      }
      if (b.state !== 'walk') continue;
      const step = Math.floor(this.anim / 8) % 2;
      g.fillStyle(0x1a0d10).fillRect(b.x + 2, b.y + b.h - 2, 2, 2).fillRect(b.x + b.w - 4, b.y + b.h - 2, 2, 2);
      g.fillStyle(0x1a0d10).fillRect(b.x + (step ? 6 : 8), b.y + b.h - 2, 2, 2);
      g.fillStyle(C.red).fillRect(b.x + 1, b.y + 2, b.w - 2, b.h - 4).fillRect(b.x + 3, b.y, b.w - 6, 2);
      g.fillStyle(0x9e2a36).fillRect(b.x + b.w / 2, b.y + 1, 1, b.h - 4);
      const ex = b.dir > 0 ? b.x + b.w - 4 : b.x + 2;
      g.fillStyle(C.white).fillRect(ex, b.y + 3, 2, 2);
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
        label = this.add.text(0, 0, gh.id, { fontFamily: HUD_FONT, fontSize: '8px', color: '#' + color.toString(16) }).setOrigin(0.5, 1).setDepth(11);
        this.labels.set(gh.id, label);
      }
      label.setPosition(Math.round(f.x + PLAYER_W / 2), Math.round(f.y - 4));
    }
    for (const [id, t] of this.labels) if (!live.has(id)) (t.destroy(), this.labels.delete(id));

    // Bit (tinted with a REC dot while he is a draft).
    const pl = w.player;
    const draft = pl.draft;
    drawBit(g, p.x, p.y, { facing: pl.facing, anim: pl.anim, tick: this.anim, palette: draft ? DRAFT_PALETTE : BIT_PALETTE, cursor: !draft });
    if (draft && Math.floor(this.anim / 15) % 2 === 0) g.fillStyle(C.red).fillCircle(p.x + PLAYER_W + 3, p.y - 1, 2);

    this.hud.update({
      timeMs: w.timeMs,
      recording: w.recorder.recording,
      framesLeft: w.recorder.framesLeft,
      maxFrames: w.recorder.maxFrames,
      commits: w.ghosts.ghosts.map((x) => ({ id: x.id, slot: x.slot })),
    });
    if (!w.finished) this.hud.setToast(this.hints.current?.text ?? null);
  }

  // ----------------------------------------------------------------- static

  private drawBackdrop(): void {
    // Late-afternoon sky with dithered bands (screen-fixed).
    const sky = this.add.graphics().setScrollFactor(0);
    const bands = [0x4a2c6e, 0x7a3c7e, 0xc0507e, 0xff6f91, 0xff9f43, 0xffc36b];
    const bh = 22;
    bands.forEach((col, i) => {
      sky.fillStyle(col).fillRect(0, i * bh, BASE_WIDTH, bh);
      if (i + 1 < bands.length) {
        sky.fillStyle(bands[i + 1]);
        for (let x = 0; x < BASE_WIDTH; x += 2) sky.fillRect(x + ((i % 2) as number), i * bh + bh - 2, 1, 1);
      }
    });
    sky.fillStyle(0xfff0c0).fillCircle(250, 100, 10);

    const mapW = this.world.map.pixelWidth;
    const top = this.world.map.pixelHeight - BASE_HEIGHT;
    // Distant college building silhouette.
    const far = this.add.graphics().setScrollFactor(0.2, 1);
    far.fillStyle(0x3a2550);
    for (let x = 0; x < BASE_WIDTH + mapW * 0.2; x += 70) {
      far.fillRect(x, top + 80, 50, 60).fillRect(x + 18, top + 66, 14, 14);
      far.fillStyle(0x5a3a70);
      for (let wx = 4; wx < 46; wx += 8) far.fillRect(x + wx, top + 90, 3, 4).fillRect(x + wx, top + 102, 3, 4);
      far.fillStyle(0x3a2550);
    }
    // Trees and a water tank.
    const mid = this.add.graphics().setScrollFactor(0.5, 1);
    for (let x = 0; x < BASE_WIDTH + mapW * 0.5; x += 38) {
      mid.fillStyle(0x23452c).fillCircle(x + 10, top + 120, 12).fillCircle(x + 22, top + 116, 10);
      mid.fillStyle(0x3a2a20).fillRect(x + 14, top + 124, 3, 20);
    }
    mid.fillStyle(0x5d6075).fillRect(200, top + 84, 26, 18).fillRect(205, top + 102, 3, 40).fillRect(218, top + 102, 3, 40);
  }

  private drawDecor(o: MapObject): void {
    const g = this.add.graphics();
    const label = (text: string, x: number, y: number, size: number, color: number, font = HUD_FONT) =>
      this.add.text(x, y, text, { fontFamily: font, fontSize: `${size}px`, color: '#' + color.toString(16).padStart(6, '0') }).setOrigin(0.5);
    switch (o.type) {
      case 'stands': {
        const tiers = 4, th = o.h / tiers;
        for (let i = 0; i < tiers; i++) {
          const inset = (tiers - 1 - i) * 6;
          g.fillStyle(i % 2 ? C.concrete : C.concreteDark).fillRect(o.x + inset, o.y + i * th, o.w - inset * 2, th);
        }
        break;
      }
      case 'scoreboard':
        g.fillStyle(C.concreteDark).fillRect(o.x + o.w / 2 - 2, o.y + o.h, 4, 120);
        g.fillStyle(0x0d0f22).fillRect(o.x, o.y, o.w, o.h);
        g.lineStyle(1, C.orange).strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
        label(String(o.props.text ?? 'BIT vs BUGS'), o.x + o.w / 2, o.y + o.h / 2 - 6, 12, C.green);
        label('03 : 00', o.x + o.w / 2, o.y + o.h / 2 + 8, 10, C.orange);
        break;
      case 'banner':
        g.fillStyle(C.orange).fillRect(o.x, o.y, o.w, o.h);
        label(String(o.props.text ?? ''), o.x + o.w / 2, o.y + o.h / 2, 5, C.navy, HEADING_FONT);
        break;
      case 'floodlight':
        g.fillStyle(C.concreteDark).fillRect(o.x + 7, o.y + 6, 2, o.h - 6);
        g.fillStyle(C.grey).fillRect(o.x, o.y, o.w, 7);
        g.fillStyle(0xfff6d0);
        for (let i = 0; i < 4; i++) g.fillRect(o.x + 1 + i * 4, o.y + 1, 2, 2).fillRect(o.x + 1 + i * 4, o.y + 4, 2, 2);
        g.fillStyle(0xfff6d0, 0.08).fillTriangle(o.x, o.y + 7, o.x + o.w, o.y + 7, o.x + o.w / 2 + 40, o.y + o.h);
        break;
      case 'sign':
        label(String(o.props.text ?? ''), o.x + o.w / 2, o.y + o.h / 2, 5, C.white, HEADING_FONT).setDepth(5);
        break;
    }
  }

  /** Cheering crowd on the stands (2-frame animation). */
  private drawCrowd(): void {
    const g = this.crowd.clear();
    const cheer = Math.floor(this.anim / 30) % 2;
    const colors = [C.white, C.orange, C.cyan, C.red, C.green, 0xffd166];
    for (const o of this.world.map.objects.filter((m) => m.type === 'stands')) {
      const tiers = 4, th = o.h / tiers;
      for (let i = 0; i < tiers; i++) {
        const inset = (tiers - 1 - i) * 6;
        for (let x = o.x + inset + 2, k = 0; x < o.x + o.w - inset - 3; x += 5, k++) {
          const up = (k + i) % 2 === cheer ? 1 : 0;
          g.fillStyle(colors[(k * 7 + i * 3) % colors.length]).fillRect(x, o.y + i * th + 4 - up, 3, 4);
          g.fillStyle(C.skin).fillRect(x, o.y + i * th + 1 - up, 3, 3);
        }
      }
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
          case 1: // track
            g.fillStyle(C.track).fillRect(x, y, ts, ts).fillStyle(C.trackHi).fillRect(x, y, ts, 2);
            g.fillStyle(C.white, 0.5).fillRect(x, y + 9, ts, 1);
            break;
          case 2: // ground
            g.fillStyle(C.grass).fillRect(x, y, ts, ts).fillStyle(C.grassDark).fillRect(x + (i % 3) * 4, y + 6, 2, 2);
            break;
          case 3: // hurdle
            g.fillStyle(C.grey).fillRect(x + 1, y + 2, 2, ts - 2).fillRect(x + ts - 3, y + 2, 2, ts - 2);
            for (let k = 0; k < 4; k++) g.fillStyle(k % 2 ? C.red : C.white).fillRect(x + k * 4, y, 4, 4);
            break;
          case 4: // sports room wall
            g.fillStyle(C.wall).fillRect(x, y, ts, ts).fillStyle(C.wallDark);
            g.fillRect(x, y + 7, ts, 1).fillRect(x, y + 15, ts, 1).fillRect(x + ((y / ts) % 2 ? 4 : 12), y, 1, 7).fillRect(x + ((y / ts) % 2 ? 12 : 4), y + 8, 1, 7);
            break;
          case 5: // lane line
            g.fillStyle(C.white, 0.7).fillRect(x, y + 1, ts, 1);
            break;
          case 7: // start line
          case 8: // finish line
            for (let k = 0; k < 4; k++) g.fillStyle(k % 2 ? C.navy : C.white).fillRect(x + 6, y + k * 4, 4, 4);
            break;
        }
      });
    }
    // Sports-room interior behind the gate.
    const gate = this.world.gate('sports_gate').area;
    const inside = this.add.graphics().setDepth(1);
    inside.fillStyle(0x2a1f2a).fillRect(gate.x + gate.w, gate.y, map.pixelWidth - gate.x - gate.w, gate.h);
  }
}
