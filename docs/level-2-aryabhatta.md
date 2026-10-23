# Laptop 2 — Level 2: Aryabhatta Classroom, "Back Bench"

**Mechanics:** Copy/Paste, ID card throw, Commit & Replay, AND gate · **Teaches:** "I can build my own steps." · **Star:** use the ID card only once
**Laptop 2 also owns these core systems:** Clipboard, ID card, Logic graph (AND/OR/NOT + wire rendering).

---

## A. Backend / game-logic prompt

```
You are building Level 2 of "Pixa", a Phaser 3 + TypeScript pixel platformer
(320x180 base scaled 4x, 16x16 tiles, fixed 60 fps). Use packages/core
(Input, Physics, Recorder, GhostManager, LogicGraph, Clipboard, IdCard, EventBus).
Build Clipboard, IdCard and LogicGraph inside packages/core so Level 3 can reuse them.

LEVEL: "Back Bench" in Aryabhatta Classroom (single screen, 20 x 11 tiles,
no camera scroll).
GOAL: open the classroom door and walk out.

MAP (levels/level-2-aryabhatta/map.json)
- Floor on row 10. Spawn: Bit at (17, 9), at the back of the class (right side).
- Three back benches at x=13..14, 15..16 (each 2 wide x 1 tall, solid, standable,
  COPYABLE). Benches cannot be pushed.
- button_A on the floor at (8, 10), near the front bench.
- teacher_desk at x=3..5, 3 tiles tall (top at row 7). Bit's jump height is
  2.5 tiles, so the desk top is unreachable from the floor but reachable from
  a 1-tile bench.
- button_B on top of the teacher desk at (4, 7).
- blackboard on the back wall above the desk, x=2..7, rows 2..5.
- board_switch at (6, 3) on the blackboard: out of reach by jumping; hit only
  by the ID card. It is a LATCH (toggles on and stays on).
- classroom_door at x=0, rows 8..9 (left wall). A lock light sits above it.
- exit_turnstile just inside the door at x=1: passes Bit only if the ID card is
  in hand (suggestion: makes "losing the card" matter).
- exit_zone at x=0 once the door is open.

LOGIC (level.config.ts)
  and_1   = AND(button_A, button_B)
  door    = AND(and_1, board_switch)
  lock_light shows board_switch state (red = locked, green = unlocked)
- Draw both AND gate blocks on the wall with wires; inputs light up when powered,
  so the player can read the circuit.

CLIPBOARD (core/clipboard)
- [C] while overlapping a copyable object copies it to the clipboard (one slot).
- [V] enters placement mode: a preview follows Bit, snapped to the tile grid,
  max 3 tiles from Bit. Green = valid (no overlap, on solid ground), red = invalid.
  [V] again places; [ESC] cancels.
- level limit: clipboardLimit = 2 (one needed, one spare for mistakes).
- Pasted copies have a dotted outline and are solid + standable.
- Emits clipboard:copy, clipboard:paste.

ID CARD (core/entities/IdCard)
- [F] throws. Aim with arrows/WASD in 8 directions (default = facing direction).
- Flies 8 tiles at 240 px/s, spinning, then returns to Bit like a boomerang.
- Hits switches on the way out or back.
- If it hits a solid wall/ceiling before returning, it sticks there. Bit must
  touch it to pick it up. If it sticks somewhere unreachable, it is lost:
  HUD shows "ID CARD: LOST", turnstile stays shut -> player must Restart.
- Throws are counted (cardThrows) for the star.
- Emits card:thrown, card:returned, card:lost.

COMMIT & REPLAY: as in core (10 s, 3 ghosts, draft snaps back, standable,
presses buttons, loop-seam rule).

EXPECTED SOLUTION (automated test)
1. Stand on a back bench, [C] copy it.
2. Walk to the desk, [V][V] paste the bench next to the desk (x=6, row 10).
3. Jump bench -> desk top, stand on button_B. [R], wait ~1 s, [R].
   Bit snaps back onto button_B; ghost loops there.
4. Jump down, walk to button_A. and_1 is now powered.
5. Aim up-left, [F] throw at board_switch. Card hits it and returns.
6. Door opens. Walk through the turnstile (card in hand) and exit.

TUTORIAL HINTS
- Start: "That desk is too high. Notice anything you could copy?"
- Touching a bench: "[C] Copy"
- After copy: "[V] Paste — place it near the desk."
- On button_B alone: "AND gate: both buttons must be pressed at once."
- Both pressed: "Door is still locked. Check the blackboard. [F] Throw ID card."
- Card lost: "Lost your ID? Security won't let you out. [ESC] → Restart."

STATS & STAR
- Star if cardThrows <= 1.
- Emit level:complete {levelId:'L2', timeMs, ghostsUsed, pastesUsed, cardThrows, star}
  and POST to /runs (queue offline).

DELIVERABLES
- levels/level-2-aryabhatta/{map.json, level.config.ts, Level2Scene.ts}
- packages/core/{clipboard, entities/IdCard, entities/Switch, entities/Turnstile,
  logic/LogicGraph + WireRenderer}
- Unit tests for LogicGraph (AND, OR, NOT, chained gates) and a headless
  solution replay test.
```

---

## B. Figma UI prompt

```
Using the "Pixa" design system, design Level 2: "Back Bench" in Aryabhatta
Classroom.

FRAME: 1280x720 single-screen level (20x11 tiles at 4x, 16x16 px tiles).

SETTING: a typical Indian college classroom, morning light through tall windows.
- Back wall: cream paint, ceiling fans (2-frame spin), tube lights, a wall clock,
  a notice board, a poster "ARYABHATTA HALL — Room 204".
- Left wall: wooden classroom door with a lock light (red/green) and a small metal
  ID-card turnstile with a card reader.
- Front: a large green chalkboard with chalk doodles (a binary tree, "x = x + 1",
  a truth table for AND). A bright orange board switch in the upper-right corner
  of the board, clearly out of reach.
- Teacher's desk: tall wooden desk with a register and chalk box; floor button B
  on top.
- Floor button A near the front bench.
- Rows of wooden back benches on the right; one has "BIT WAS HERE" carved on it.
- Wiring painted on the wall in cyan: button A and button B into an AND gate block,
  that output plus the board switch into a second AND gate, then to the door.
  Show powered and unpowered versions.

TILES/OBJECTS TO EXPORT: floor tile, wall tile, window, bench (normal, "copied"
dotted outline, paste-preview green/red), teacher desk, chalkboard pieces, board
switch (off/on), door (closed/open), turnstile (locked/unlocked), AND gate block
(inputs off/on), ID card mid-flight, ID card stuck on wall.

HUD: "L2 · Back Bench", venue "Aryabhatta Classroom", timer, "★ 1 card throw"
chip, COMMITS slots, CLIPBOARD "Ctrl+V x2" with a bench icon, ID CARD status
(in hand / thrown / lost). Hide UNDO.

SCREENS:
1. Intro card: "LEVEL 2 — BACK BENCH", goal "Get out of class".
2. Moment A: Bit copying a bench, toast "> copied: bench".
3. Moment B: paste preview of the bench next to the desk (green outline).
4. Moment C: ghost standing on button B on the desk, Bit on button A, first AND
   gate lit, aim arrow from Bit to the board switch.
5. Moment D: card hits the switch, lock light turns green, door opening.
6. Level complete: "CLASS DISMISSED", stats (pastes 1, ghosts 1, card throws 1),
   star earned. Variant: "ID card used 3 times — star needs 1".
7. Card-lost state: HUD shows "ID CARD: LOST", turnstile red.

Layer prefix "l2_".
```

---

## C. Done checklist
- [ ] Copy/paste with placement preview and limit.
- [ ] Desk unreachable without the pasted bench (playtest this!).
- [ ] AND gates evaluate correctly and wires light up.
- [ ] ID card throws in 8 directions, returns, can stick and be lost.
- [ ] Star tracks card throws; `level:complete` fires.
