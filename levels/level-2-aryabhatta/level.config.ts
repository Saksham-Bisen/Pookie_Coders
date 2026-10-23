import type { LevelConfig } from '@pixa/core/level/LevelConfig';

const config: LevelConfig = {
  id: 'L2',
  name: 'Back Bench',
  venue: 'Aryabhatta Classroom',
  map: 'map.json',
  mechanics: { commit: true, clipboard: true, undo: false, idCard: true },
  limits: { maxGhosts: 3, recordSeconds: 10, clipboardLimit: 2, undoLimit: 0 },
  // L2 teaches AND: both buttons (Bit + a ghost) AND the board switch (ID card).
  // The door latches open once unlocked (map prop `latch`), so Bit can leave button A.
  logic: [
    { id: 'button_A', type: 'button' },
    { id: 'button_B', type: 'button' },
    { id: 'board_switch', type: 'switch' },
    { id: 'and_1', type: 'AND', in: ['button_A', 'button_B'] },
    { id: 'door_and', type: 'AND', in: ['and_1', 'board_switch'] },
    { id: 'classroom_door', type: 'door', in: 'door_and' },
  ],
  star: { type: 'maxCardThrows', value: 1 },
  next: 'L3',
};

export default config;
