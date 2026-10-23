/**
 * Level 1 art, taken from the Figma design ("Design Relay Race Level/Level-1_UI/src/App.tsx").
 * The design's components are kept as close to the original as possible; what changed is that
 * positions and states (pressed, open, squashed, facing...) now come from the engine.
 *
 * Coordinates are "design px": the 320x180 game world scaled 4x to a 1280x720 frame.
 */
import { memo, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { AnimState } from '@pixa/core/recorder/Recorder';
import { SCREEN_H, SCREEN_W } from './view';

// ------------------------------------------------------------------ backdrop

function PixelCloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="var(--sky-cloud)" opacity=".75">
      <rect x="16" y="0" width="48" height="8" />
      <rect x="8" y="8" width="80" height="16" />
      <rect x="0" y="16" width="104" height="8" />
      <rect x="24" y="24" width="64" height="8" opacity=".55" />
    </g>
  );
}

/** Screen-fixed sky, dither and clouds. */
export const Sky = memo(function Sky() {
  return (
    <g id="l1_bg_sky">
      <defs>
        <linearGradient id="l1_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f98982" />
          <stop offset=".58" stopColor="#f6ad72" />
          <stop offset="1" stopColor="#f5cf82" />
        </linearGradient>
        <pattern id="l1_dither" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="#ffd192" opacity=".32" />
          <rect x="6" y="6" width="3" height="3" fill="#a84f78" opacity=".18" />
        </pattern>
        <pattern id="l1_grass" width="32" height="16" patternUnits="userSpaceOnUse">
          <rect width="32" height="16" fill="#75984c" />
          <rect x="2" y="4" width="4" height="3" fill="#8dad56" />
          <rect x="20" y="12" width="5" height="3" fill="#5f8442" />
        </pattern>
      </defs>
      <rect width={SCREEN_W} height="480" fill="url(#l1_sky)" />
      <rect width={SCREEN_W} height="480" fill="url(#l1_dither)" />
      <PixelCloud x={110} y={104} scale={1.4} />
      <PixelCloud x={742} y={148} scale={0.9} />
    </g>
  );
});

/** Distant college silhouette (slow parallax). */
export const FarCollege = memo(function FarCollege({ width }: { width: number }) {
  const towers = Array.from({ length: Math.ceil(width / 1100) }, (_, i) => 1060 + i * 1100);
  return (
    <g id="l1_bg_college" fill="#a85566" opacity=".56">
      <rect x="0" y="310" width={width} height="102" />
      {Array.from({ length: Math.ceil(width / 104) }, (_, i) => (
        <rect key={i} x={i * 104 + 24} y={334} width="32" height="35" fill="#f2a474" opacity=".58" />
      ))}
      {towers.map((x) => (
        <g key={x}>
          <rect x={x} y="245" width="126" height="167" />
          <rect x={x + 18} y="222" width="90" height="23" />
        </g>
      ))}
    </g>
  );
});

/** Trees and the water tank (medium parallax). */
export const MidTrees = memo(function MidTrees({ width }: { width: number }) {
  return (
    <g>
      <g id="l1_bg_trees" fill="#435d44">
        {Array.from({ length: Math.ceil(width / 68) + 1 }, (_, i) => (
          <g key={i} transform={`translate(${i * 68 - 20} ${330 + (i % 4) * 5})`}>
            <rect x="23" y="31" width="8" height="61" fill="#594947" />
            <rect x="0" y="18" width="54" height="38" />
            <rect x="10" y="0" width="35" height="52" fill="#4e7049" />
          </g>
        ))}
      </g>
      <g id="l1_bg_water_tank" transform="translate(910 270)" fill="#364c50">
        <rect x="0" y="0" width="92" height="46" />
        <rect x="10" y="-10" width="72" height="10" />
        <rect x="12" y="46" width="8" height="88" />
        <rect x="72" y="46" width="8" height="88" />
        <rect x="0" y="88" width="92" height="8" />
      </g>
    </g>
  );
});

function Crowd({ x = 0 }: { x?: number }) {
  const colors = ['#ffd46a', '#55d9d2', '#f47b70', '#f6a6c1', '#d3e36d', '#9f8dd9'];
  return (
    <g transform={`translate(${x} 0)`}>
      {Array.from({ length: 22 }, (_, i) => {
        const cx = 34 + i * 54;
        const cy = 287 + (i % 3) * 8;
        const color = colors[i % colors.length];
        return (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <rect x="0" y="0" width="12" height="12" fill="#362842" />
            <rect x="-2" y="12" width="16" height="18" fill={color} />
            <rect className={`cheer-arm-left crowd-delay-${i % 2}`} x="-8" y="12" width="6" height="16" fill={color} />
            <rect className={`cheer-arm-right crowd-delay-${i % 2}`} x="14" y="12" width="6" height="16" fill={color} />
          </g>
        );
      })}
    </g>
  );
}

/** Stands, cheering crowd, banner and the grass strip. Scrolls with the world. */
export const Stands = memo(function Stands({ width }: { width: number }) {
  return (
    <g id="l1_bg_stands">
      <rect x="0" y="390" width={width} height="25" fill="#2d3140" />
      <rect x="0" y="415" width={width} height="103" fill="#51546a" />
      <rect x="0" y="427" width={width} height="8" fill="#73778d" />
      <rect x="0" y="475" width={width} height="8" fill="#73778d" />
      <rect x="0" y="511" width={width} height="16" fill="#2d3140" />
      <g id="l1_bg_crowd">
        {Array.from({ length: Math.ceil(width / 1188) }, (_, i) => (
          <Crowd key={i} x={i * 1188} />
        ))}
      </g>
      <g transform="translate(340 369)">
        <rect x="0" y="0" width="600" height="54" fill="#f5df9a" stroke="#272735" strokeWidth="8" />
        <text x="300" y="36" className="pixel-text banner-text" textAnchor="middle">
          DRONACHARYA SPORTS GROUND
        </text>
      </g>
      <rect id="l1_tile_grass" x="0" y="527" width={width} height="61" fill="url(#l1_grass)" />
    </g>
  );
});

export const Scoreboard = memo(function Scoreboard({ x = 72 }: { x?: number }) {
  return (
    <g id="l1_scoreboard" transform={`translate(${x} 316)`}>
      <rect width="205" height="112" rx="2" fill="#202536" stroke="#f3cd75" strokeWidth="7" />
      <rect x="14" y="15" width="177" height="24" fill="#343b4d" />
      <text x="102" y="33" className="pixel-text board-small" textAnchor="middle">
        INTER COLLEGE
      </text>
      <text x="102" y="72" className="pixel-text board-main" textAnchor="middle">
        BIT <tspan fill="#e86655">vs</tspan> BUGS
      </text>
      <rect x="18" y="88" width="68" height="7" fill="#55d9d2" />
      <rect x="119" y="88" width="68" height="7" fill="#e86655" />
      <rect x="26" y="112" width="9" height="99" fill="#343b4d" />
      <rect x="170" y="112" width="9" height="99" fill="#343b4d" />
    </g>
  );
});

// ------------------------------------------------------------------- track

export const Track = memo(function Track({ width }: { width: number }) {
  return (
    <g id="l1_tile_track">
      <rect x="0" y="588" width={width} height={SCREEN_H - 588} fill="#b94e4e" />
      <rect x="0" y="592" width={width} height="12" fill="#e98468" />
      <rect id="l1_tile_track_edge" x="0" y="576" width={width} height="15" fill="#e9d8a4" />
      <rect x="0" y="591" width={width} height="5" fill="#554551" opacity=".5" />
      <rect id="l1_tile_lane_line" x="0" y="655" width={width} height="6" fill="#f6ddb1" opacity=".85" />
      <rect x="0" y="711" width={width} height="6" fill="#f6ddb1" opacity=".85" />
      <g opacity=".14">
        {Array.from({ length: Math.ceil(width / 64) }, (_, i) => (
          <rect key={i} x={i * 64} y="604" width="3" height="164" fill="#612e3f" />
        ))}
      </g>
    </g>
  );
});

function CheckeredLine({ x, label, w, id }: { x: number; label: string; w: number; id: string }) {
  const rows = Math.ceil((SCREEN_H - 588) / 16);
  return (
    <g id={id} transform={`translate(${x} 0)`}>
      <rect x="0" y="588" width={w} height={SCREEN_H - 588} fill="#f8e8c7" />
      {Array.from({ length: rows }, (_, i) => (
        <rect key={i} x={i % 2 ? 0 : w / 2} y={588 + i * 16} width={w / 2} height="16" fill="#303142" />
      ))}
      <text transform="translate(-12 707) rotate(-90)" className="pixel-text track-label">
        {label}
      </text>
    </g>
  );
}

export const StartLine = memo(function StartLine({ x }: { x: number }) {
  return <CheckeredLine id="l1_tile_start_line" x={x} w={14} label="START" />;
});

export const FinishLine = memo(function FinishLine({ x }: { x: number }) {
  return <CheckeredLine id="l1_tile_finish_line" x={x} w={18} label="FINISH" />;
});

/** Low hurdle. (x, y) is the top-left of its 1-tile collision box (64x64 design px). */
export const Hurdle = memo(function Hurdle({ x, y }: { x: number; y: number }) {
  return (
    <g id="l1_object_hurdle" transform={`translate(${x - 10} ${y + 1})`}>
      <rect x="0" y="0" width="83" height="11" fill="#f5eee0" />
      <rect x="0" y="0" width="23" height="11" fill="#e65a52" />
      <rect x="44" y="0" width="22" height="11" fill="#e65a52" />
      <rect x="8" y="11" width="8" height="51" fill="#f5eee0" />
      <rect x="67" y="11" width="8" height="51" fill="#f5eee0" />
      <rect x="0" y="57" width="27" height="6" fill="#342f3d" />
      <rect x="58" y="57" width="27" height="6" fill="#342f3d" />
    </g>
  );
});

/** Cyan wire from the start button to the gate's lock panel. Glows while powered. */
export function Wire({ start, end, powered }: { start: number; end: number; powered: boolean }) {
  const d = `M ${start} 575 v-18 H ${end} v-30`;
  const boxes = Math.max(2, Math.round((end - start) / 420));
  return (
    <g id="l1_wire_cyan">
      <path
        d={d}
        fill="none"
        stroke={powered ? '#b8fff2' : '#1a7483'}
        strokeWidth={powered ? 12 : 8}
        strokeLinecap="square"
        className={powered ? 'wire-powered' : ''}
      />
      <path d={d} fill="none" stroke="#4ae4da" strokeWidth="4" strokeDasharray="16 8" className={powered ? 'wire-flow' : ''} />
      {Array.from({ length: boxes + 1 }, (_, i) => {
        const cx = start + ((end - start) / boxes) * i;
        return <rect key={i} x={cx - 6} y="551" width="12" height="12" fill="#253b48" stroke="#4ae4da" strokeWidth="3" />;
      })}
    </g>
  );
}

/** Floor button; x is its centre. */
export function StartButton({ x, pressed }: { x: number; pressed: boolean }) {
  return (
    <g id={pressed ? 'l1_object_start_button_pressed' : 'l1_object_start_button_up'} transform={`translate(${x} 574)`}>
      <rect x="-38" y="16" width="76" height="14" fill="#563944" />
      <rect x="-30" y={pressed ? 10 : 0} width="60" height={pressed ? 13 : 23} fill={pressed ? '#40aa79' : '#e55d51'} />
      <rect x="-22" y={pressed ? 10 : 0} width="44" height="7" fill={pressed ? '#80e3a7' : '#ff8a68'} />
    </g>
  );
}

// ------------------------------------------------------------ sports room

/**
 * Sports-room building (the solid wall above the gate), its dark interior, and the
 * "SPORTS ROOM" sign. `gate` is the gate's closed area in design px.
 */
export const SportsRoom = memo(function SportsRoom({
  gate,
  right,
}: {
  gate: { x: number; y: number; w: number; h: number };
  right: number;
}) {
  const top = -60;
  const wallW = right - gate.x;
  return (
    <g id="l1_sports_room">
      <rect x={gate.x + gate.w} y={gate.y} width={right - gate.x - gate.w} height={gate.h} fill="#27313d" />
      <rect x={gate.x + gate.w} y={gate.y} width={right - gate.x - gate.w} height="10" fill="#1b222c" />
      <rect x={gate.x} y={top} width={wallW} height={gate.y - top} fill="#3b424f" />
      <g fill="#323845">
        {Array.from({ length: Math.ceil((gate.y - top) / 32) }, (_, r) => (
          <g key={r}>
            <rect x={gate.x} y={top + r * 32 + 28} width={wallW} height="4" />
            {Array.from({ length: Math.ceil(wallW / 64) }, (_, c) => (
              <rect key={c} x={gate.x + c * 64 + (r % 2 ? 32 : 0)} y={top + r * 32} width="4" height="28" />
            ))}
          </g>
        ))}
      </g>
      <rect x={gate.x} y={gate.y - 12} width={wallW} height="12" fill="#272c37" />
      <g transform={`translate(${gate.x + 26} ${gate.y - 72})`}>
        <rect x="0" y="0" width="188" height="28" fill="#27313d" stroke="#f1cf79" strokeWidth="3" />
        <text x="94" y="20" textAnchor="middle" className="pixel-text gate-label">
          SPORTS ROOM
        </text>
      </g>
    </g>
  );
});

/**
 * The gate leaf retracts upward as it opens (`progress` 0 = closed, 1 = open),
 * exactly like the engine's collision box. The lock panel sits left of the gate.
 */
export function Gate({ area, progress, open }: { area: { x: number; y: number; w: number; h: number }; progress: number; open: boolean }) {
  const { x, y, w, h } = area;
  const lift = Math.round(progress * h);
  return (
    <g id={open ? 'l1_object_gate_open' : 'l1_object_gate_closed'}>
      <defs>
        <clipPath id="l1_gate_clip">
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <g id="l1_tile_gate" clipPath="url(#l1_gate_clip)">
        <g transform={`translate(${x} ${y - lift})`}>
          <rect x="0" y="0" width={w} height={h} fill="#59616a" />
          <g stroke="#b7bdaf" strokeWidth="4">
            {Array.from({ length: 7 }, (_, i) => (
              <path key={`a${i}`} d={`M ${i * 20 - 60} 0 l64 ${h}`} />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <path key={`b${i}`} d={`M ${i * 20 - 60} ${h} l64 ${-h}`} />
            ))}
          </g>
          <rect x="0" y="0" width="6" height={h} fill="#242c37" />
          <rect x={w - 6} y="0" width="6" height={h} fill="#242c37" />
          <rect x="0" y={h - 8} width={w} height="8" fill="#242c37" />
        </g>
      </g>
      <rect x={x - 12} y={y - 12} width="12" height={h + 12} fill="#272c37" />
      <rect x={x + w} y={y - 12} width="12" height={h + 12} fill="#272c37" />
      <g id="l1_gate_panel" transform={`translate(${x - 55} ${y + 7})`}>
        <rect width="38" height="55" fill="#252a36" stroke="#737c84" strokeWidth="4" />
        <rect x="11" y="10" width="16" height="16" fill={open ? '#75e788' : '#ef6256'} className={open ? 'lock-open' : ''} />
        <rect x="11" y="34" width="16" height="8" fill="#151b25" />
      </g>
    </g>
  );
}

// ----------------------------------------------------------------- actors

export interface BitColors {
  head: string;
  body: string;
  arms: string;
  shoes: string;
}
export const BIT_COLORS: BitColors = { head: '#242638', body: '#373b54', arms: '#f1bf75', shoes: '#69dcd1' };
/** Bit while recording a commit (a "draft"). */
export const DRAFT_COLORS: BitColors = { head: '#6a2a3a', body: '#c4505a', arms: '#ffb0a0', shoes: '#ff8a90' };

/**
 * Bit. (x, feet) = centre of his hitbox and the bottom of his feet, in design px.
 * `tick` is the world frame, used for the run cycle.
 */
export function Bit({
  x,
  feet,
  facing,
  anim,
  tick,
  colors = BIT_COLORS,
  rec = false,
}: {
  x: number;
  feet: number;
  facing: 1 | -1;
  anim: AnimState;
  tick: number;
  colors?: BitColors;
  rec?: boolean;
}) {
  const air = anim === 'jump' || anim === 'fall';
  const stride = anim === 'run' ? Math.floor(tick / 6) % 2 : 0;
  const lift = (left: boolean) => (air ? 6 : anim === 'run' && stride === (left ? 0 : 1) ? 5 : 0);
  const eye = facing * 3;
  const tilt = anim === 'jump' ? -5 * facing : anim === 'fall' ? 4 * facing : 0;
  const c = colors;
  return (
    <g id="l1_sprite_bit" transform={`translate(${x} ${feet - 35})`}>
      <g className={anim === 'idle' ? 'bit-idle' : ''} transform={tilt ? `rotate(${tilt} 0 0)` : undefined}>
        <rect x="-23" y="-62" width="46" height="45" rx="8" fill={c.head} />
        <rect x="-29" y="-54" width="6" height="20" fill={c.head} />
        <rect x="23" y="-54" width="6" height="20" fill={c.head} />
        <rect x={-14 + eye} y="-47" width="8" height="8" fill="#f7e7b2" />
        <rect x={6 + eye} y="-47" width="8" height="8" fill="#f7e7b2" />
        <rect x="-12" y="-27" width="24" height="5" fill="#55d9d2" />
        <rect x="-20" y="-17" width="40" height="31" fill={c.body} />
        <rect x="-28" y={-12 - (air ? 6 : 0)} width="8" height="27" fill={c.arms} />
        <rect x="20" y={-12 - (air ? 6 : 0)} width="8" height="27" fill={c.arms} />
        <rect x="-19" y={14 - lift(true)} width="14" height="19" fill={c.head} />
        <rect x="5" y={14 - lift(false)} width="14" height="19" fill={c.head} />
        <rect x="-22" y={29 - lift(true)} width="18" height="6" fill={c.shoes} />
        <rect x="4" y={29 - lift(false)} width="18" height="6" fill={c.shoes} />
      </g>
      {rec && (
        <g className="rec-blink" transform="translate(0 -84)">
          <rect x="-30" y="-12" width="60" height="18" fill="#202333" stroke="#e86655" strokeWidth="3" />
          <rect x="-24" y="-7" width="8" height="8" fill="#e86655" />
          <text x="-10" y="2" className="pixel-text rec-text">
            REC
          </text>
        </g>
      )}
    </g>
  );
}

export const GHOST_FILLS = ['#70e69a', '#55d9d2', '#9f8dd9'] as const;
const GHOST_EYES = ['#193b38', '#16343a', '#2a2347'] as const;
const GHOST_TEXT = ['#baffce', '#b9fbf6', '#ddd3ff'] as const;

/** A looping commit replay, labelled with its hash. Same anchor as Bit. */
export function Ghost({ x, feet, id, slot, facing }: { x: number; feet: number; id: string; slot: number; facing: 1 | -1 }) {
  const s = slot % 3;
  const eye = facing * 3;
  return (
    <g id={`l1_sprite_ghost_${id}`} transform={`translate(${x} ${feet - 35})`} opacity=".82" className="ghost-flicker">
      <rect x="-24" y="-59" width="48" height="64" rx="10" fill={GHOST_FILLS[s]} />
      <rect x="-18" y="5" width="12" height="12" fill={GHOST_FILLS[s]} />
      <rect x="6" y="5" width="12" height="12" fill={GHOST_FILLS[s]} />
      <rect x={-12 + eye} y="-43" width="8" height="10" fill={GHOST_EYES[s]} />
      <rect x={6 + eye} y="-43" width="8" height="10" fill={GHOST_EYES[s]} />
      <text x="0" y="-69" textAnchor="middle" className="pixel-text ghost-hash" style={{ fill: GHOST_TEXT[s] }}>
        {id}
      </text>
    </g>
  );
}

/** Beetle. (x, bottom) = centre and bottom of its hitbox. */
export function Bug({
  x,
  bottom,
  dir,
  squashed,
  small,
  tick,
}: {
  x: number;
  bottom: number;
  dir: 1 | -1;
  squashed: boolean;
  small: boolean;
  tick: number;
}) {
  const step = Math.floor(tick / 8) % 2;
  const legs = step ? 'M-13 8 l-15 12 M-4 9 l-6 15 M13 8 l15 12 M4 9 l6 15' : 'M-13 8 l-10 15 M-4 9 l-10 12 M13 8 l10 15 M4 9 l10 12';
  const scale = small ? 0.55 : 1;
  return (
    <g
      id="l1_sprite_bug_beetle"
      transform={`translate(${x} ${bottom - (squashed ? 5 : 24) * scale}) scale(${dir * scale} ${scale})`}
    >
      <rect x="-23" y={squashed ? -4 : -15} width="46" height={squashed ? 9 : 25} rx="5" fill="#202432" />
      <rect x="-6" y={squashed ? -4 : -15} width="5" height={squashed ? 9 : 25} fill="#e35d53" />
      <rect x="-29" y={squashed ? 3 : -11} width="7" height="5" fill="#202432" />
      <rect x="22" y={squashed ? 3 : -11} width="7" height="5" fill="#202432" />
      {!squashed && (
        <>
          <path d={legs} stroke="#202432" strokeWidth="5" />
          <rect x="-1" y="-20" width="7" height="7" fill="#f7d36f" />
          <rect x="12" y="-20" width="7" height="7" fill="#f7d36f" />
        </>
      )}
    </g>
  );
}

// -------------------------------------------------------------------- HUD

export interface HudView {
  levelNumber: string;
  title: string;
  venue: string;
  time: string;
  starChip: string | null;
  maxCommits: number;
  /** Ghost slot -> filled? */
  slots: (number | null)[];
  recording: { secondsLeft: number; fraction: number } | null;
}

export function HUD({ v }: { v: HudView }) {
  return (
    <g id="l1_hud">
      <g transform="translate(32 28)">
        <rect width="376" height="77" fill="#202333" stroke="#5a5e73" strokeWidth="4" />
        <rect x="10" y="10" width="52" height="57" fill="#55d9d2" />
        <text x="36" y="48" textAnchor="middle" className="pixel-text hud-number">
          {v.levelNumber}
        </text>
        <text x="78" y="34" className="pixel-text hud-title">
          {v.title}
        </text>
        <text x="78" y="58" className="pixel-text hud-venue">
          {v.venue}
        </text>
      </g>
      <g transform="translate(878 28)">
        <rect width="370" height="77" fill="#202333" stroke="#5a5e73" strokeWidth="4" />
        <text x="20" y="34" className="pixel-text hud-label">
          TIME
        </text>
        <text x="18" y="62" className="pixel-text hud-time">
          {v.time}
        </text>
        {v.starChip && (
          <>
            <rect x="174" y="14" width="180" height="48" fill="#4c4051" />
            <text x="190" y="45" className="pixel-text hud-chip">
              {v.starChip}
            </text>
          </>
        )}
      </g>
      {v.recording && (
        <g id="l1_hud_rec" transform="translate(32 594)">
          <rect width="288" height="40" fill="#202333" stroke="#e86655" strokeWidth="4" />
          <rect x="14" y="13" width="14" height="14" fill="#e86655" className="rec-blink" />
          <text x="38" y="26" className="pixel-text hud-label">
            REC
          </text>
          <rect x="90" y="14" width="140" height="12" fill="#34384b" />
          <rect x="90" y="14" width={Math.round(140 * v.recording.fraction)} height="12" fill="#e86655" />
          <text x="272" y="26" textAnchor="end" className="pixel-text hud-label">
            {v.recording.secondsLeft.toFixed(1)}s
          </text>
        </g>
      )}
      <g transform="translate(32 642)">
        <rect width="288" height="54" fill="#202333" stroke="#5a5e73" strokeWidth="4" />
        <text x="16" y="34" className="pixel-text hud-label">
          COMMITS
        </text>
        {v.slots.slice(0, v.maxCommits).map((slot, i) => (
          <g key={i} transform={`translate(${155 + i * 41} 11)`}>
            <rect width="31" height="31" fill="#34384b" stroke="#6f7387" strokeWidth="3" />
            <circle cx="15.5" cy="15.5" r="6" fill={slot === null ? '#555b70' : GHOST_FILLS[slot % 3]} />
          </g>
        ))}
      </g>
      <g transform="translate(1078 652)">
        <rect width="170" height="44" fill="#202333" stroke="#5a5e73" strokeWidth="4" />
        <rect x="10" y="8" width="30" height="28" fill="#4a4f65" />
        <text x="25" y="29" textAnchor="middle" className="pixel-text key-r">
          R
        </text>
        <text x="51" y="29" className="pixel-text hud-label">
          COMMIT
        </text>
      </g>
    </g>
  );
}

/** Hint toast. Grows to fit its text and stays centred (the design's box is 530 wide). */
export function Toast({ children, tone = 'hint' }: { children: ReactNode; tone?: 'hint' | 'alert' }) {
  const ref = useRef<SVGTextElement>(null);
  const [textW, setTextW] = useState(440);
  useLayoutEffect(() => {
    const t = ref.current;
    if (t) setTextW(Math.ceil(t.getComputedTextLength()));
  }, [children]);
  const w = Math.max(530, textW + 70 + 26);
  const accent = tone === 'alert' ? '#e86655' : '#f2d387';
  return (
    <g id="l1_hint_toast" transform={`translate(${Math.round((SCREEN_W - w) / 2)} 124)`}>
      <rect width={w} height="64" fill="#202333" stroke={accent} strokeWidth="4" />
      <rect x="13" y="13" width="38" height="38" fill={accent} />
      <text x="32" y="40" textAnchor="middle" className="pixel-text toast-mark">
        !
      </text>
      <text ref={ref} x="70" y="40" className="pixel-text toast-text">
        {children}
      </text>
    </g>
  );
}

/** Red "you died" banner, shown briefly after a bug hit. */
export function DeathFlash() {
  return (
    <g id="l1_death_flash" transform="translate(340 300)">
      <rect width="600" height="96" fill="#202333" stroke="#e86655" strokeWidth="6" />
      <text x="300" y="44" textAnchor="middle" className="pixel-text death-title">
        SEGMENTATION FAULT
      </text>
      <text x="300" y="74" textAnchor="middle" className="pixel-text intro-hint">
        RESPAWNING AT START · GHOSTS KEPT
      </text>
    </g>
  );
}

// ---------------------------------------------------------------- screens

/** Static button + ghost pictogram from the design's intro card. */
function IntroGhostOnButton() {
  return (
    <g transform="translate(273 267)">
      <g transform="translate(0 53)" opacity=".82" className="ghost-flicker">
        <rect x="-24" y="-59" width="48" height="64" rx="10" fill="#70e69a" />
        <rect x="-18" y="5" width="12" height="12" fill="#70e69a" />
        <rect x="6" y="5" width="12" height="12" fill="#70e69a" />
        <rect x="-12" y="-43" width="8" height="10" fill="#193b38" />
        <rect x="6" y="-43" width="8" height="10" fill="#193b38" />
        <text x="0" y="-69" textAnchor="middle" className="pixel-text ghost-hash">
          a1f3c9
        </text>
      </g>
      <StartButton pressed x={76} />
      <path d="M22 20 H70" stroke="#f2d387" strokeWidth="5" strokeDasharray="8 6" />
    </g>
  );
}

export function IntroOverlay({ levelLabel, title }: { levelLabel: string; title: string }) {
  return (
    <g id="l1_screen_intro">
      <rect width={SCREEN_W} height={SCREEN_H} fill="#171925" opacity=".7" />
      <g transform="translate(290 155)">
        <rect x="10" y="10" width="700" height="390" fill="#121522" opacity=".45" />
        <rect width="700" height="390" fill="#25283a" stroke="#f1cf79" strokeWidth="8" />
        <rect x="26" y="26" width="648" height="338" fill="none" stroke="#555a70" strokeWidth="4" />
        <text x="350" y="91" textAnchor="middle" className="pixel-text intro-kicker">
          {levelLabel}
        </text>
        <text x="350" y="148" textAnchor="middle" className="pixel-text intro-title">
          {title}
        </text>
        <rect x="107" y="175" width="486" height="4" fill="#55d9d2" />
        <text x="350" y="225" textAnchor="middle" className="pixel-text intro-goal">
          OPEN THE SPORTS-ROOM GATE
        </text>
        <IntroGhostOnButton />
        <text x="350" y="345" textAnchor="middle" className="pixel-text intro-hint">
          HOLD · COMMIT · RELAY
        </text>
      </g>
      <text x={SCREEN_W / 2} y="600" textAnchor="middle" className="pixel-text prompt-text prompt-blink">
        PRESS ENTER TO START
      </text>
    </g>
  );
}

export interface ResultView {
  levelLabel: string;
  title: string;
  time: string;
  ghostsUsed: number;
  deaths: number;
  star: boolean;
  missNote: string;
  upload: 'sending' | 'sent' | 'queued';
  /** Shown as "N · NEXT LEVEL" when there is one. */
  hasNext: boolean;
}

const UPLOAD_TEXT: Record<ResultView['upload'], string> = {
  sending: 'SAVING RUN…',
  sent: 'RUN SAVED TO SERVER',
  queued: 'SERVER OFFLINE · RUN SAVED ON THIS LAPTOP',
};

export function ResultOverlay({ v }: { v: ResultView }) {
  const missed = !v.star;
  return (
    <g id={missed ? 'l1_screen_star_missed' : 'l1_screen_level_complete'}>
      <rect width={SCREEN_W} height={SCREEN_H} fill="#171925" opacity=".72" />
      <g transform="translate(350 110)">
        <rect x="10" y="10" width="580" height="465" fill="#11131d" opacity=".45" />
        <rect width="580" height="465" fill="#25283a" stroke={missed ? '#a67582' : '#f1cf79'} strokeWidth="8" />
        <text x="290" y="74" textAnchor="middle" className="pixel-text result-kicker">
          {v.levelLabel}
        </text>
        <text x="290" y="130" textAnchor="middle" className="pixel-text result-title">
          {v.title}
        </text>
        {!missed && (
          <g transform="translate(290 184)">
            <path d="M0-42 L13-14 L44-12 L20 8 L27 39 L0 23 L-27 39 L-20 8 L-44-12 L-13-14Z" fill="#f5ce62" className="star-earned" />
            <path d="M0-28 L8-8 L29-7 L13 5 L18 26 L0 15 L-18 26 L-13 5 L-29-7 L-8-8Z" fill="#fff0a9" />
          </g>
        )}
        {missed && (
          <g transform="translate(290 181)" opacity=".52">
            <path d="M0-42 L13-14 L44-12 L20 8 L27 39 L0 23 L-27 39 L-20 8 L-44-12 L-13-14Z" fill="#767b8d" />
            <path d="M-38-37 L38 37 M38-37 L-38 37" stroke="#d17670" strokeWidth="8" />
          </g>
        )}
        <text x="290" y="270" textAnchor="middle" className="pixel-text result-time">
          {v.time}
        </text>
        <text x="290" y="301" textAnchor="middle" className="pixel-text result-label">
          FINISH TIME
        </text>
        <rect x="72" y="330" width="436" height="54" fill="#1c1e2c" />
        <text x="92" y="364" className="pixel-text result-stat">
          GHOSTS USED
        </text>
        <text x="270" y="364" textAnchor="end" className="pixel-text result-stat-value">
          {v.ghostsUsed}
        </text>
        <text x="310" y="364" className="pixel-text result-stat">
          DEATHS
        </text>
        <text x="472" y="364" textAnchor="end" className="pixel-text result-stat-value" style={v.deaths ? { fill: '#e98a7b' } : undefined}>
          {v.deaths}
        </text>
        <text x="290" y="424" textAnchor="middle" className={`pixel-text ${missed ? 'missed-note' : 'earned-note'}`}>
          {missed ? v.missNote : '★ STAR EARNED'}
        </text>
      </g>
      <text x={SCREEN_W / 2} y="625" textAnchor="middle" className={`pixel-text upload-text upload-${v.upload}`}>
        {UPLOAD_TEXT[v.upload]}
      </text>
      <text x={SCREEN_W / 2} y="665" textAnchor="middle" className="pixel-text prompt-text prompt-blink" style={{ whiteSpace: 'pre' }}>
        {v.hasNext ? 'ENTER · RUN AGAIN    N · NEXT LEVEL' : 'PRESS ENTER TO RUN AGAIN'}
      </text>
    </g>
  );
}
