import type { CddaData } from "../../data";

type OMT = {
  singularName: string;
  // sym: string
  // color: string
};
type Mapgen = {
  overmap_terrains: OMT[];
};
type LocationAndLoot = {
  mapgen: Mapgen;
  loot: Map</*item_id*/ string, /*chance*/ number>;
};
export function getAllLocationsAndLoot(data: CddaData): LocationAndLoot[] {
  throw "not implemented";
}

type SpawnLocation = {
  singularName: string;
  // sym: string
  // color: string
  chance: number;
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
