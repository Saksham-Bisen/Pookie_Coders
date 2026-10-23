import type { InputScript } from '@pixa/core/input/ActionFrame';

/**
 * Expected solution as raw input (one entry = [frames, keys]; R right, J jump, C commit [R key]).
 * 1. Walk onto start_button, commit, stand still 1 s, commit.
 * 2. The ghost loops on the button, so the gate stays open.
 * 3. Run right: jump hurdle 1, stomp bug_1, jump hurdle 2, through the gate.
 * Frame numbers come from the fixed 60 fps sim; re-tune if physics constants change.
 */
export const LEVEL1_SOLUTION: InputScript = [
  [22, 'R'], // walk to the button
  [20, ''], // settle
  [1, 'C'], // [R] start recording
  [60, ''], // stand still ~1 s
  [1, 'C'], // [R] commit -> ghost a.k.a. teammate
  [10, ''],
  [134, 'R'],
  [1, 'RJ'], // hurdle at x=18
  [142, 'R'],
  [1, 'RJ'], // jump onto bug_1 (stomp)
  [133, 'R'],
  [1, 'RJ'], // hurdle at x=44
  [400, 'R'], // through the open gate into exit_zone
];
