import type { LogicNode } from '../logic/LogicGraph';

/** The contract every level folder fills in (see docs/00-architecture-and-workflow.md 3.7). */
export interface LevelConfig {
  id: string;
  name: string;
  venue: string;
  map: string;
  mechanics: { commit: boolean; clipboard: boolean; undo: boolean; idCard: boolean };
  limits: { maxGhosts: number; recordSeconds: number; clipboardLimit: number; undoLimit: number };
  logic: LogicNode[];
  star: { type: 'time'; value: number } | { type: 'maxCardThrows'; value: number } | { type: 'noUndo' };
  next: string | null;
}
