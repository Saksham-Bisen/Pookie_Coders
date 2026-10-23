/** Levels describe wiring as data; the engine evaluates it every frame. */
export type LogicNode =
  | { id: string; type: 'button' | 'switch' }
  | { id: string; type: 'AND' | 'OR' | 'NOT'; in: string[] }
  | { id: string; type: 'door' | 'laser' | 'gate'; in: string };

export class LogicGraph {
  private nodes = new Map<string, LogicNode>();
  private inputs = new Map<string, boolean>();
  private values = new Map<string, boolean>();

  constructor(nodes: LogicNode[]) {
    for (const n of nodes) {
      if (this.nodes.has(n.id)) throw new Error(`Duplicate logic node "${n.id}"`);
      this.nodes.set(n.id, n);
    }
    for (const n of nodes) {
      const ins = 'in' in n ? (Array.isArray(n.in) ? n.in : [n.in]) : [];
      for (const i of ins) if (!this.nodes.has(i)) throw new Error(`Logic node "${n.id}" wires from unknown "${i}"`);
    }
    this.evaluate();
  }

  setInput(id: string, value: boolean): void {
    const n = this.nodes.get(id);
    if (!n || (n.type !== 'button' && n.type !== 'switch')) throw new Error(`"${id}" is not a logic input`);
    this.inputs.set(id, value);
  }

  evaluate(): void {
    this.values.clear();
    const visiting = new Set<string>();
    const val = (id: string): boolean => {
      const cached = this.values.get(id);
      if (cached !== undefined) return cached;
      if (visiting.has(id)) throw new Error(`Logic loop at "${id}"`);
      visiting.add(id);
      const n = this.nodes.get(id)!;
      let v: boolean;
      switch (n.type) {
        case 'button':
        case 'switch':
          v = this.inputs.get(id) ?? false;
          break;
        case 'AND':
          v = n.in.every(val);
          break;
        case 'OR':
          v = n.in.some(val);
          break;
        case 'NOT':
          v = !val(n.in[0]);
          break;
        default:
          v = val(n.in);
      }
      visiting.delete(id);
      this.values.set(id, v);
      return v;
    };
    for (const id of this.nodes.keys()) val(id);
  }

  value(id: string): boolean {
    return this.values.get(id) ?? false;
  }

  outputs(): LogicNode[] {
    return [...this.nodes.values()].filter((n) => n.type === 'door' || n.type === 'gate' || n.type === 'laser');
  }

  /** Every wire as [from, to], for drawing glowing wires. */
  wires(): [string, string][] {
    const out: [string, string][] = [];
    for (const n of this.nodes.values()) {
      if (!('in' in n)) continue;
      for (const i of Array.isArray(n.in) ? n.in : [n.in]) out.push([i, n.id]);
    }
    return out;
  }
}
