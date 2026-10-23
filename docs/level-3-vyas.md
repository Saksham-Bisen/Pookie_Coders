# Laptop 3 — Level 3 (Final): Vyas CSE Building, "Submission Deadline"

**Mechanics:** Firewall lasers, Popup ads, Commit & Replay, Ctrl+Z, NOT gate · **Teaches:** "Ghosts ignore firewalls, I don't." · **Star:** finish without Ctrl+Z
**Laptop 3 also owns:** Firewall laser, Popup ad, Rewind (Ctrl+Z), Lag zone, and the backend server.

---

## A. Backend / game-logic prompt

```
You are building Level 3 (final) of "Pixa", a Phaser 3 + TypeScript pixel
platformer (320x180 base scaled 4x, 16x16 tiles, fixed 60 fps). Use packages/core.
Build FirewallLaser, PopupAd, LagZone and RewindBuffer inside packages/core.

LEVEL: "Submission Deadline" in the Vyas CSE Building. Vertical level, 3 floors,
map 24 x 40 tiles, camera follows Bit vertically and horizontally.
GOAL: reach the submission terminal on Floor 3 and press [E] to submit.
FLAVOUR: a fake deadline clock "23:59:00" counts up in the background
(cosmetic only; the real timer is the HUD timer).

FLOOR 1 — "Firewall" (rows 28..39)
- Spawn (2, 37). Corridor to the right ending in a staircase up to Floor 2.
- firewall_1: vertical laser across the stair entrance at x=14, 3 tiles tall.
  Blocks Bit (touching it = pushed back + small shake, not death).
  Ghosts AND the recording draft pass through it.
- fw_switch: floor switch just past the laser at x=17. It is a LATCH
  (once pressed it stays pressed). Reason: a looping ghost would release a normal
  button when its loop restarts, and the laser would come back on.
- LOGIC: firewall_1 = NOT(fw_switch). Draw a NOT gate block on the wall.
- Checkpoint on the stairs.

FLOOR 2 — "Popup Corridor" (rows 15..27)
- Long corridor right-to-left with 2 pits (3 tiles wide, x=8..10 and x=15..17).
  Falling in = death -> respawn at floor checkpoint (unless the player rewinds).
- popup_1, popup_2: windows (4x3 tiles) that slide in from the top on a 4 s cycle
  and stop across the corridor as solid walls. Each has an X button on its top-right
  corner, 1 tile above Bit's head: hit it by jumping into it from below
  (or with the ID card if enabled). Closed popups shrink away and respawn after 6 s.
- lag_zone_1 (suggestion, uses the unused mechanic): a purple zone over the second
  pit. Inside it Bit, popups and bugs move at 0.5x, jump arc is slower and floatier.
  This makes the jump harder to time, which is where Ctrl+Z becomes useful.
- Checkpoint at the stairs to Floor 3.

FLOOR 3 — "Deploy" (rows 0..14)
- Short room with the submission_terminal at x=20.
- [E] at the terminal plays a "git push" animation (progress bar, 3 s), then
  "SUBMISSION RECEIVED 23:59:58". Level complete.
- Optional final beat: one Bug sits on the terminal desk ("there's a bug in your
  code") that must be stomped first.

REWIND / CTRL+Z (core/rewind)
- Ring buffer of 180 frames (3 s). Snapshot: Bit state, ghost loop indices,
  movable objects, switches/latches, lasers, popup positions/timers, bugs,
  ID card state, lag-zone effects. Do NOT rewind the HUD timer.
- [Z] rewinds 3 s (or back to the oldest snapshot), plays it backwards over 0.5 s
  with a VHS/glitch effect, then resumes.
- undoLimit = 3. Dying with undos left shows a 1.5 s prompt
  "Fell? [Z] Undo (2 left)" before auto-respawning; rewinding cancels the death.
- Emits undo:used.

FIREWALL LASER (core/entities/FirewallLaser)
- Props: length, orientation, logic input. Solid only to Bit; ghosts and the
  draft pass. Animated beam; off state shows only emitters.

POPUP AD (core/entities/PopupAd)
- Props: slide path, cycle time, respawn time, close-button hitbox.
- Solid to Bit AND ghosts while open. Emits popup:closed.

EXPECTED SOLUTION (automated test)
F1: walk up to the laser, [R], walk through it as the draft, step on fw_switch,
    [R]. Bit snaps back; ghost replays and latches the switch; laser turns off;
    climb stairs.
F2: wait for popup_1, jump to hit its X, cross pit 1, repeat for popup_2, time
    the jump through the lag zone over pit 2. (No undo for the star run.)
F3: walk to the terminal, [E].

TUTORIAL HINTS
- At the laser: "FIREWALL: access denied for Bit. Ghosts aren't on the blocklist..."
- After it turns off: "NOT gate: switch ON → firewall OFF."
- First popup: "Close the ad! Jump into the [X]."
- First fall: "[Z] Ctrl+Z rewinds 3 seconds."
- Terminal: "[E] Submit project"

STATS & STAR
- Star if undosUsed == 0.
- Emit level:complete {levelId:'L3', timeMs, ghostsUsed, undosUsed, deaths, star}.
- After L3, show the final results screen that pulls the player's L1-L3 runs
  from GET /players/:code (total time, stars out of 3).

BACKEND (server/, Laptop 3 hosts it on the LAN)
- Node + Express + better-sqlite3. Routes: POST /players, GET /players/:code,
  POST /runs, GET /leaderboard/:levelId. CORS for the LAN. Tables as in
  docs/00-architecture-and-workflow.md.

DELIVERABLES
- levels/level-3-vyas/{map.json, level.config.ts, Level3Scene.ts}
- packages/core/{rewind, entities/FirewallLaser, entities/PopupAd,
  entities/LagZone, entities/Latch, entities/Terminal}
- server/ with the API + a seed script
- Tests: rewind restores state exactly; laser blocks Bit but not ghosts;
  headless solution replay.
```

---

## B. Figma UI prompt

```
Using the "Pixa" design system, design Level 3 (final): "Submission Deadline"
in the Vyas CSE Building.

FRAMES: 1280x720 gameplay frames, plus one tall "full level" frame 1536x2560
(24x40 tiles at 4x) showing all three floors stacked, for the devs.

MOOD: night before a project deadline. Dark navy building interior, flickering
tube lights, monitors glowing green, a big red digital clock "23:59" on each floor.
Exterior parallax through windows: the night sky and the college campus.

FLOOR 1 — FIREWALL
- Building lobby with a "VYAS — DEPT. OF CSE" sign, a notice board with
  "Project submission closes 23:59", a staircase.
- A red firewall laser across the stair entrance, beam drawn as glowing red bricks
  (a literal fire-wall), emitters on floor and ceiling, a warning sign
  "ACCESS DENIED: Bit". Off state: emitters only, grey.
- A floor latch switch just past the laser, and a cyan wire through a NOT gate
  block on the wall into the laser.

FLOOR 2 — POPUP CORRIDOR
- Corridor with lab doors ("LAB 1 — DSA", "LAB 2 — OS"), lockers, two pits
  (broken floor tiles with exposed cables).
- Popup ad windows sliding down from the ceiling, retro OS style: title bars,
  a big X button, text like "YOU ARE THE 1,000,000th VISITOR!", "Download more
  RAM", "Hot singles in your localhost". Animations: slide in (3 frames),
  closing (3 frames).
- A purple lag zone over the second pit with a loading-spinner pattern and
  "buffering..." text.

FLOOR 3 — DEPLOY
- Server room with blinking racks, one desk with the submission terminal
  (big CRT showing "> git push origin main").
- Optional: a Bug sitting on the keyboard.

EFFECTS: Ctrl+Z rewind overlay (VHS scanlines, RGB split, "<<< REWIND" text),
death overlay "SEGMENTATION FAULT", terminal upload progress bar.

HUD: "L3 · Submission Deadline", venue "Vyas CSE Building", timer,
"★ no Ctrl+Z" chip, COMMITS slots, UNDO "Ctrl+Z x3", floor indicator "FLOOR 1/3".
Hide clipboard.

SCREENS:
1. Intro: "FINAL LEVEL — SUBMISSION DEADLINE", goal "Submit before midnight".
2. Moment A: Bit stopped at the laser, green ghost walking through it.
3. Moment B: laser off, NOT gate lit, Bit climbing the stairs.
4. Moment C: Bit jumping into a popup's X, second popup sliding in.
5. Moment D: rewind effect after falling into a pit, "Ctrl+Z (2 left)".
6. Moment E: Bit at the terminal, push progress bar at 80%.
7. Level complete: "SUBMISSION RECEIVED 23:59:58", stats, star.
8. Final results / credits: total time across L1-L3, stars x/3, player code,
   a leaderboard top-5, and "Thanks for playing Pixa".

Layer prefix "l3_".
```

---

## C. Done checklist
- [ ] Laser blocks Bit, not ghosts or the draft; NOT gate + latch work.
- [ ] Popups block, close on X hit, respawn.
- [ ] Rewind restores the world exactly; limit enforced; death can be undone.
- [ ] Lag zone halves speed/jump.
- [ ] Terminal ends the level; final results pull from the backend.
- [ ] Server runs on the LAN; other laptops can POST runs.
