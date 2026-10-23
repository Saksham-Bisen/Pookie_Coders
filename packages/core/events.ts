/** Typed event bus. HUD, audio, hints and the backend client listen here. */

export interface LevelCompletePayload {
  levelId: string;
  timeMs: number;
  ghostsUsed: number;
  deaths: number;
  star: boolean;
  undosUsed?: number;
  cardThrows?: number;
}

export interface PixaEvents {
  'commit:start': { x: number; y: number };
  'commit:end': { id: string; frames: number };
  'commit:cancel': { reason: string };
  'ghost:dropped': { id: string };
  'button:down': { id: string };
  'button:up': { id: string };
  'gate:open': { id: string };
  'gate:close': { id: string };
  'bug:stomped': { x: number; y: number; split: boolean };
  'player:died': { x: number; y: number; cause: string };
  'timer:start': { frame: number };
  'level:complete': LevelCompletePayload;
  // Owned by other laptops; declared here so every level shares one event map.
  'clipboard:copy': { id: string };
  'clipboard:paste': { id: string };
  'undo:used': { remaining: number };
  'card:thrown': { dir: number };
  'card:returned': Record<string, never>;
  'popup:closed': { id: string };
}

type Handler<T> = (payload: T) => void;

export class EventBus<E extends object = PixaEvents> {
  private handlers = new Map<keyof E, Set<Handler<never>>>();

  on<K extends keyof E>(type: K, fn: Handler<E[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) this.handlers.set(type, (set = new Set()));
    set.add(fn as Handler<never>);
    return () => set!.delete(fn as Handler<never>);
  }

  once<K extends keyof E>(type: K, fn: Handler<E[K]>): () => void {
    const off = this.on(type, (p) => {
      off();
      fn(p);
    });
    return off;
  }

  emit<K extends keyof E>(type: K, payload: E[K]): void {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const fn of [...set]) (fn as Handler<E[K]>)(payload);
  }

  clear(): void {
    this.handlers.clear();
  }
}
