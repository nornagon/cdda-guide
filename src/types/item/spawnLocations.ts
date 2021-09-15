import type { CddaData } from "../../data";
import { singularName } from "../../data";
import type * as raw from "../../types";
import { multimap } from "./utils";

/** 0.0 <= chance <= 1.0 */
type chance = number;

export function repeatChance(
  repeat: undefined | number | [number] | [number, number],
  chance: chance
): chance {
  if (typeof repeat === "number") return 1 - Math.pow(1 - chance, repeat);
  if (!Array.isArray(repeat)) return 1.0;
  if (repeat.length === 1) repeat = [repeat[0], repeat[0]];
  let sum = 0;
  let count = 0;
  // It would me more efficient to use the formula
  // for the sum of a geometric progerssion,
  // but this should be easier to understand
  for (let r = repeat[0]; r <= repeat[1]; ++r) {
    sum += 1 - Math.pow(1 - chance, r);
    ++count;
  }
  return sum / count;
}

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
  overmap_terrains: OMT[]; // Not supposed to be empty
  rows: string[];
  palette: Map<string, Loot>;
  additional_items: Loot;
};
export function getAllMapgens(data: CddaData): Mapgen[] {
  return (
    data
      .byType("mapgen")
      // If om_terrain is missing, this is nested_mapgen or update_mapgen
      .filter((m) => m.om_terrain != null)
      .map(({ object, om_terrain }) => {
        const overmap_terrains = [om_terrain].flat(2).map((id) => {
          const omt = data.byId("overmap_terrain", id);
          return { singularName: (omt && singularName(omt)) ?? id };
        });
        const palette = parsePalette(data, object);
        const additional_items = collection(
          [...(object.place_item ?? []), ...(object.add ?? [])].map(
            ({ item, chance }) => ({
              /* TODO: repeat: number | [number] | [number, number] */
              loot: new Map([[item, (chance ?? 100) / 100]]),
              chance: 1,
            })
          )
        );
        return {
          overmap_terrains,
          rows: object.rows ?? [],
          palette,
          additional_items,
        };
      })
  );
  /*
  TODO:
  mapgen.object.place_items
  mapgen.object.place_loot
  */
  return [];
}

type LocationAndLoot = {
  mapgen: Mapgen;
  loot: Loot;
};
export function getAllLocationsAndLoot(data: CddaData): LocationAndLoot[] {
  return getAllMapgens(data).map((mapgen) => {
    const items = mapgen.rows
      .flatMap((r) => Array.from(r))
      .map((sym) => mapgen.palette.get(sym))
      .filter((loot) => loot != null)
      .map((loot) => ({
        loot,
        chance: 1.0,
      }));
    items.push({ loot: mapgen.additional_items, chance: 1.0 });
    const loot = collection(items);
    return { mapgen, loot };
  });
}

type SpawnLocation = {
  singularName: string;
  // sym: string
  // color: string
  chance: chance[];
};
export function getItemSpawnLocations(
  data: CddaData,
  item_id: string
): SpawnLocation[] {
  const entries = getAllLocationsAndLoot(data).flatMap(({ mapgen, loot }) => {
    if (!loot.has(item_id)) return [];
    const chance = loot.get(item_id);
    const { singularName } = mapgen.overmap_terrains[0];
    return [[singularName, chance] as [string, number]];
  });
  return [...multimap(entries)]
    .map(([k, v]) => ({
      singularName: k,
      chance: [...v].sort().reverse(),
    }))
    .sort(({ chance: lhs }, { chance: rhs }) => rhs[0] - lhs[0]);
}

export function getItemGroup(data: CddaData, id: string): Loot {
  const g = data.flattenItemGroup(data.byId("item_group", id));
  return new Map(g.map(({ id, prob }) => [id, prob]));
}

type RawPaletteEntry = {
  chance?: number /*0 <= chance <= 100 */;
  item: string | raw.ItemGroup | raw.ItemGroupEntry[] /* subtype collection */;
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
        loot:
          typeof item === "string"
            ? getItemGroup(data, item)
            : new Map() /*TODO*/,
        chance: (chance ?? 100) / 100,
      }));
      return [sym, collection(groups)];
    })
  );
}
