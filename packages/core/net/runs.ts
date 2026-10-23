import type { LevelCompletePayload } from '../events';

/** Body for POST /runs (see the backend table in the architecture doc). */
export interface RunPayload {
  code: string | null;
  levelId: string;
  timeMs: number;
  ghostsUsed: number;
  deaths: number;
  star: number; // 0/1, matches the SQLite column
  undosUsed: number;
  cardThrows: number;
  pastesUsed: number;
}

export interface RunClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  timeoutMs?: number;
}

/** Backend for run uploads: VITE_API_URL, else port 3000 on the host serving the game. */
export function defaultApiUrl(): string {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  if (env?.VITE_API_URL) return env.VITE_API_URL;
  const host = typeof location !== 'undefined' && location.hostname ? location.hostname : 'localhost';
  return `http://${host}:3000`;
}

const QUEUE_KEY = 'pixa.pendingRuns';
const CODE_KEY = 'pixa.playerCode';

function defaultStorage(): RunClientOptions['storage'] {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function toRunPayload(r: LevelCompletePayload, code: string | null): RunPayload {
  return {
    code,
    levelId: r.levelId,
    timeMs: r.timeMs,
    ghostsUsed: r.ghostsUsed,
    deaths: r.deaths,
    star: r.star ? 1 : 0,
    undosUsed: r.undosUsed ?? 0,
    cardThrows: r.cardThrows ?? 0,
    pastesUsed: r.pastesUsed ?? 0,
  };
}

function readQueue(storage: RunClientOptions['storage']): RunPayload[] {
  try {
    return JSON.parse(storage?.getItem(QUEUE_KEY) ?? '[]') as RunPayload[];
  } catch {
    return [];
  }
}

function writeQueue(storage: RunClientOptions['storage'], q: RunPayload[]): void {
  try {
    storage?.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* storage full or blocked: the run is lost, the game never blocks on it */
  }
}

async function post(run: RunPayload, opts: RunClientOptions): Promise<boolean> {
  const f = opts.fetch ?? globalThis.fetch;
  if (!f) return false;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 2000);
  try {
    const res = await f(`${opts.baseUrl.replace(/\/$/, '')}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(run),
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/** Sends any queued runs first, then this one. Queues whatever fails. Never throws. */
export async function submitRun(result: LevelCompletePayload, opts: RunClientOptions): Promise<'sent' | 'queued'> {
  const storage = opts.storage === undefined ? defaultStorage() : opts.storage;
  let code: string | null = null;
  try {
    code = storage?.getItem(CODE_KEY) ?? null;
  } catch {
    /* ignore */
  }
  const pending = [...readQueue(storage), toRunPayload(result, code)];
  const failed: RunPayload[] = [];
  for (const run of pending) if (failed.length > 0 || !(await post(run, opts))) failed.push(run);
  writeQueue(storage, failed);
  return failed.length === 0 ? 'sent' : 'queued';
}
