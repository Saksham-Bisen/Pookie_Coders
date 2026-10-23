import Phaser from 'phaser';
import { PALETTE } from '../constants';
import type { LevelMap, MapObject } from '../map/TiledMap';
import type { LogicGraph } from './LogicGraph';

/**
 * Draws a level's circuit from its map:
 *   `wire` polylines (prop `from` = logic node) glow cyan while that node is on,
 *   `logic_block` rects (name = AND/OR/NOT node, prop `gate`) light up with their output,
 *   `lamp` rects (prop `from`) show green when on, red when off.
 * Input dots light per wire, so players can read which inputs are on.
 */
export class WireRenderer {
  private g: Phaser.GameObjects.Graphics;
  private wires: MapObject[];
  private blocks: MapObject[];
  private lamps: MapObject[];

  constructor(scene: Phaser.Scene, map: LevelMap, private logic: LogicGraph, depth = 3) {
    this.g = scene.add.graphics().setDepth(depth);
    this.wires = map.objects.filter((o) => o.type === 'wire' && o.points && o.points.length > 1);
    this.blocks = map.objects.filter((o) => o.type === 'logic_block');
    this.lamps = map.objects.filter((o) => o.type === 'lamp');
    for (const b of this.blocks) {
      scene.add
        .text(b.x + b.w / 2, b.y + b.h / 2, String(b.props.gate ?? 'AND'), { fontFamily: '"VT323", monospace', fontSize: '8px', color: '#f2f2e9' })
        .setOrigin(0.5)
        .setDepth(depth + 1);
    }
  }

  draw(tick: number): void {
    const g = this.g.clear();
    const pulse = 0.2 + 0.1 * Math.sin(tick / 10);
    for (const w of this.wires) {
      const on = this.logic.value(String(w.props.from));
      const pts = w.points!;
      if (on) {
        g.lineStyle(3, PALETTE.cyan, pulse);
        this.path(pts);
      }
      g.lineStyle(1, on ? PALETTE.cyan : PALETTE.grey, 1);
      this.path(pts);
      const end = pts[pts.length - 1];
      g.fillStyle(on ? PALETTE.cyan : PALETTE.grey).fillCircle(end.x, end.y, 1.5);
    }
    for (const b of this.blocks) {
      const on = this.logic.value(b.name);
      g.fillStyle(PALETTE.navy).fillRect(b.x, b.y, b.w, b.h);
      g.lineStyle(1, on ? PALETTE.cyan : PALETTE.grey).strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      if (on) g.fillStyle(PALETTE.cyan, pulse).fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
    }
    for (const l of this.lamps) {
      const on = this.logic.value(String(l.props.from));
      g.fillStyle(on ? PALETTE.green : PALETTE.red).fillRect(l.x, l.y, l.w, l.h);
      g.fillStyle(on ? PALETTE.green : PALETTE.red, pulse).fillRect(l.x - 1, l.y - 1, l.w + 2, l.h + 2);
    }
  }

  private path(pts: { x: number; y: number }[]): void {
    this.g.beginPath().moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) this.g.lineTo(p.x, p.y);
    this.g.strokePath();
  }
}
