import type { CddaData } from "../../data";

type OMT = {
  // id: string[]
  // sym: string
  // color: string
  singularName: string;
};

type LocationAndLoot = {
  omt: OMT;
  loot: Map</*item_id*/ string, /*chance*/ number>;
};
export function getAllLocationsAndLoot(data: CddaData): LocationAndLoot[] {
  throw "not implemented";
}

type SpawnLocation = {
  singularName: string;
  // id: string[]
  // sym: string
  // color: string
  chance: number;
};
export function getItemSpawnLocations(
  data: CddaData,
  item_id: string
): SpawnLocation[] {
  // This is to allow tests to mock getAllLocationsAndLoot()
  const x = exports.getAllLocationsAndLoot(data);
  return x.flatMap(({ omt, loot }) =>
    loot.has(item_id) ? [{ chance: loot.get(item_id), ...omt }] : []
  );
}
