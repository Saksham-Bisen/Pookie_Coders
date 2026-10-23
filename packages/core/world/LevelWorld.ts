import { Clipboard, Copyable, type PastePreview } from '../clipboard/Clipboard';
import { FRAME_MS, PLAYER_H, PLAYER_W } from '../constants';
import { Bug } from '../entities/Bug';
import { Button } from '../entities/Button';
import { Gate } from '../entities/Gate';
import { IdCard } from '../entities/IdCard';
import { Player } from '../entities/Player';
import { Switch } from '../entities/Switch';
import { Turnstile } from '../entities/Turnstile';
import { EventBus, type LevelCompletePayload, type PixaEvents } from '../events';
import { GhostManager, type Ghost } from '../ghosts/GhostManager';
import { anyAction, EMPTY_ACTION, type ActionFrame } from '../input/ActionFrame';
import type { LevelConfig } from '../level/LevelConfig';
import { LogicGraph } from '../logic/LogicGraph';
import { findObject, objectsOfType, type LevelMap } from '../map/TiledMap';
import { Collider, type OneWayPlatform } from '../physics/Collider';
import { overlaps, type Rect } from '../physics/Rect';
import { Recorder } from '../recorder/Recorder';

/**
 * Map object conventions (Tiled object `type`/`class`):
 *   spawn      point: Bit's feet centre
 *   button     rect: the pressure plate; name = logic node id
 *   gate/door  rect: full closed area; name = logic node id; props openTime (s), latch
 *   switch     rect: hit by the ID card; latches on; name = logic node id
 *   turnstile  rect: solid unless the ID card is in hand; prop inside (1 = push right)
 *   copyable   rect: solid, standable, copyable; prop kind
 *   bug        rect: starting box; props minTileX, maxTileX, speed (px/s), splits
 *   exit       rect: finish trigger
 */
export class LevelWorld {
  readonly bus: EventBus<PixaEvents>;
  readonly collider: Collider;
  readonly player: Player;
  readonly recorder: Recorder;
  readonly ghosts: GhostManager;
  readonly logic: LogicGraph;
  readonly buttons: Button[] = [];
  readonly gates: Gate[] = [];
  readonly switches: Switch[] = [];
  readonly turnstiles: Turnstile[] = [];
  readonly clipboard: Clipboard;
  readonly card = new IdCard();
  bugs: Bug[] = [];
  readonly exitZone: Rect;
  readonly spawn: { x: number; y: number };

  frame = 0;
  timerStartFrame: number | null = null;
  timerEndFrame: number | null = null;
  deaths = 0;
  ghostsUsed = 0;
  result: LevelCompletePayload | null = null;
  /** Live paste preview while placing, for rendering. */
  pastePreview: PastePreview | null = null;
  /** Aim direction while [F] is held with the card in hand, else null. */
  aim: { dx: number; dy: number } | null = null;

  private prevInput: ActionFrame = { ...EMPTY_ACTION };

  constructor(readonly map: LevelMap, readonly config: LevelConfig, bus?: EventBus<PixaEvents>) {
    this.bus = bus ?? new EventBus<PixaEvents>();
    this.collider = new Collider(map);
    const ts = map.tileSize;
    const box = (o: { x: number; y: number; w: number; h: number }): Rect => ({ x: o.x, y: o.y, w: o.w, h: o.h });

    const sp = objectsOfType(map, 'spawn')[0];
    if (!sp) throw new Error('Map needs a spawn object');
    this.spawn = { x: sp.x - PLAYER_W / 2, y: sp.y - PLAYER_H };
    this.player = new Player(this.spawn.x, this.spawn.y);

    this.recorder = new Recorder(Math.round(config.limits.recordSeconds * 60));
    this.ghosts = new GhostManager(config.limits.maxGhosts, {
      onDropped: (g) => this.bus.emit('ghost:dropped', { id: g.id }),
    });
    this.logic = new LogicGraph(config.logic);
    this.clipboard = new Clipboard(this.collider, config.limits.clipboardLimit, ts);

    for (const o of objectsOfType(map, 'button')) this.buttons.push(new Button(o.name, box(o)));
    for (const o of [...objectsOfType(map, 'gate'), ...objectsOfType(map, 'door')]) {
      const g = new Gate(o.name, box(o), { openTime: o.props.openTime as number | undefined, latch: o.props.latch === true });
      this.gates.push(g);
      this.collider.dynamics.push(g);
    }
    for (const o of objectsOfType(map, 'switch')) this.switches.push(new Switch(o.name, box(o)));
    for (const o of objectsOfType(map, 'turnstile')) {
      const t = new Turnstile(o.name, box(o), o.props.inside === -1 ? -1 : 1);
      this.turnstiles.push(t);
      this.collider.dynamics.push(t);
    }
    for (const o of objectsOfType(map, 'copyable')) this.clipboard.add(new Copyable(o.name, String(o.props.kind ?? 'object'), box(o)));
    for (const o of objectsOfType(map, 'bug')) {
      const p = o.props;
      this.bugs.push(
        new Bug(o.x, o.y + o.h, {
          minX: ((p.minTileX as number) ?? Math.floor(o.x / ts)) * ts,
          maxX: (((p.maxTileX as number) ?? Math.floor(o.x / ts)) + 1) * ts,
          speed: (p.speed as number) ?? 30,
          splits: p.splits === true,
        }),
      );
    }
    const exit = objectsOfType(map, 'exit')[0];
    if (!exit) throw new Error('Map needs an exit object');
    this.exitZone = box(exit);
  }

  get finished(): boolean {
    return this.result !== null;
  }

  /** Elapsed run time in ms (fixed-step, so identical on every machine). */
  get timeMs(): number {
    if (this.timerStartFrame === null) return 0;
    const end = this.timerEndFrame ?? this.frame;
    return Math.round((end - this.timerStartFrame) * FRAME_MS);
  }

  button(id: string): Button {
    const b = this.buttons.find((x) => x.id === id);
    if (!b) throw new Error(`No button "${id}"`);
    return b;
  }
  gate(id: string): Gate {
    const g = this.gates.find((x) => x.id === id);
    if (!g) throw new Error(`No gate "${id}"`);
    return g;
  }
  switchById(id: string): Switch {
    const s = this.switches.find((x) => x.id === id);
    if (!s) throw new Error(`No switch "${id}"`);
    return s;
  }
  object(name: string) {
    return findObject(this.map, name);
  }

  step(input: ActionFrame): void {
    if (this.finished) return;
    const prev = this.prevInput;
    this.prevInput = { ...input };
    const pressed = (k: keyof ActionFrame) => input[k] && !prev[k];
    const mech = this.config.mechanics;
    const p = this.player;

    if (this.timerStartFrame === null && anyAction(input)) {
      this.timerStartFrame = this.frame;
      this.bus.emit('timer:start', { frame: this.frame });
    }

    // 1. Commit toggle.
    if (mech.commit && pressed('commit')) {
      if (this.recorder.recording) this.endCommit();
      else this.beginCommit();
    }

    // 2. Ghosts advance; Bit rides any ghost he stands on.
    this.ghosts.step();
    const riding = p.standingOn as Ghost | null;
    if (riding && this.ghosts.ghosts.includes(riding) && !riding.wrapped) {
      p.carry(riding.x - riding.prevX, riding.y - riding.prevY, this.collider);
    }

    // 3. Aim / throw. Holding [F] with the card in hand aims (Bit stands still); releasing throws.
    let move = input;
    if (mech.idCard) {
      const prevAim = this.aim;
      this.aim = null;
      if (this.card.inHand && input.throw) {
        const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
        this.aim = dx === 0 && dy === 0 ? { dx: p.facing, dy: 0 } : { dx, dy };
        move = { ...input, left: false, right: false, jump: false };
      } else if (prevAim && !input.throw && this.card.inHand) {
        const a = prevAim;
        const b = p.body;
        if (this.card.throw(b.x + b.w / 2, b.y + b.h / 2, a.dx, a.dy)) {
          if (a.dx !== 0) p.facing = a.dx > 0 ? 1 : -1;
          this.bus.emit('card:thrown', { dx: a.dx, dy: a.dy });
        }
      }
    }

    // 4. Bit moves.
    const platforms: OneWayPlatform[] = this.ghosts.ghosts.map((g) => ({ rect: g.rect, ref: g }));
    p.step(move, pressed('jump'), this.collider, platforms);

    // 5. Record the draft's frame.
    if (this.recorder.recording) {
      const full = this.recorder.push(p.body.x, p.body.y, p.facing, p.anim, input);
      if (full) this.endCommit();
    }

    // 6. Clipboard.
    if (mech.clipboard) this.updateClipboard(pressed);

    // 7. ID card and the switches it hits.
    if (mech.idCard) this.updateCard();

    // 8. Bugs.
    this.updateBugs();

    // 9. Buttons -> logic -> gates. Pasted copies press buttons too.
    const pressers: Rect[] = [p.body, ...this.clipboard.objects.filter((o) => o.pasted).map((o) => o.area)];
    for (const b of this.buttons) {
      const change = b.update(pressers, this.ghosts.ghosts);
      if (change) this.bus.emit(change === 'down' ? 'button:down' : 'button:up', { id: b.id });
      this.logic.setInput(b.id, b.pressed);
    }
    for (const s of this.switches) this.logic.setInput(s.id, s.on);
    this.logic.evaluate();
    for (const g of this.gates) {
      const change = g.setPowered(this.logic.value(g.id));
      if (change) this.bus.emit(change === 'open' ? 'gate:open' : 'gate:close', { id: g.id });
      g.update([p.body], this.collider);
    }
    for (const t of this.turnstiles) t.update(this.card.inHand, [p.body], this.collider);

    this.frame++;

    // 10. Finish line (the draft is temporary, so it can't finish).
    if (!p.draft && overlaps(p.body, this.exitZone)) this.complete();
  }

  private updateClipboard(pressed: (k: keyof ActionFrame) => boolean): void {
    const cb = this.clipboard;
    const p = this.player;
    if (pressed('copy') && !cb.placing) {
      const hit = cb.tryCopy(p.body);
      if (hit) this.bus.emit('clipboard:copy', { id: hit.id, kind: hit.kind });
    }
    if (cb.placing && pressed('cancel')) cb.cancel();
    const blockers = [p.body, ...this.ghosts.ghosts.map((g) => g.rect)];
    if (pressed('paste')) {
      if (!cb.placing) cb.startPlacing();
      else {
        const obj = cb.paste(cb.preview(p.body, p.facing, blockers));
        if (obj) this.bus.emit('clipboard:paste', { id: obj.id, kind: obj.kind });
      }
    }
    this.pastePreview = cb.placing ? cb.preview(p.body, p.facing, blockers) : null;
  }

  private updateCard(): void {
    const card = this.card;
    const wasFlying = card.flying;
    const tops = this.clipboard.objects.map((o) => o.area); // benches are standable too
    const r = card.update(this.player.body, this.collider, tops);
    if (wasFlying || card.flying) {
      for (const s of this.switches) if (overlaps(card.rect, s.rect) && s.hit()) this.bus.emit('switch:on', { id: s.id });
    }
    if (r === 'returned') this.bus.emit('card:returned', {});
    else if (r === 'stuck') this.bus.emit('card:stuck', { x: card.x, y: card.y });
    else if (r === 'lost') this.bus.emit('card:lost', { x: card.x, y: card.y });
  }

  private beginCommit(): void {
    const b = this.player.body;
    this.recorder.begin(b.x, b.y);
    this.player.draft = true;
    this.bus.emit('commit:start', { x: b.x, y: b.y });
  }

  private endCommit(): void {
    const commit = this.recorder.end(this.frame);
    this.player.draft = false;
    if (!commit) return;
    this.ghosts.add(commit);
    this.ghostsUsed++;
    this.player.teleport(commit.startX, commit.startY);
    this.bus.emit('commit:end', { id: commit.id, frames: commit.frames.length });
  }

  private updateBugs(): void {
    const p = this.player;
    const spawned: Bug[] = [];
    for (const bug of this.bugs) {
      bug.update(this.collider);
      if (!bug.alive || !overlaps(p.body, bug.rect)) continue;
      const fromAbove = p.body.vy > 0 && p.prevBottom <= bug.y + 3;
      if (fromAbove) {
        const kids = bug.stomp();
        spawned.push(...kids);
        p.bounce();
        this.bus.emit('bug:stomped', { x: bug.x, y: bug.y, split: kids.length > 0 });
      } else {
        this.kill('bug');
        break;
      }
    }
    this.bugs = this.bugs.filter((b) => b.state !== 'gone').concat(spawned);
  }

  /** Bit dies: respawn at spawn. Ghosts are kept and the timer keeps running. */
  kill(cause: string): void {
    const b = this.player.body;
    this.bus.emit('player:died', { x: b.x, y: b.y, cause });
    if (this.recorder.recording) {
      this.recorder.cancel();
      this.bus.emit('commit:cancel', { reason: 'died' });
    }
    this.deaths++;
    this.player.respawn();
  }

  private complete(): void {
    this.timerEndFrame = this.frame;
    if (this.timerStartFrame === null) this.timerStartFrame = this.frame;
    const timeMs = this.timeMs;
    const s = this.config.star;
    const cardThrows = this.card.throws;
    const star =
      s.type === 'time' ? timeMs < s.value * 1000 : s.type === 'maxCardThrows' ? cardThrows <= s.value : true; // noUndo: no undo yet
    this.result = {
      levelId: this.config.id,
      timeMs,
      ghostsUsed: this.ghostsUsed,
      deaths: this.deaths,
      star,
      cardThrows,
      pastesUsed: this.clipboard.pastesUsed,
    };
    this.bus.emit('level:complete', this.result);
  }
}
