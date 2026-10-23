import { FRAME_MS, PLAYER_H, PLAYER_W } from '../constants';
import { Bug } from '../entities/Bug';
import { Button } from '../entities/Button';
import { Gate } from '../entities/Gate';
import { Player } from '../entities/Player';
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
 *   spawn   point: Bit's feet centre
 *   button  rect: the pressure plate; name = logic node id
 *   gate    rect: full closed area;   name = logic node id; prop openTime (s)
 *   bug     rect: starting box;       props minTileX, maxTileX, speed (px/s), splits
 *   exit    rect: finish trigger
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
  bugs: Bug[] = [];
  readonly exitZone: Rect;
  readonly spawn: { x: number; y: number };

  frame = 0;
  timerStartFrame: number | null = null;
  timerEndFrame: number | null = null;
  deaths = 0;
  ghostsUsed = 0;
  result: LevelCompletePayload | null = null;

  private prevInput: ActionFrame = { ...EMPTY_ACTION };

  constructor(readonly map: LevelMap, readonly config: LevelConfig, bus?: EventBus<PixaEvents>) {
    this.bus = bus ?? new EventBus<PixaEvents>();
    this.collider = new Collider(map);
    const ts = map.tileSize;

    const sp = objectsOfType(map, 'spawn')[0];
    if (!sp) throw new Error('Map needs a spawn object');
    this.spawn = { x: sp.x - PLAYER_W / 2, y: sp.y - PLAYER_H };
    this.player = new Player(this.spawn.x, this.spawn.y);

    this.recorder = new Recorder(Math.round(config.limits.recordSeconds * 60));
    this.ghosts = new GhostManager(config.limits.maxGhosts, {
      onDropped: (g) => this.bus.emit('ghost:dropped', { id: g.id }),
    });
    this.logic = new LogicGraph(config.logic);

    for (const o of objectsOfType(map, 'button')) this.buttons.push(new Button(o.name, { x: o.x, y: o.y, w: o.w, h: o.h }));
    for (const o of objectsOfType(map, 'gate')) {
      const g = new Gate(o.name, { x: o.x, y: o.y, w: o.w, h: o.h }, { openTime: o.props.openTime as number | undefined });
      this.gates.push(g);
      this.collider.dynamics.push(g);
    }
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
    this.exitZone = { x: exit.x, y: exit.y, w: exit.w, h: exit.h };
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
  object(name: string) {
    return findObject(this.map, name);
  }

  step(input: ActionFrame): void {
    if (this.finished) return;
    const prev = this.prevInput;
    this.prevInput = { ...input };
    const pressed = (k: keyof ActionFrame) => input[k] && !prev[k];

    if (this.timerStartFrame === null && anyAction(input)) {
      this.timerStartFrame = this.frame;
      this.bus.emit('timer:start', { frame: this.frame });
    }

    // 1. Commit toggle.
    if (this.config.mechanics.commit && pressed('commit')) {
      if (this.recorder.recording) this.endCommit();
      else this.beginCommit();
    }

    // 2. Ghosts advance; Bit rides any ghost he stands on.
    this.ghosts.step();
    const p = this.player;
    const riding = p.standingOn as Ghost | null;
    if (riding && this.ghosts.ghosts.includes(riding) && !riding.wrapped) {
      p.carry(riding.x - riding.prevX, riding.y - riding.prevY, this.collider);
    }

    // 3. Bit moves.
    const platforms: OneWayPlatform[] = this.ghosts.ghosts.map((g) => ({ rect: g.rect, ref: g }));
    p.step(input, pressed('jump'), this.collider, platforms);

    // 4. Record the draft's frame.
    if (this.recorder.recording) {
      const full = this.recorder.push(p.body.x, p.body.y, p.facing, p.anim, input);
      if (full) this.endCommit();
    }

    // 5. Bugs.
    this.updateBugs();

    // 6. Buttons -> logic -> gates.
    const pressers: Rect[] = [p.body];
    for (const b of this.buttons) {
      const change = b.update(pressers, this.ghosts.ghosts);
      if (change) this.bus.emit(change === 'down' ? 'button:down' : 'button:up', { id: b.id });
      this.logic.setInput(b.id, b.pressed);
    }
    this.logic.evaluate();
    for (const g of this.gates) {
      const change = g.setPowered(this.logic.value(g.id));
      if (change) this.bus.emit(change === 'open' ? 'gate:open' : 'gate:close', { id: g.id });
      g.update([p.body], this.collider);
    }

    this.frame++;

    // 7. Finish line (the draft is temporary, so it can't finish).
    if (!p.draft && overlaps(p.body, this.exitZone)) this.complete();
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
    const star = s.type === 'time' ? timeMs < s.value * 1000 : false;
    this.result = { levelId: this.config.id, timeMs, ghostsUsed: this.ghostsUsed, deaths: this.deaths, star };
    this.bus.emit('level:complete', this.result);
  }
}
