import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { TILE, ZOOM } from '@pixa/core/constants';
import { DomKeyboardInput } from '@pixa/core/input/DomKeyboardInput';
import { EMPTY_ACTION } from '@pixa/core/input/ActionFrame';
import { defaultApiUrl, submitRun } from '@pixa/core/net/runs';
import { FixedStepper } from '@pixa/core/scene/FixedStepper';
import type { LevelWorld } from '@pixa/core/world/LevelWorld';
import { createLevel1World } from '../createWorld';
import { Level1Hints } from '../hints';
import config from '../level.config';
import {
  Bit,
  BIT_COLORS,
  Bug,
  DeathFlash,
  DRAFT_COLORS,
  FarCollege,
  FinishLine,
  Gate,
  Ghost,
  HUD,
  Hurdle,
  IntroOverlay,
  MidTrees,
  ResultOverlay,
  Scoreboard,
  Sky,
  SportsRoom,
  Stands,
  StartButton,
  StartLine,
  Toast,
  Track,
  Wire,
  type HudView,
  type ResultView,
} from './art';
import { formatTime, makeView, SCREEN_H, SCREEN_W } from './view';
import './level1.css';

/** How long the death banner and one-off notices stay up (frames). */
const DEATH_FRAMES = 70;
const NOTICE_FRAMES = 150;

/** Tile ids used in map.json (see Level1Scene.drawTiles). */
const GID = { hurdle: 3, startLine: 7, finishLine: 8 } as const;

interface Sim {
  world: LevelWorld;
  hints: Level1Hints;
  layout: Layout;
  deathAt: number | null;
  notice: { text: string; at: number } | null;
}

/** Positions of the static art, in design px, read from the map once per run. */
interface Layout {
  hurdles: { x: number; y: number }[];
  startLineX: number;
  finishLineX: number;
  gate: { x: number; y: number; w: number; h: number };
  buttonX: number;
  wireEnd: number;
}

function buildLayout(world: LevelWorld): Layout {
  const v = makeView(world);
  const map = world.map;
  const cells = (gid: number) =>
    map.tileLayers.flatMap((l) =>
      l.data.flatMap((g, i) => (g === gid ? [{ x: (i % map.width) * TILE, y: Math.floor(i / map.width) * TILE }] : [])),
    );
  const firstX = (gid: number, fallback: number) => cells(gid)[0]?.x ?? fallback;
  const a = world.gate('sports_gate').area;
  const gate = { x: v.x(a.x), y: v.y(a.y), w: a.w * ZOOM, h: a.h * ZOOM };
  const s = world.button('start_button').sensor;
  return {
    hurdles: cells(GID.hurdle).map((c) => ({ x: v.x(c.x), y: v.y(c.y) })),
    // The checkered lines are narrower than a tile: centre them in their tile.
    startLineX: v.x(firstX(GID.startLine, 80)) + (TILE * ZOOM - 14) / 2,
    finishLineX: v.x(firstX(GID.finishLine, 912)) + (TILE * ZOOM - 18) / 2,
    gate,
    buttonX: v.x(s.x + s.w / 2),
    wireEnd: gate.x - 36, // centre of the lock panel
  };
}

function newSim(): Sim {
  const world = createLevel1World();
  return { world, hints: new Level1Hints(world), layout: buildLayout(world), deathAt: null, notice: null };
}

/**
 * Level 1 rendered with the Figma design (React + SVG), driven by the headless engine.
 * The engine steps at a fixed 60 fps exactly like the Phaser scene, so ghosts replay the same.
 */
export function Level1Game() {
  const [runId, setRunId] = useState(0);
  const [started, setStarted] = useState(false);
  const [upload, setUpload] = useState<ResultView['upload']>('sending');
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const inputRef = useRef<DomKeyboardInput | null>(null);
  const startedRef = useRef(started);
  startedRef.current = started;

  const sim = useMemo(newSim, [runId]);

  // Keyboard -> ActionFrame. Created before the menu-key listener so the menu can swallow keys.
  useEffect(() => {
    const input = new DomKeyboardInput(window);
    inputRef.current = input;
    return () => {
      input.destroy();
      inputRef.current = null;
    };
  }, []);

  // Menu keys: Enter starts / restarts after the finish, N goes to the next level, Backspace restarts.
  useEffect(() => {
    const restart = () => {
      setRunId((n) => n + 1);
      setUpload('sending');
      inputRef.current?.reset();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!startedRef.current) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          setStarted(true);
          inputRef.current?.reset();
        }
        return;
      }
      if (e.code === 'Enter' && sim.world.finished) restart();
      // The next level is still a Phaser scene: main.ts boots it from ?level=.
      if (e.code === 'KeyN' && sim.world.finished && config.next) location.search = `?level=${config.next}`;
      if (e.code === 'Backspace') {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sim]);

  // Engine events -> UI state and the backend.
  useEffect(() => {
    const w = sim.world;
    let alive = true;
    const offs = [
      w.bus.on('player:died', () => (sim.deathAt = w.frame)),
      w.bus.on('ghost:dropped', ({ id }) => (sim.notice = { text: `commit ${id} dropped (max ${config.limits.maxGhosts})`, at: w.frame })),
      w.bus.on('commit:cancel', () => (sim.notice = { text: 'Commit cancelled.', at: w.frame })),
      w.bus.on('level:complete', (r) => {
        setUpload('sending');
        void submitRun(r, { baseUrl: defaultApiUrl() }).then((res) => alive && setUpload(res));
      }),
    ];
    if (import.meta.env.DEV) (window as unknown as { pixa: unknown }).pixa = sim;
    return () => {
      alive = false;
      offs.forEach((off) => off());
    };
  }, [sim]);

  // Fixed-timestep loop.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const stepper = new FixedStepper(() => {
      sim.world.step(inputRef.current?.read() ?? EMPTY_ACTION);
      if (!sim.world.finished) sim.hints.update();
    });
    const tick = (now: number) => {
      if (startedRef.current) stepper.advance(now - last);
      last = now;
      rerender();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sim]);

  const w = sim.world;
  const L = sim.layout;
  const v = makeView(w);
  const tick = w.frame;
  const levelLabel = `LEVEL ${config.id.replace(/^L/, '')}`;
  const title = config.name.toUpperCase();
  const starTarget = config.star.type === 'time' ? formatTime(config.star.value * 1000).replace(/\.00$/, '') : null;

  const hud: HudView = {
    levelNumber: config.id.replace(/^L/, ''),
    title: `${config.id} · ${title}`,
    venue: config.venue.toUpperCase(),
    time: formatTime(w.timeMs),
    starChip: starTarget ? `★ < ${starTarget}` : null,
    maxCommits: config.limits.maxGhosts,
    slots: Array.from({ length: config.limits.maxGhosts }, (_, i) => (w.ghosts.ghosts.some((g) => g.slot === i) ? i : null)),
    recording: w.recorder.recording
      ? { secondsLeft: w.recorder.framesLeft / 60, fraction: w.recorder.framesLeft / w.recorder.maxFrames }
      : null,
  };

  const dying = sim.deathAt !== null && w.frame - sim.deathAt < DEATH_FRAMES;
  const notice = sim.notice && w.frame - sim.notice.at < NOTICE_FRAMES ? sim.notice.text : null;
  const hint = notice ?? sim.hints.current?.text ?? null;

  const btn = w.button('start_button');
  const gate = w.gate('sports_gate');
  const p = w.player;
  const pb = p.body;

  return (
    <svg
      className="game-frame"
      viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Level 1 Relay Race`}
    >
      <Sky />
      <g transform={`translate(${-Math.round(v.camX * 0.25)} 0)`}>
        <FarCollege width={SCREEN_W + (v.width - SCREEN_W) * 0.25} />
      </g>
      <g transform={`translate(${-Math.round(v.camX * 0.5)} 0)`}>
        <MidTrees width={SCREEN_W + (v.width - SCREEN_W) * 0.5} />
      </g>

      <g transform={`translate(${-v.camX} 0)`}>
        <Stands width={v.width} />
        <Scoreboard />
        <SportsRoom gate={L.gate} right={v.width} />
        <Track width={v.width} />
        <StartLine x={L.startLineX} />
        <FinishLine x={L.finishLineX} />
        <Wire start={L.buttonX} end={L.wireEnd} powered={w.logic.value('start_button')} />
        <StartButton x={L.buttonX} pressed={btn.pressed} />
        {L.hurdles.map((h) => (
          <Hurdle key={`${h.x},${h.y}`} x={h.x} y={h.y} />
        ))}
        <Gate area={L.gate} progress={gate.progress} open={gate.isOpen} />

        {w.bugs.map((b, i) =>
          b.state === 'gone' ? null : (
            <Bug
              key={i}
              x={v.x(b.x + b.w / 2)}
              bottom={v.y(b.y + b.h)}
              dir={b.dir}
              squashed={b.state === 'squashed'}
              small={b.opts.small === true}
              tick={tick}
            />
          ),
        )}

        {w.ghosts.ghosts.map((g) => (
          <Ghost key={g.id} x={v.x(g.x + pb.w / 2)} feet={v.y(g.y + pb.h)} id={g.id} slot={g.slot} facing={g.frame.facing} />
        ))}

        <g opacity={dying && Math.floor(tick / 6) % 2 === 0 ? 0.35 : 1}>
          <Bit
            x={v.x(pb.x + pb.w / 2)}
            feet={v.y(pb.y + pb.h)}
            facing={p.facing}
            anim={p.anim}
            tick={tick}
            colors={p.draft ? DRAFT_COLORS : BIT_COLORS}
            rec={p.draft}
          />
        </g>
      </g>

      <HUD v={hud} />
      {started && !w.finished && hint && <Toast tone={notice ? 'alert' : 'hint'}>{hint}</Toast>}
      {dying && !w.finished && <DeathFlash />}
      {!started && <IntroOverlay levelLabel={levelLabel} title={title} />}
      {w.result && (
        <ResultOverlay
          v={{
            levelLabel,
            title: 'RELAY COMPLETE',
            time: formatTime(w.result.timeMs),
            ghostsUsed: w.result.ghostsUsed,
            deaths: w.result.deaths,
            star: w.result.star,
            missNote: starTarget ? `RUN UNDER ${starTarget} FOR THE STAR` : 'NO STAR THIS TIME',
            upload,
            hasNext: Boolean(config.next),
          }}
        />
      )}
    </svg>
  );
}
