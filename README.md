# Pookie_Coders

## Pixa

Phaser 3 + TypeScript pixel puzzle-platformer. See `docs/00-architecture-and-workflow.md`.

```bash
npm install
npm run dev        # http://localhost:5173 (also reachable on the LAN)
npm test           # headless tests, incl. the Level 1 solution replay
npm run typecheck
```

### Layout

- `packages/core/` shared engine. Everything except `hud/` and `input/KeyboardInput.ts` is
  plain TypeScript with no Phaser import, so the whole game sim runs headless in tests.
  - `world/LevelWorld.ts` fixed-step level simulation (one `step(ActionFrame)` per 1/60 s)
  - `recorder/`, `ghosts/` Commit & Replay · `entities/` Player, Bug, Gate, Button
  - `logic/` button → AND/OR/NOT → gate wiring · `map/` Tiled JSON loader · `net/runs.ts` POST /runs with offline queue
- `levels/level-1-dronacharya/` map.json (Tiled), level.config.ts, Level1Scene.ts (rendering), hints.ts, solution.ts

### Map object conventions (Tiled `type`/`class`)

`spawn` (point, Bit's feet) · `button` (plate rect, name = logic id) · `gate` (closed area, name = logic id, `openTime`) ·
`bug` (`minTileX`, `maxTileX`, `speed` px/s, `splits`) · `exit` (finish trigger). Tile layers with property
`collision: true` are solid. Objects in `decor_objects` are drawn only.

Backend URL for run uploads: `VITE_API_URL` (default `http://<host>:3000`). Runs queue in localStorage when it's down.
