import type { LevelConfig } from '@pixa/core/level/LevelConfig';

const config: LevelConfig = {
  id: 'L1',
  name: 'Relay Race',
  venue: 'Dronacharya Sports Ground',
  map: 'map.json',
  mechanics: { commit: true, clipboard: false, undo: false, idCard: false },
  limits: { maxGhosts: 3, recordSeconds: 10, clipboardLimit: 0, undoLimit: 0 },
  // L1 teaches the plain wire: button -> gate, no gate logic.
  logic: [
    { id: 'start_button', type: 'button' },
    { id: 'sports_gate', type: 'gate', in: 'start_button' },
  ],
  star: { type: 'time', value: 30 },
  next: 'L2',
};

export default config;
