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
  let repeat_a = [repeat ?? 1].flat();
  if (repeat_a.length === 1) repeat_a = [repeat_a[0], repeat_a[0]];
  let sum = 0;
  let count = 0;
  // It would me more efficient to use the formula
  // for the sum of a geometric progerssion,
  // but this should be easier to understand
  for (let r = repeat_a[0]; r <= repeat_a[1]; ++r) {
    sum += 1 - Math.pow(1 - chance, r);
    ++count;
  }
  return sum / count;
}

type Loot = Map</**item_id*/ string, chance>;
/** Independently choose whether to place each item  */
export function collection(
  items: Iterable<{ loot: Loot; chance?: chance }>
): Loot {
  const ret = new Map();
  for (const { loot, chance = 1.0 } of items) {
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
        const place_items = (object.place_items ?? []).map(
          ({ item, chance = 100, repeat }) => ({
            loot: parseItemGroup(data, item),
            chance: repeatChance(repeat, chance / 100),
          })
        );
        const place_item = [
          ...(object.place_item ?? []),
          ...(object.add ?? []),
        ].map(({ item, chance = 100, repeat }) => ({
          loot: new Map([[item, repeatChance(repeat, chance / 100)]]),
        }));
        const place_loot = (object.place_loot ?? []).map(
          ({ item, group, chance = 100, repeat }) => ({
            // This assumes that .item and .group are mutually exclusive
            loot: item ? new Map([[item, 1]]) : parseItemGroup(data, group),
            chance: repeatChance(repeat, chance / 100),
          })
        );
        const additional_items = collection([
          ...place_items,
          ...place_item,
          ...place_loot,
        ]);
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
  mapgen.object.place_loot
  */
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
      .map((loot) => ({ loot }));
    items.push({ loot: mapgen.additional_items });
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

function parseItemGroup(
  data: CddaData,
  group: string | raw.ItemGroup | raw.ItemGroupEntry[]
): Loot {
  const g =
    typeof group === "string"
      ? data.byId("item_group", group)
      : Array.isArray(group)
      ? { subtype: "collection" as "collection", entries: group }
      : group;
  const flat = data.flattenItemGroup(g);
  return new Map(flat.map(({ id, prob }) => [id, prob]));
}

function mergePalettes(palettes: Map<string, Loot>[]): Map<string, Loot> {
  return [palettes]
    .map((x) => x.flatMap((p) => [...p]))
    .map((x) => [...multimap(x)])
    .map((x) =>
      x.map(([k, v]) => [
        k,
        collection(
          v.map((l) => ({
            loot: l,
          }))
        ),
      ])
    )
    .map((x: [string, Loot][]) => new Map(x))[0];
}

type RawPalette = {
  item?: raw.PlaceMapping<raw.MapgenSpawnItem>;
  items?: raw.PlaceMapping<raw.MapgenItemGroup>;
  sealed_item?: raw.PlaceMapping<raw.MapgenSealedItem>;
  palettes?: (
    | string
    | { param: any }
    | { distribution: any }
    | { switch: any }
  )[];
};

function parsePlaceMapping<T>(
  mapping: undefined | raw.PlaceMapping<T>,
  extract: (t: T) => Iterable<{ chance: chance; loot: Loot }>
): Map<string, Loot> {
  return new Map(
    Object.entries(mapping ?? {}).map(([sym, val]) => [
      sym,
      collection([val].flat().flatMap((x: T) => [...extract(x)])),
    ])
  );
}

export function parsePalette(
  data: CddaData,
  palette: RawPalette
): Map<string, Loot> {
  const sealed_item = parsePlaceMapping(
    palette.sealed_item,
    function* ({ item, items, chance = 100 }) {
      if (items)
        yield {
          loot: parseItemGroup(data, items.item),
          chance: repeatChance(
            items.repeat,
            (chance / 100) * ((items.chance ?? 100) / 100)
          ),
        };
      if (item)
        yield {
          loot: new Map([[item.item, 1]]),
          chance: repeatChance(
            item.repeat,
            (chance / 100) * ((item.chance ?? 100) / 100)
          ),
        };
    }
  );
  const item = parsePlaceMapping(
    palette.item,
    function* ({ item, chance = 100, repeat }) {
      yield {
        loot: new Map([[item, 1]]),
        chance: repeatChance(repeat, chance / 100),
      };
    }
  );
  const items = parsePlaceMapping(
    palette.items,
    function* ({ item, chance = 100, repeat }) {
      yield {
        loot: parseItemGroup(data, item),
        chance: repeatChance(repeat, chance / 100),
      };
    }
  );
  const palettes = (palette.palettes ?? [])
    .flatMap((id) =>
      typeof id !== "string" ? [] /*TODO*/ : [data.byId("palette", id)]
    )
    .map((p) => parsePalette(data, p));
  return mergePalettes([item, items, sealed_item, ...palettes]);
}
