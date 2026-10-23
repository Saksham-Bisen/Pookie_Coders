# Design Suggestions (already applied in the level prompts)

## Must-fix (puzzles break without these)

1. **Level 3 laser can't be recorded as written.** A ghost replays *Bit's* moves, but Bit can't walk through the laser, so there's nothing to record.
   **Fix:** while recording, Bit is a "draft" that passes firewalls like a ghost. When the commit ends, Bit snaps back to where recording started. This one rule also works for L1 and L2.

2. **Looping ghosts release buttons.** When a 10 s loop restarts, the ghost jumps back to its start, so a button it walked onto gets released and the laser comes back on.
   **Fix:** the L3 laser switch is a **latch** (stays on once pressed). For buttons a ghost stands on for the whole loop (L1, L2), keep the button pressed across the loop restart.

3. **Level 2 ID card height.** The blackboard switch is out of jump reach, so a straight throw from the floor can't hit it.
   **Fix:** the card can be aimed in 8 directions (up-diagonal works from button A).

4. **Level 2 desk height must be tuned.** Jump height = 2.5 tiles, desk = 3 tiles, bench = 1 tile. Desk is unreachable from the floor and reachable from the bench. Playtest this first.

## Improvements

5. **Lag zones, the OR gate and splitting bugs aren't used in any level.** Added a lag zone over the last pit on L3 Floor 2 (also gives Ctrl+Z a reason to exist). Splitting bugs: put one in L3 Floor 3 or cut them. OR gate: cut it, or use it in an optional L2 side room.
6. **Show the gate progression:** L1 = plain wire, L2 = AND, L3 = NOT. Each level teaches one more piece of logic.
7. **L2 turnstile.** The ID card's "lose access" risk does nothing unless something needs the card. Added a turnstile at the exit that only lets Bit through with the card in hand.
8. **L2 star is easy** (the solution only needs one throw). It still works as an aim test. Harder option: "one throw AND one paste".
9. **Ctrl+Z only shows up in the final level.** Give one free undo in L2 with a hint, so players know it exists before L3.
10. **CS theme:** commit hashes over ghosts, terminal-style toasts, "BUILD PASSED" on win, "SEGMENTATION FAULT" on death, "git push" at the final terminal.
11. **Three-laptop demo:** player codes (`BIT-4821`) + the LAN backend let one player go laptop 1 → 2 → 3 and see total time and stars at the end.
