import type { CddaData } from "../../data";

/** 0.0 < chance < 1.0 */
type chance = number;

type Loot = Map</**item_id*/ string, chance>;
/** Independently choose whether to place each item  */
export function collection(
  items: Iterable<{ loot: Loot; chance: chance }>
): Loot {
  return new Map();
}
/** Choose based on weight */
export function distribution(
  items: Iterable<{ loot: Loot; weight: number }>
): Loot {
  throw "not implemented";
}

type OMT = {
  singularName: string;
  // sym: string
  // color: string
};
type Mapgen = {
  overmap_terrains: OMT[];
  rows: string[];
  palettes: Map<string, Loot>[];
  additional_items: Loot;
};
export function getAllMapgens(data: CddaData): Mapgen[] {
  /*
  data.byType<Mapgen>('mapgen');
  mg.om_terrain
  mapgen.object
  mapgen.object.palettes
  mapgen.object.rows
  mapgen.object.place_item
  mapgen.object.place_items
  mapgen.object.place_loot
  mapgen.object.add
  */
  throw "not implemented";
}

type LocationAndLoot = {
  mapgen: Mapgen;
  loot: Loot;
};
export function getAllLocationsAndLoot(data: CddaData): LocationAndLoot[] {
  throw "not implemented";
}

type SpawnLocation = {
  singularName: string;
  // sym: string
  // color: string
  chance: chance;
};
export function getItemSpawnLocations(
  data: CddaData,
  item_id: string
): SpawnLocation[] {
  return exports // This is to allow tests to mock getAllLocationsAndLoot()
    .getAllLocationsAndLoot(data)
    .flatMap(({ mapgen, loot }) => {
      if (!loot.has(item_id)) return [];
      const chance = loot.get(item_id);
      const omt = mapgen.overmap_terrains[0];
      return { chance: chance, ...omt };
    });
}
