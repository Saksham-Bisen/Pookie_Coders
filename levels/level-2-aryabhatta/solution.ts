import type { InputScript } from '@pixa/core/input/ActionFrame';

/**
 * Expected solution as raw input ([frames, keys]; L left, R right, J jump, C commit [R key],
 * K copy [C key], V paste, F throw, U up). Found with a position-driven bot, then frozen here.
 * Re-tune if physics constants or the map change.
 */
export const LEVEL2_SOLUTION: InputScript = [
  [4, 'L'], // walk into bench_2
  [1, 'K'], [1, ''], // [C] copy it
  [1, 'LJ'], [95, 'L'], [5, ''], // hop the benches, stop just right of x=8
  [1, 'V'], [1, ''], [1, 'V'], [1, ''], // [V][V] paste the bench at x=6..7
  [8, 'L'], [1, 'LJ'], [30, 'L'], [1, 'LJ'], [32, 'L'], [10, ''], // bench -> desk top -> button_B
  [1, 'C'], [61, ''], [1, 'C'], [6, ''], // commit 1 s; ghost holds button_B
  [78, 'R'], [5, ''], // down to button_A (and_1 on)
  [10, 'LUF'], [72, ''], // hold [F] aiming up-left, release: card hits board_switch and returns
  [38, 'L'], [1, 'LJ'], [30, 'L'], [1, 'LJ'], [69, 'L'], // over bench + desk, through the turnstile
];
