import type { CddaData } from "../../data";
import { singularName } from "../../data";
import type * as raw from "../../types";
import { Maybe } from "./utils";

/** 0.0 <= chance <= 1.0 */
type chance = number;

type Loot = Map</**item_id*/ string, chance>;
/** Independently choose whether to place each item  */
export function collection(
  items: Iterable<{ loot: Loot; chance: chance }>
): Loot {
  const ret = new Map();
  for (const { loot, chance } of items) {
    for (const [item_id, item_chance] of loot.entries()) {
      const current_chance = ret.get(item_id) ?? 0;
      const add_chance = item_chance * chance;
      const result = 1 - (1 - current_chance) * (1 - add_chance);
      ret.set(item_id, result);
    }
  }
  return ret;
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
  return data.byType<raw.Mapgen>("mapgen").map((mapgen) => {
    const overmap_terrains = new Maybe(mapgen.om_terrain)
      .map((om_terrain) => [om_terrain].flat(2))
      .getOrDefault([])
      .map((id) => data.byId("overmap_terrain", id))
      .map((ter) => ({ singularName: singularName(ter) }));

    const pal = parsePalette(data, mapgen.object);

    return {
      overmap_terrains,
      rows: mapgen.object.rows ?? [],
      palettes: pal.size ? [pal] : [],
      additional_items: new Map(),
    };
  });
  /*
  mapgen.object.add
  mapgen.object.place_item
  item, chance, repeat: number | [number] | [number, number]

  mapgen.object.place_items
  mapgen.object.place_loot

  mapgen.object is a palette

  */
  return [];
}

type LocationAndLoot = {
  mapgen: Mapgen;
  loot: Loot;
};
export function getAllLocationsAndLoot(data: CddaData): LocationAndLoot[] {
  return exports.getAllMapgens(data).map((mapgen) => {
    const items = mapgen.rows
      .flatMap((r) => Array.from(r))
      .flatMap((sym) =>
        mapgen.palettes.map((pallete) => ({
          loot: pallete.get(sym),
          chance: 1.0,
        }))
      );
    items.push({ loot: mapgen.additional_items, chance: 1.0 });
    const loot = collection(items);
    return { mapgen, loot };
  });
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

export function getItemGroup(data: CddaData, id: string): Loot {
  const g = data.flattenItemGroup(data.byId("item_group", id));
  return new Map(g.map(({ id, prob }) => [id, prob]));
}

type RawPaletteEntry = {
  chance?: number /*0 <= chance <= 100 */;
  item: string;
  // repeat?: number | [number] | [number, number];
};
type RawPalette = {
  // item
  items?: Record<string, RawPaletteEntry | RawPaletteEntry[]>;
  // sealed_item
  // palettes // str, distribution, param or switch
};
export function parsePalette(
  data: CddaData,
  palette: RawPalette
): Map<string, Loot> {
  const items = palette.items ?? {};
  return new Map(
    Object.entries(items).map(([sym, val]) => {
      const groups = [val].flat().map(({ item, chance }) => ({
        loot: getItemGroup(data, item),
        chance: (chance ?? 100) / 100,
      }));
      return [sym, collection(groups)];
    })
  );
}
