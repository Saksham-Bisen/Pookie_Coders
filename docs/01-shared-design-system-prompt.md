# Shared Design System — Figma prompt (run this FIRST, once)

All three laptops use this so the levels look like one game. Paste the block below into Figma (Figma Make / Figma AI / First Draft).

---

```
Create a pixel-art design system for a 2D puzzle-platformer called "Pixa".
Theme: an Indian engineering college, mixed with computer-science ideas (git commits,
copy/paste, undo, logic gates, firewalls, bugs, popup ads).

CANVAS & GRID
- Game screen frame: 1280x720 (base art 320x180 scaled 4x). Show a 16x16 px tile grid
  at base scale (64x64 at 4x).
- All art is crisp pixel art, no anti-aliasing, no gradients except dithering.
- Palette (max ~16 colours): deep navy #1B1F3B background, terminal green #3DFF8A
  for "commit/ghost/success", cyan #3FD0FF for wires and logic, warm orange #FF9F43
  for interactive items, red #FF4D5E for danger (bugs, lasers, popups), off-white
  #F2F2E9 for text, mid grey #6B7089 for inactive.
- Font: a pixel font (e.g. "Press Start 2P" for headings, "VT323" for HUD numbers).

PAGE 1 — CHARACTER "BIT"
- Bit: a small student (16x24 px) with a hoodie, a lanyard with an ID card, and a
  tiny glowing cursor above the head.
- Sprite sheet frames: idle (2), run (6), jump (1), fall (1), land (1), throw (3),
  copy pose (1), paste pose (1), hurt (2), win (4).
- Recording state: Bit with a red "REC" dot and a scanline overlay.
- GHOST version of Bit: same frames, terminal-green, 50% opacity, a short commit
  hash label above it like "a1f3c9". Three ghost colour variants: green, cyan, violet.

PAGE 2 — SHARED OBJECTS (16x16 or multiples)
- Floor button: up state, pressed state, with a cyan wire socket.
- Gate/door: closed, opening (3 frames), open; a lock light (red/green).
- Wires: straight, corner, T-junction; powered (glowing cyan) and unpowered (grey).
- Logic gate blocks (32x32): AND, OR, NOT, each with standard gate symbol, input
  dots that light up when powered, output dot.
- Crate (copyable), spring (copyable), floating platform (copyable).
- "Copied" dotted outline and "paste preview" ghost outline (green valid, red invalid).
- Bug enemy: pixel beetle 16x12, walk (4 frames), stomped (2 frames), and a
  "splitter" variant with a crack pattern.
- Firewall laser: emitter, beam (animated, red with brick pattern), off state.
- Popup ad window (64x48): title bar with an X button, fake "YOU WON!" text,
  slide-in animation (3 frames), close animation.
- Lag zone: a translucent purple area with a loading-spinner pattern.
- ID card projectile: spinning card (4 frames).

PAGE 3 — HUD (overlay on 1280x720)
- Top-left: level name + venue name.
- Top-centre: timer (mm:ss.ms) and a star target hint.
- Top-right: pause button.
- Bottom-left: "COMMITS" — 3 slots shaped like git commit nodes on a branch line;
  empty, filled (shows hash), recording (red pulse with a 10s countdown ring).
- Bottom-centre: CLIPBOARD counter "Ctrl+V x2" and the copied item icon.
- Bottom-right: UNDO counter "Ctrl+Z x3" and ID CARD status (in hand / thrown / lost).
- Key-hint chips styled like keyboard keys: [R] Commit, [C] Copy, [V] Paste,
  [Z] Undo, [F] Throw, [E] Interact.
- Toast messages styled like terminal output: "> commit a1f3c9 created".

PAGE 4 — SCREENS
- Title screen: "PIXA" logo, Bit standing on a terminal prompt, "Press ENTER".
- Level select: 3 cards (Dronacharya Sports Ground, Aryabhatta Classroom,
  Vyas CSE Building), each with a locked/unlocked state, a "completed" tick,
  and one star slot (empty / earned).
- Player code screen: enter name, shows code like "BIT-4821".
- Pause menu: Resume, Restart, Controls, Quit.
- Level complete: "BUILD PASSED", time, stats (ghosts used, undos used, card throws),
  star earned or missed with the reason.
- Fail / respawn overlay: "SEGMENTATION FAULT — respawning".

Make everything a reusable component with variants, name layers in snake_case
(e.g. ui_hud_commit_slot, obj_button_pressed) so they export directly as PNGs.
```
