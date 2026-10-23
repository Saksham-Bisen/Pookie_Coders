# Laptop 1 — Level 1: Dronacharya Sports Ground, "Relay Race"

**Mechanics:** Commit & Replay, Bugs · **Teaches:** "My ghost can hold buttons for me." · **Star:** finish under 30 s
**Laptop 1 also owns these core systems:** Recorder, Ghost manager, Bug entity, gate/button basics.

---

## A. Backend / game-logic prompt

> Paste into your coding assistant, or use as the dev spec.

```
You are building Level 1 of "Pixa", a Phaser 3 + TypeScript pixel platformer
(base resolution 320x180 scaled 4x, 16x16 tiles, fixed 60 fps timestep).
Use the shared engine in packages/core (Input, Physics, Recorder, GhostManager,
LogicGraph, EventBus). If a core module does not exist yet, build it there, not
inside the level, because levels 2 and 3 reuse it.

LEVEL: "Relay Race" at Dronacharya Sports Ground.
GOAL: open the sports-room gate at the finish line and walk through it.

MAP (load from levels/level-1-dronacharya/map.json, made in Tiled)
- Size 64 x 12 tiles. Camera follows Bit horizontally, clamped to the map.
- Flat running track on row 10, lane lines are decoration only.
- Spawn: Bit at tile (2, 9).
- start_button at tile (4, 10): a floor button.
- bug_1 patrols the track between tiles x=26 and x=36, speed 30 px/s,
  turns around at the ends and at walls.
- Two low hurdles (1 tile tall) at x=18 and x=44, jumpable, solid.
- sports_gate at tile x=58 (2 tiles tall, solid when closed).
- exit_zone just past the gate at x=60..62 (trigger).
- Decoration layers: stands with crowd, scoreboard showing "BIT vs BUGS",
  floodlights. No collision.

LOGIC (data in level.config.ts)
  start_button (button) --> sports_gate (gate)      // direct wire, no gate logic
- The gate is open only while start_button is pressed by Bit, a ghost, or a crate.
- Gate takes 0.3 s to open/close; while closing it is solid and pushes Bit back
  (never crushes).

COMMIT & REPLAY (core Recorder + GhostManager)
- [R] starts recording; max 600 frames (10 s); [R] again or timeout ends it.
- Each frame store {x, y, facing, animState, actionFlags}.
- While recording Bit is a "draft" (tinted, REC dot). On commit end Bit snaps back
  to the position where recording began, and a ghost spawns there looping the
  recorded frames.
- Max 3 ghosts; a 4th commit removes the oldest and emits ghost:dropped.
- Ghosts press buttons, are standable from above, do NOT collide with Bit
  sideways, do not die to bugs, ignore firewalls.
- Loop seam rule: if a ghost is on the same button on its last and first frame,
  the button stays pressed through the restart.
- Each commit gets a 6-char hex hash (e.g. "a1f3c9") shown above the ghost.

BUG ENTITY (core/entities/Bug)
- Patrols left/right. Touching it from the side or below = Bit dies (respawn at
  spawn, ghosts are kept, timer keeps running).
- Landing on top = stomp: bug squashes, Bit bounces (jump velocity x0.6).
- Option `splits: true` spawns 2 small bugs on stomp (not used in L1, but build it).
- Emits bug:stomped.

EXPECTED SOLUTION (use for an automated test)
1. Walk to start_button, press R, stand still ~1 s, press R.
2. Ghost loops on the button, gate stays open.
3. Run right, jump the hurdle, stomp bug_1, jump the 2nd hurdle, pass the gate.

TUTORIAL HINTS (on-screen, one at a time, triggered by position/events)
- At spawn: "[A][D] move  [SPACE] jump"
- Stepping on the button: "Gate open... but only while you stand here."
- Stepping off: "Need a teammate? Press [R] to commit yourself."
- After first commit: "> commit a1f3c9 created. Your ghost holds the button."
- Near the bug: "Bugs? Stomp them."

STATS & STAR
- Timer starts on first input, stops on exit_zone.
- Star if time < 30.00 s.
- On finish emit level:complete {levelId:'L1', timeMs, ghostsUsed, deaths, star}
  and POST it to /runs if the backend is reachable (else queue in localStorage).

DELIVERABLES
- levels/level-1-dronacharya/{map.json, level.config.ts, Level1Scene.ts}
- packages/core/{recorder, ghosts, entities/Bug, entities/Gate, entities/Button}
- A headless test that replays the expected solution input and asserts the
  level completes.
```

---

## B. Figma UI prompt

> Run the shared design-system prompt first, then paste this.

```
Using the existing "Pixa" design system (palette, Bit sprites, HUD components),
design Level 1: "Relay Race" at Dronacharya Sports Ground.

FRAME: 1280x720 game screen (pixel art at 4x, 16x16 tiles). Also make a long
"full level" frame 4096x768 (64x12 tiles at 4x) showing the whole map for the devs.

SETTING: an Indian college sports ground in late-afternoon sun.
- Sky: warm orange-to-pink dithered sky, distant college building silhouette,
  parallax layers: (1) sky + clouds, (2) trees and a water tank, (3) stands.
- Stands with a pixel crowd (simple 2-frame cheer animation), a banner
  "DRONACHARYA SPORTS GROUND".
- Red running track with white lane lines and a START line with a floor button.
- A scoreboard reading "BIT vs BUGS".
- Two low hurdles on the track.
- Finish line with a chain-link "SPORTS ROOM" gate and a red/green lock light.
- A cyan wire runs along the track edge from the start button to the gate and glows
  when powered, so players see the connection.

TILES TO EXPORT (16x16): track, track edge, grass, lane-line, start-line,
finish-line, hurdle, fence, gate (closed/opening/open), stand pieces.

OBJECTS: start button (up/pressed), Bug beetle walking on the track, sports gate.

HUD (from design system): level name "L1 · Relay Race", venue "Dronacharya Sports
Ground", timer with a "★ < 0:30" target chip, COMMITS 3 slots, key hints [R] Commit.
Hide clipboard, undo and ID card widgets (not used in this level).

SCREENS FOR THIS LEVEL:
1. Intro card: "LEVEL 1 — RELAY RACE", one-line goal "Open the sports-room gate",
   and a tiny animation hint of a ghost holding a button.
2. Gameplay moment A: Bit standing on the button, gate open, hint toast
   "Gate open... but only while you stand here."
3. Gameplay moment B: green ghost (hash "a1f3c9") on the button, Bit mid-jump
   stomping the bug, wire glowing to the open gate.
4. Level complete: "RELAY COMPLETE", time 0:24.18, ghosts used 1, star earned.
5. Star missed variant: time 0:41.02, "Run under 0:30 for the star".

Name layers in snake_case with an "l1_" prefix (l1_tile_track, l1_bg_stands).
```

---

## C. Done checklist
- [ ] Map loads from Tiled JSON; camera scrolls.
- [ ] Gate opens only while the button is pressed.
- [ ] Ghost recorded, loops, holds the button with no flicker at the loop seam.
- [ ] Bug kills from the side, dies when stomped.
- [ ] Timer + star logic; `level:complete` fires with stats.
- [ ] Figma art in; hints show in order.
