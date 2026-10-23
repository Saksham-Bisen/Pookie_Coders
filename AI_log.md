AI prompts used
Landing Page
this is a hackathon that i will be working on with my friend today and they will give me the problem statement 30 min before the start time i want you to analyze the ppt and recommend me some sort of a new take on a puzzle game and when the hackathon starts i want all the different files to be independent so that me and my friend can work on it together and upload it to github by independent i mean logic files to be separate then ther design files i don't want to start coding right now but juist keep in mind that 2 people are working on it so it should be in such a format that if i am doing the design his logic files would perfectly work with my files
ok lets go with the mario+pico park idea but with a twist it is related to my college mit-wpu and the main character is a student in the college lets keep the design pixelated like mario and i'll tell you the story or other details afterwards
Core mechanics (all based on CS concepts)
Commit & Replay (main mechanic): Press a key to start recording. Bit acts for up to 10 seconds, then a ghost “commit” replays those moves in a loop. You can keep up to 3 ghosts at once. Ghosts can hold buttons, be stood on, or carry boxes. This replaces Pico Park’s co-op partners.
Copy / Paste: Copy one block, such as a crate, a platform or a spring, and paste it somewhere else. Each level gives you a limited clipboard.
Ctrl+Z: Rewind the last 3 seconds. You get a few uses per level, so it doubles as a puzzle resource and a forgiveness tool.
Logic-gate wiring: Switches connect to doors through visible AND, OR and NOT gates. For example, an AND door needs both buttons pressed, which means a ghost has to hold one of them.
ID card: Your lanyard opens turnstiles, but you can throw it like a boomerang to hit distant switches. If it lands somewhere unreachable, you lose access until you get it back.

these are the core mechanics i am responsible for making the UI of the game
i'll tell you the exact details and describe all the 3 levels in a bit but for now make sure that all the files that you give me are independent and will work with my friends logic files 
Right now lets make a landing page for the game


Level 1
level-1-dronacharya
Laptop 1 — Level 1: Dronacharya Sports Ground, "Relay Race"
Mechanics: Commit & Replay, Bugs · Teaches: "My ghost can hold buttons for me." · Star: finish under 30 s
Laptop 1 also owns these core systems: Recorder, Ghost manager, Bug entity, gate/button basics.
A. Backend / game-logic prompt
Paste into your coding assistant, or use as the dev spec.
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
​
US THE SAME design as the landing page to create this level and for the map try to use the actual Mit-Wpu map for the level map design and give me separate files for the level 1 KEEP THE DESIGN SAME AS THE LANDING PAGE THAT IS VERY IMPORTANT

Level 2 and 3
these are the Instructions and game logic with map designs for the level 2 and 3 imlpement them in the same design and make sure it looks exactly like the landing page and the first level implement both 2 and 3 levels

