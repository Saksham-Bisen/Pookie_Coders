import { EventBus, type PixaEvents } from '@pixa/core/events';
import { parseTiledMap, type TiledMapJson } from '@pixa/core/map/TiledMap';
import { LevelWorld } from '@pixa/core/world/LevelWorld';
import config from './level.config';
import mapJson from './map.json';

/** Builds the Level 1 simulation. Used by the Phaser scene and by the headless test. */
export function createLevel1World(bus?: EventBus<PixaEvents>): LevelWorld {
  return new LevelWorld(parseTiledMap(mapJson as unknown as TiledMapJson), config, bus);
}
