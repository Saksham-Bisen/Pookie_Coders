import { useState } from "react"

type Screen = "intro" | "moment_a" | "moment_b" | "complete" | "missed"

interface PositionedProps {
  x: number
  y?: number
}

interface GateProps {
  open?: boolean
  x?: number
}

interface BugProps {
  x?: number
  squashed?: boolean
}

const screens: {
  id: Screen
  label: string
  detail: string
}[] = [
  { id: "intro", label: "01", detail: "Intro" },
  { id: "moment_a", label: "02", detail: "Button test" },
  { id: "moment_b", label: "03", detail: "Ghost relay" },
  { id: "complete", label: "04", detail: "Complete" },
  { id: "missed", label: "05", detail: "Star missed" },
]

function PixelCloud({
  x,
  y,
  scale = 1,
}: {
  x: number
  y: number
  scale?: number
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="var(--sky-cloud)"
      opacity=".75"
    >
      <rect x="16" y="0" width="48" height="8" />
      <rect x="8" y="8" width="80" height="16" />
      <rect x="0" y="16" width="104" height="8" />
      <rect x="24" y="24" width="64" height="8" opacity=".55" />
    </g>
  )
}

function Crowd({ x = 0 }: { x?: number }) {
  const colors = [
    "#ffd46a",
    "#55d9d2",
    "#f47b70",
    "#f6a6c1",
    "#d3e36d",
    "#9f8dd9",
  ]
  return (
    <g id="l1_bg_crowd" transform={`translate(${x} 0)`}>
      {Array.from({ length: 22 }, (_, i) => {
        const cx = 34 + i * 54
        const cy = 287 + (i % 3) * 8
        const color = colors[i % colors.length]
        return (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <rect x="0" y="0" width="12" height="12" fill="#362842" />
            <rect x="-2" y="12" width="16" height="18" fill={color} />
            <rect
              className={`cheer-arm-left crowd-delay-${i % 2}`}
              x="-8"
              y="12"
              width="6"
              height="16"
              fill={color}
            />
            <rect
              className={`cheer-arm-right crowd-delay-${i % 2}`}
              x="14"
              y="12"
              width="6"
              height="16"
              fill={color}
            />
          </g>
        )
      })}
    </g>
  )
}

function Background({ wide = false }: { wide?: boolean }) {
  const width = wide ? 4096 : 1280
  return (
    <g>
      <defs>
        <linearGradient
          id={wide ? "l1_sky_wide" : "l1_sky"}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0" stopColor="#f98982" />
          <stop offset=".58" stopColor="#f6ad72" />
          <stop offset="1" stopColor="#f5cf82" />
        </linearGradient>
        <pattern
          id="l1_dither"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <rect width="3" height="3" fill="#ffd192" opacity=".32" />
          <rect x="6" y="6" width="3" height="3" fill="#a84f78" opacity=".18" />
        </pattern>
        <pattern
          id="l1_grass"
          width="32"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <rect width="32" height="16" fill="#75984c" />
          <rect x="2" y="4" width="4" height="3" fill="#8dad56" />
          <rect x="20" y="12" width="5" height="3" fill="#5f8442" />
        </pattern>
      </defs>
      <rect
        id="l1_bg_sky"
        width={width}
        height="480"
        fill={`url(#${wide ? "l1_sky_wide" : "l1_sky"})`}
      />
      <rect width={width} height="480" fill="url(#l1_dither)" />
      <PixelCloud x={wide ? 430 : 110} y={wide ? 104 : 104} scale={1.4} />
      <PixelCloud x={wide ? 1850 : 742} y={148} scale={0.9} />
      {wide && <PixelCloud x={3170} y={76} scale={1.25} />}

      <g id="l1_bg_college" fill="#a85566" opacity=".56">
        <rect x="0" y="310" width={width} height="102" />
        {Array.from({ length: wide ? 42 : 14 }, (_, i) => (
          <rect
            key={i}
            x={i * 104 + 24}
            y={334}
            width="32"
            height="35"
            fill="#f2a474"
            opacity=".58"
          />
        ))}
        <rect x={wide ? 3360 : 1060} y="245" width="126" height="167" />
        <rect x={wide ? 3378 : 1078} y="222" width="90" height="23" />
      </g>

      <g id="l1_bg_trees" fill="#435d44">
        {Array.from({ length: wide ? 68 : 22 }, (_, i) => (
          <g
            key={i}
            transform={`translate(${i * 68 - 20} ${330 + (i % 4) * 5})`}
          >
            <rect x="23" y="31" width="8" height="61" fill="#594947" />
            <rect x="0" y="18" width="54" height="38" />
            <rect x="10" y="0" width="35" height="52" fill="#4e7049" />
          </g>
        ))}
      </g>

      <g
        id="l1_bg_water_tank"
        transform={`translate(${wide ? 2960 : 910} 270)`}
        fill="#364c50"
      >
        <rect x="0" y="0" width="92" height="46" />
        <rect x="10" y="-10" width="72" height="10" />
        <rect x="12" y="46" width="8" height="88" />
        <rect x="72" y="46" width="8" height="88" />
        <rect x="0" y="88" width="92" height="8" />
      </g>

      <g id="l1_bg_stands">
        <rect x="0" y="390" width={width} height="25" fill="#2d3140" />
        <rect x="0" y="415" width={width} height="103" fill="#51546a" />
        <rect x="0" y="427" width={width} height="8" fill="#73778d" />
        <rect x="0" y="475" width={width} height="8" fill="#73778d" />
        <rect x="0" y="511" width={width} height="16" fill="#2d3140" />
        <Crowd />
        {wide && (
          <>
            <Crowd x={1188} />
            <Crowd x={2376} />
            <Crowd x={3564} />
          </>
        )}
        <g transform={`translate(${wide ? 1472 : 340} 369)`}>
          <rect
            x="0"
            y="0"
            width="600"
            height="54"
            fill="#f5df9a"
            stroke="#272735"
            strokeWidth="8"
          />
          <text
            x="300"
            y="36"
            className="pixel-text banner-text"
            textAnchor="middle"
          >
            DRONACHARYA SPORTS GROUND
          </text>
        </g>
      </g>
      <rect
        id="l1_tile_grass"
        x="0"
        y="527"
        width={width}
        height="61"
        fill="url(#l1_grass)"
      />
    </g>
  )
}

function Scoreboard({ x = 72 }: { x?: number }) {
  return (
    <g id="l1_scoreboard" transform={`translate(${x} 316)`}>
      <rect
        width="205"
        height="112"
        rx="2"
        fill="#202536"
        stroke="#f3cd75"
        strokeWidth="7"
      />
      <rect x="14" y="15" width="177" height="24" fill="#343b4d" />
      <text
        x="102"
        y="33"
        className="pixel-text board-small"
        textAnchor="middle"
      >
        INTER COLLEGE
      </text>
      <text
        x="102"
        y="72"
        className="pixel-text board-main"
        textAnchor="middle"
      >
        BIT <tspan fill="#e86655">vs</tspan> BUGS
      </text>
      <rect x="18" y="88" width="68" height="7" fill="#55d9d2" />
      <rect x="119" y="88" width="68" height="7" fill="#e86655" />
      <rect x="26" y="112" width="9" height="99" fill="#343b4d" />
      <rect x="170" y="112" width="9" height="99" fill="#343b4d" />
    </g>
  )
}

function Track({ wide = false }: { wide?: boolean }) {
  const width = wide ? 4096 : 1280
  return (
    <g id="l1_tile_track">
      <rect
        x="0"
        y="588"
        width={width}
        height={wide ? 180 : 132}
        fill="#b94e4e"
      />
      <rect x="0" y="592" width={width} height="12" fill="#e98468" />
      <rect
        id="l1_tile_track_edge"
        x="0"
        y="576"
        width={width}
        height="15"
        fill="#e9d8a4"
      />
      <rect
        x="0"
        y="591"
        width={width}
        height="5"
        fill="#554551"
        opacity=".5"
      />
      <rect
        id="l1_tile_lane_line"
        x="0"
        y="655"
        width={width}
        height="6"
        fill="#f6ddb1"
        opacity=".85"
      />
      <rect
        x="0"
        y="711"
        width={width}
        height="6"
        fill="#f6ddb1"
        opacity=".85"
      />
      <g opacity=".14">
        {Array.from({ length: wide ? 64 : 20 }, (_, i) => (
          <rect
            key={i}
            x={i * 64}
            y="604"
            width="3"
            height="164"
            fill="#612e3f"
          />
        ))}
      </g>
    </g>
  )
}

function Wire({
  powered = false,
  wide = false,
}: {
  powered?: boolean
  wide?: boolean
}) {
  const end = wide ? 3770 : 1147
  const start = wide ? 344 : 386
  return (
    <g id="l1_wire_cyan">
      <path
        d={`M ${start} 575 v-18 H ${end} v-30`}
        fill="none"
        stroke={powered ? "#b8fff2" : "#1a7483"}
        strokeWidth={powered ? 12 : 8}
        strokeLinecap="square"
        className={powered ? "wire-powered" : ""}
      />
      <path
        d={`M ${start} 575 v-18 H ${end} v-30`}
        fill="none"
        stroke="#4ae4da"
        strokeWidth="4"
        strokeDasharray="16 8"
        className={powered ? "wire-flow" : ""}
      />
      {Array.from({ length: wide ? 10 : 4 }, (_, i) => {
        const cx = start + ((end - start) / (wide ? 9 : 3)) * i
        return (
          <rect
            key={i}
            x={cx - 6}
            y="551"
            width="12"
            height="12"
            fill="#253b48"
            stroke="#4ae4da"
            strokeWidth="3"
          />
        )
      })}
    </g>
  )
}

function StartButton({
  pressed = false,
  x = 386,
}: {
  pressed?: boolean
  x?: number
}) {
  return (
    <g
      id={
        pressed ? "l1_object_start_button_pressed" : "l1_object_start_button_up"
      }
      transform={`translate(${x} 574)`}
    >
      <rect x="-38" y="16" width="76" height="14" fill="#563944" />
      <rect
        x="-30"
        y={pressed ? 10 : 0}
        width="60"
        height={pressed ? 13 : 23}
        fill={pressed ? "#40aa79" : "#e55d51"}
      />
      <rect
        x="-22"
        y={pressed ? 10 : 0}
        width="44"
        height="7"
        fill={pressed ? "#80e3a7" : "#ff8a68"}
      />
    </g>
  )
}

function StartLine({ x = 325 }: { x?: number }) {
  return (
    <g id="l1_tile_start_line" transform={`translate(${x} 0)`}>
      <rect x="0" y="588" width="14" height="132" fill="#f8e8c7" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x={i % 2 ? 0 : 7}
          y={588 + i * 16}
          width="7"
          height="16"
          fill="#303142"
        />
      ))}
      <text
        transform="translate(-12 707) rotate(-90)"
        className="pixel-text track-label"
      >
        START
      </text>
    </g>
  )
}

function Hurdle({ x, y = 615 }: PositionedProps) {
  return (
    <g id="l1_object_hurdle" transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="83" height="11" fill="#f5eee0" />
      <rect x="0" y="0" width="23" height="11" fill="#e65a52" />
      <rect x="44" y="0" width="22" height="11" fill="#e65a52" />
      <rect x="8" y="11" width="8" height="51" fill="#f5eee0" />
      <rect x="67" y="11" width="8" height="51" fill="#f5eee0" />
      <rect x="0" y="57" width="27" height="6" fill="#342f3d" />
      <rect x="58" y="57" width="27" height="6" fill="#342f3d" />
    </g>
  )
}

function Gate({ open = false, x = 1120 }: GateProps) {
  return (
    <g
      id={open ? "l1_object_gate_open" : "l1_object_gate_closed"}
      transform={`translate(${x} 432)`}
    >
      <rect x="-25" y="0" width="188" height="28" fill="#27313d" />
      <text x="69" y="20" textAnchor="middle" className="pixel-text gate-label">
        SPORTS ROOM
      </text>
      <rect
        id="l1_tile_fence"
        x="-25"
        y="28"
        width="188"
        height="150"
        fill="#3b424f"
      />
      <g stroke="#7f8890" strokeWidth="4" opacity=".75">
        {Array.from({ length: 10 }, (_, i) => (
          <path key={`a${i}`} d={`M ${i * 22 - 35} 28 l85 150`} />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <path key={`b${i}`} d={`M ${i * 22 - 35} 178 l85 -150`} />
        ))}
      </g>
      <rect x="-33" y="18" width="12" height="176" fill="#272c37" />
      <rect x="159" y="18" width="12" height="176" fill="#272c37" />
      <g id="l1_gate_panel" transform="translate(-61 57)">
        <rect
          width="38"
          height="55"
          fill="#252a36"
          stroke="#737c84"
          strokeWidth="4"
        />
        <rect
          x="11"
          y="10"
          width="16"
          height="16"
          fill={open ? "#75e788" : "#ef6256"}
          className={open ? "lock-open" : ""}
        />
        <rect x="11" y="34" width="16" height="8" fill="#151b25" />
      </g>
      <g id="l1_tile_gate" className={open ? "gate-open" : ""}>
        <rect x="-18" y="31" width="88" height="147" fill="#59616a" />
        <g stroke="#b7bdaf" strokeWidth="4">
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M ${i * 20 - 30} 32 l78 146`} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M ${i * 20 - 30} 178 l78 -146`} />
          ))}
        </g>
        <rect x="-18" y="31" width="7" height="147" fill="#242c37" />
        <rect x="63" y="31" width="7" height="147" fill="#242c37" />
      </g>
    </g>
  )
}

function Bit({
  x,
  y = 558,
  jumping = false,
}: {
  x: number
  y?: number
  jumping?: boolean
}) {
  return (
    <g id="l1_sprite_bit" transform={`translate(${x} ${y})`}>
      <g className={jumping ? "bit-jump" : "bit-idle"}>
        <rect x="-23" y="-62" width="46" height="45" rx="8" fill="#242638" />
        <rect x="-29" y="-54" width="6" height="20" fill="#242638" />
        <rect x="23" y="-54" width="6" height="20" fill="#242638" />
        <rect x="-14" y="-47" width="8" height="8" fill="#f7e7b2" />
        <rect x="6" y="-47" width="8" height="8" fill="#f7e7b2" />
        <rect x="-12" y="-27" width="24" height="5" fill="#55d9d2" />
        <rect x="-20" y="-17" width="40" height="31" fill="#373b54" />
        <rect x="-28" y="-12" width="8" height="27" fill="#f1bf75" />
        <rect x="20" y="-12" width="8" height="27" fill="#f1bf75" />
        <rect x="-19" y="14" width="14" height="19" fill="#242638" />
        <rect x="5" y="14" width="14" height="19" fill="#242638" />
        <rect x="-22" y="29" width="18" height="6" fill="#69dcd1" />
        <rect x="4" y="29" width="18" height="6" fill="#69dcd1" />
      </g>
    </g>
  )
}

function Ghost({ x, y = 558 }: PositionedProps) {
  return (
    <g
      id="l1_sprite_ghost_a1f3c9"
      transform={`translate(${x} ${y})`}
      opacity=".82"
      className="ghost-flicker"
    >
      <rect x="-24" y="-59" width="48" height="64" rx="10" fill="#70e69a" />
      <rect x="-18" y="5" width="12" height="12" fill="#70e69a" />
      <rect x="6" y="5" width="12" height="12" fill="#70e69a" />
      <rect x="-12" y="-43" width="8" height="10" fill="#193b38" />
      <rect x="6" y="-43" width="8" height="10" fill="#193b38" />
      <text x="0" y="-69" textAnchor="middle" className="pixel-text ghost-hash">
        a1f3c9
      </text>
    </g>
  )
}

function Bug({ x = 790, squashed = false }: BugProps) {
  return (
    <g
      id="l1_sprite_bug_beetle"
      transform={`translate(${x} ${squashed ? 672 : 643})`}
    >
      <g className={squashed ? "bug-squashed" : "bug-walk"}>
        <rect
          x="-23"
          y={squashed ? -4 : -15}
          width="46"
          height={squashed ? 9 : 25}
          rx="5"
          fill="#202432"
        />
        <rect
          x="-6"
          y={squashed ? -4 : -15}
          width="5"
          height={squashed ? 9 : 25}
          fill="#e35d53"
        />
        <rect
          x="-29"
          y={squashed ? 3 : -11}
          width="7"
          height="5"
          fill="#202432"
        />
        <rect
          x="22"
          y={squashed ? 3 : -11}
          width="7"
          height="5"
          fill="#202432"
        />
        {!squashed && (
          <>
            <path
              d="M-13 8 l-15 12 M-4 9 l-6 15 M13 8 l15 12 M4 9 l6 15"
              stroke="#202432"
              strokeWidth="5"
            />
            <rect x="-12" y="-20" width="7" height="7" fill="#f7d36f" />
            <rect x="5" y="-20" width="7" height="7" fill="#f7d36f" />
          </>
        )}
      </g>
    </g>
  )
}

function HUD() {
  return (
    <g id="l1_hud">
      <g transform="translate(32 28)">
        <rect
          width="376"
          height="77"
          fill="#202333"
          stroke="#5a5e73"
          strokeWidth="4"
        />
        <rect x="10" y="10" width="52" height="57" fill="#55d9d2" />
        <text
          x="36"
          y="48"
          textAnchor="middle"
          className="pixel-text hud-number"
        >
          1
        </text>
        <text x="78" y="34" className="pixel-text hud-title">
          L1 · RELAY RACE
        </text>
        <text x="78" y="58" className="pixel-text hud-venue">
          DRONACHARYA SPORTS GROUND
        </text>
      </g>
      <g transform="translate(878 28)">
        <rect
          width="370"
          height="77"
          fill="#202333"
          stroke="#5a5e73"
          strokeWidth="4"
        />
        <text x="20" y="34" className="pixel-text hud-label">
          TIME
        </text>
        <text x="18" y="62" className="pixel-text hud-time">
          0:18.62
        </text>
        <rect x="174" y="14" width="180" height="48" fill="#4c4051" />
        <text x="190" y="45" className="pixel-text hud-chip">
          ★ &lt; 0:30
        </text>
      </g>
      <g transform="translate(32 642)">
        <rect
          width="288"
          height="54"
          fill="#202333"
          stroke="#5a5e73"
          strokeWidth="4"
        />
        <text x="16" y="34" className="pixel-text hud-label">
          COMMITS
        </text>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${155 + i * 41} 11)`}>
            <rect
              width="31"
              height="31"
              fill="#34384b"
              stroke="#6f7387"
              strokeWidth="3"
            />
            <circle
              cx="15.5"
              cy="15.5"
              r="6"
              fill={i === 0 ? "#70e69a" : "#555b70"}
            />
          </g>
        ))}
      </g>
      <g transform="translate(1078 652)">
        <rect
          width="170"
          height="44"
          fill="#202333"
          stroke="#5a5e73"
          strokeWidth="4"
        />
        <rect x="10" y="8" width="30" height="28" fill="#4a4f65" />
        <text x="25" y="29" textAnchor="middle" className="pixel-text key-r">
          R
        </text>
        <text x="51" y="29" className="pixel-text hud-label">
          COMMIT
        </text>
      </g>
    </g>
  )
}

function Toast({ children }: { children: React.ReactNode }) {
  return (
    <g id="l1_hint_toast" transform="translate(375 124)">
      <rect
        width="530"
        height="64"
        fill="#202333"
        stroke="#f2d387"
        strokeWidth="4"
      />
      <rect x="13" y="13" width="38" height="38" fill="#f2d387" />
      <text x="32" y="40" textAnchor="middle" className="pixel-text toast-mark">
        !
      </text>
      <text x="70" y="40" className="pixel-text toast-text">
        {children}
      </text>
    </g>
  )
}

function IntroOverlay() {
  return (
    <g id="l1_screen_intro">
      <rect width="1280" height="720" fill="#171925" opacity=".7" />
      <g transform="translate(290 155)">
        <rect
          x="10"
          y="10"
          width="700"
          height="390"
          fill="#121522"
          opacity=".45"
        />
        <rect
          width="700"
          height="390"
          fill="#25283a"
          stroke="#f1cf79"
          strokeWidth="8"
        />
        <rect
          x="26"
          y="26"
          width="648"
          height="338"
          fill="none"
          stroke="#555a70"
          strokeWidth="4"
        />
        <text
          x="350"
          y="91"
          textAnchor="middle"
          className="pixel-text intro-kicker"
        >
          LEVEL 1
        </text>
        <text
          x="350"
          y="148"
          textAnchor="middle"
          className="pixel-text intro-title"
        >
          RELAY RACE
        </text>
        <rect x="107" y="175" width="486" height="4" fill="#55d9d2" />
        <text
          x="350"
          y="225"
          textAnchor="middle"
          className="pixel-text intro-goal"
        >
          OPEN THE SPORTS-ROOM GATE
        </text>
        <g transform="translate(273 267)">
          <Ghost x={0} y={53} />
          <StartButton pressed x={76} />
          <path
            d="M22 20 H70"
            stroke="#f2d387"
            strokeWidth="5"
            strokeDasharray="8 6"
          />
        </g>
        <text
          x="350"
          y="345"
          textAnchor="middle"
          className="pixel-text intro-hint"
        >
          HOLD · COMMIT · RELAY
        </text>
      </g>
    </g>
  )
}

function ResultOverlay({ missed = false }: { missed?: boolean }) {
  return (
    <g id={missed ? "l1_screen_star_missed" : "l1_screen_level_complete"}>
      <rect width="1280" height="720" fill="#171925" opacity=".72" />
      <g transform="translate(350 125)">
        <rect
          x="10"
          y="10"
          width="580"
          height="465"
          fill="#11131d"
          opacity=".45"
        />
        <rect
          width="580"
          height="465"
          fill="#25283a"
          stroke={missed ? "#a67582" : "#f1cf79"}
          strokeWidth="8"
        />
        <text
          x="290"
          y="74"
          textAnchor="middle"
          className="pixel-text result-kicker"
        >
          LEVEL 1
        </text>
        <text
          x="290"
          y="130"
          textAnchor="middle"
          className="pixel-text result-title"
        >
          RELAY COMPLETE
        </text>
        {!missed && (
          <g transform="translate(290 184)">
            <path
              d="M0-42 L13-14 L44-12 L20 8 L27 39 L0 23 L-27 39 L-20 8 L-44-12 L-13-14Z"
              fill="#f5ce62"
              className="star-earned"
            />
            <path
              d="M0-28 L8-8 L29-7 L13 5 L18 26 L0 15 L-18 26 L-13 5 L-29-7 L-8-8Z"
              fill="#fff0a9"
            />
          </g>
        )}
        {missed && (
          <g transform="translate(290 181)" opacity=".52">
            <path
              d="M0-42 L13-14 L44-12 L20 8 L27 39 L0 23 L-27 39 L-20 8 L-44-12 L-13-14Z"
              fill="#767b8d"
            />
            <path
              d="M-38-37 L38 37 M38-37 L-38 37"
              stroke="#d17670"
              strokeWidth="8"
            />
          </g>
        )}
        <text
          x="290"
          y="270"
          textAnchor="middle"
          className="pixel-text result-time"
        >
          {missed ? "0:41.02" : "0:24.18"}
        </text>
        <text
          x="290"
          y="301"
          textAnchor="middle"
          className="pixel-text result-label"
        >
          FINISH TIME
        </text>
        <rect x="72" y="330" width="436" height="54" fill="#1c1e2c" />
        <text x="92" y="364" className="pixel-text result-stat">
          GHOSTS USED
        </text>
        <text
          x="472"
          y="364"
          textAnchor="end"
          className="pixel-text result-stat-value"
        >
          1
        </text>
        <text
          x="290"
          y="424"
          textAnchor="middle"
          className={`pixel-text ${missed ? "missed-note" : "earned-note"}`}
        >
          {missed ? "RUN UNDER 0:30 FOR THE STAR" : "★ STAR EARNED"}
        </text>
      </g>
    </g>
  )
}

function GameScene({ screen }: { screen: Screen }) {
  const powered =
    screen === "moment_a" ||
    screen === "moment_b" ||
    screen === "complete" ||
    screen === "missed"
  const open = powered
  return (
    <svg
      className="game-frame"
      viewBox="0 0 1280 720"
      role="img"
      aria-label={`Level 1 Relay Race, ${screen.replace("_", " ")}`}
    >
      <Background />
      <Scoreboard />
      <Track />
      <Wire powered={powered} />
      <StartLine />
      <StartButton pressed={powered} />
      <Hurdle x={610} />
      <Hurdle x={910} />
      <Gate open={open} />
      <Bug
        x={screen === "moment_b" ? 790 : 822}
        squashed={screen === "moment_b"}
      />
      {screen === "moment_a" && <Bit x={386} />}
      {screen === "moment_b" && (
        <>
          <Ghost x={386} />
          <Bit x={790} y={616} jumping />
        </>
      )}
      {(screen === "complete" || screen === "missed" || screen === "intro") && (
        <Bit x={500} />
      )}
      <HUD />
      {screen === "intro" && <IntroOverlay />}
      {screen === "moment_a" && (
        <Toast>Gate open... but only while you stand here.</Toast>
      )}
      {screen === "complete" && <ResultOverlay />}
      {screen === "missed" && <ResultOverlay missed />}
    </svg>
  )
}

function FullMap() {
  return (
    <svg
      className="full-map"
      viewBox="0 0 4096 768"
      role="img"
      aria-label="Full Level 1 developer map, 64 by 12 tiles"
    >
      <Background wide />
      <Scoreboard x={132} />
      <Track wide />
      <Wire powered wide />
      <StartLine x={282} />
      <StartButton pressed x={344} />
      <Hurdle x={1260} y={628} />
      <Hurdle x={2330} y={628} />
      <Bug x={1960} />
      <Ghost x={344} y={570} />
      <Bit x={2050} y={638} jumping />
      <Gate open x={3770} />
      <g id="l1_tile_finish_line" transform="translate(3680 0)">
        <rect x="0" y="588" width="18" height="180" fill="#f8e8c7" />
        {Array.from({ length: 11 }, (_, i) => (
          <rect
            key={i}
            x={i % 2 ? 0 : 9}
            y={588 + i * 16}
            width="9"
            height="16"
            fill="#303142"
          />
        ))}
        <text
          transform="translate(-12 742) rotate(-90)"
          className="pixel-text track-label"
        >
          FINISH
        </text>
      </g>
      <g transform="translate(32 32)">
        <rect
          width="454"
          height="75"
          fill="#202333"
          stroke="#5a5e73"
          strokeWidth="4"
        />
        <text x="20" y="31" className="pixel-text hud-title">
          L1 · RELAY RACE / FULL MAP
        </text>
        <text x="20" y="57" className="pixel-text hud-venue">
          4096 × 768 · 64 × 12 TILES · 4X
        </text>
      </g>
    </svg>
  )
}

export default function App() {
  const [active, setActive] = useState<Screen>("moment_b")

  return (
    <main className="app-shell">
      <div className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            P
          </div>
          <div>
            <div className="eyebrow">PIXA / LEVEL DESIGN</div>
            <div className="page-title">L1 · Relay Race</div>
          </div>
        </div>
        <div className="spec-row">
          <span>1280 × 720</span>
          <i />
          <span>16 × 16 TILES</span>
          <i />
          <span>4X PIXEL</span>
        </div>
      </div>

      <section className="stage-section" aria-label="Level screen preview">
        <div
          className="screen-tabs"
          role="tablist"
          aria-label="Level screen states"
        >
          {screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              role="tab"
              aria-selected={active === screen.id}
              className={`screen-tab ${
                active === screen.id ? "is-active" : ""
              }`}
              onClick={() => setActive(screen.id)}
            >
              <span className="tab-number">{screen.label}</span>
              <span>{screen.detail}</span>
            </button>
          ))}
        </div>
        <div className="frame-wrap" data-layer={`l1_screen_${active}`}>
          <GameScene screen={active} />
        </div>
        <div className="frame-caption">
          <span>ACTIVE FRAME</span>
          <strong>{`l1_screen_${active}`}</strong>
          <span className="caption-spacer" />
          <span>VENUE</span>
          <strong>Dronacharya Sports Ground</strong>
        </div>
      </section>

      <section className="map-section" aria-label="Full developer map">
        <div className="section-heading">
          <div>
            <div className="eyebrow">DEVELOPER HANDOFF</div>
            <div className="section-title">Full level map</div>
          </div>
          <div className="map-meta">64 × 12 tiles · scroll to inspect</div>
        </div>
        <div className="map-scroll">
          <div className="map-native" data-layer="l1_full_level_map">
            <FullMap />
          </div>
        </div>
        <div className="layer-strip">
          {[
            "l1_bg_sky",
            "l1_bg_trees",
            "l1_bg_stands",
            "l1_tile_track",
            "l1_wire_cyan",
            "l1_object_gate_open",
          ].map((layer) => (
            <span key={layer}>{layer}</span>
          ))}
        </div>
      </section>
    </main>
  )
}
