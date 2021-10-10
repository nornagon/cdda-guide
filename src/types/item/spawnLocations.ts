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

export type Loot = Map</**item_id*/ string, chance>;
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

function offsetMapgen(mapgen: raw.Mapgen, x: number, y: number): raw.Mapgen {
  const object = {
    ...mapgen.object,
    rows: (mapgen.object.rows ?? [])
      .slice(y * 24, (y + 1) * 24)
      .map((row) => row.slice(x * 24, (x + 1) * 24)),
  };
  if (object.place_items)
    object.place_items = object.place_items.filter(
      (p) => p.x >= x && p.y >= y && p.x < x + 24 && p.y < y + 24
    );
  if (object.place_item)
    object.place_item = object.place_item.filter(
      (p) => p.x >= x && p.y >= y && p.x < x + 24 && p.y < y + 24
    );
  if (object.place_loot)
    object.place_loot = object.place_loot.filter(
      (p) => p.x >= x && p.y >= y && p.x < x + 24 && p.y < y + 24
    );
  return { ...mapgen, object };
}

export function lootByOmSpecial(data: CddaData) {
  const mapgensByOmt = new Map<string, raw.Mapgen[]>();
  const add = (id: string, mapgen: raw.Mapgen) => {
    if (!mapgensByOmt.has(id)) mapgensByOmt.set(id, []);
    mapgensByOmt.get(id).push(mapgen);
  };
  // If om_terrain is missing, this is nested_mapgen or update_mapgen
  const mapgens = data.byType("mapgen").filter((m) => m.om_terrain != null);
  for (const mapgen of mapgens) {
    if (typeof mapgen.om_terrain === "string") {
      add(mapgen.om_terrain, mapgen);
    } else {
      if (typeof mapgen.om_terrain[0] === "string") {
        for (const id of mapgen.om_terrain as string[]) add(id, mapgen);
      } else {
        for (let y = 0; y < mapgen.om_terrain.length; y++)
          for (let x = 0; x < mapgen.om_terrain[y].length; x++)
            add(mapgen.om_terrain[y][x], offsetMapgen(mapgen, x, y));
      }
    }
  }

  // om_terrain can be one of three things:
  // 1. a string. if so, this mapgen can be instantiated for that om_terrain.
  // 2. an array of strings. if so, this mapgen can be instantiated for any of the given om_terrains.
  // 3. an array of arrays of strings. if so, this is actually several mapgens in a trench coat, and the ids are a grid.

  const overmap_specials = data.byType("overmap_special");

  const lootByOmSpecial = new Map<string, Loot>();
  for (const om_special of overmap_specials) {
    if (om_special.subtype === "mutable") continue;
    const loots = [];
    for (const om of om_special.overmaps ?? []) {
      const overmap_id = om.overmap.replace(/_(north|east|west|south)$/, "");
      const mapgens = mapgensByOmt.get(overmap_id) ?? [];
      const loot = mergeLoot(
        mapgens.map((mg) => ({
          weight: mg.weight ?? 1000,
          loot: getLootForMapgen(data, mg),
        }))
      );
      loots.push(loot);
    }
    lootByOmSpecial.set(om_special.id, addLoot(loots));
  }
  return lootByOmSpecial;
}

export function lootByOMT(data: CddaData) {
  const mapgensByOmt = new Map<string, raw.Mapgen[]>();
  const add = (id: string, mapgen: raw.Mapgen) => {
    if (!mapgensByOmt.has(id)) mapgensByOmt.set(id, []);
    mapgensByOmt.get(id).push(mapgen);
  };
  // If om_terrain is missing, this is nested_mapgen or update_mapgen
  const allMapgens = data.byType("mapgen").filter((m) => m.om_terrain != null);
  for (const mapgen of allMapgens) {
    if (typeof mapgen.om_terrain === "string") {
      add(mapgen.om_terrain, mapgen);
    } else {
      if (typeof mapgen.om_terrain[0] === "string") {
        for (const id of mapgen.om_terrain as string[]) add(id, mapgen);
      } else {
        for (let y = 0; y < mapgen.om_terrain.length; y++)
          for (let x = 0; x < mapgen.om_terrain[y].length; x++)
            add(mapgen.om_terrain[y][x], offsetMapgen(mapgen, x, y));
      }
    }
  }

  const omts = data.byType("overmap_terrain");
  const omtIdsByOmtKey = new Map<
    string,
    { omt: { sym: string; color: string; name: string }; ids: string[] }
  >();
  for (const omt of omts) {
    const key = `${omt.sym}\0${omt.color}\0${omt.name}`;
    if (!omt.id) continue;
    const ids = typeof omt.id === "string" ? [omt.id] : omt.id;
    if (!omtIdsByOmtKey.has(key))
      omtIdsByOmtKey.set(key, {
        omt: { sym: omt.sym, color: omt.color, name: singularName(omt) },
        ids: [],
      });
    omtIdsByOmtKey.get(key).ids.push(...ids);
  }
  const lootByOmtKey = new Map<
    string,
    { omt: { sym: string; color: string; name: string }; loot: Loot }
  >();
  for (const [key, { omt, ids }] of omtIdsByOmtKey.entries()) {
    const mapgens = ids.flatMap((id) => mapgensByOmt.get(id)).filter((x) => x);
    const loots = mapgens.map((mg) => ({
      loot: getLootForMapgen(data, mg),
      weight: mg.weight ?? 1000,
    }));
    const mergedLoot = mergeLoot(loots);
    lootByOmtKey.set(key, { omt, loot: mergedLoot });
  }
  return lootByOmtKey;
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
}

export function mergeLoot(loots: { loot: Loot; weight: number }[]): Loot {
  const totalWeight = loots.map((l) => l.weight).reduce((m, o) => m + o, 0);
  const mergedLoot: Loot = new Map();

  for (const { loot, weight } of loots) {
    const proportion = (weight ?? 1000) / totalWeight;
    for (const [item_id, chance] of loot.entries()) {
      mergedLoot.set(
        item_id,
        (mergedLoot.get(item_id) ?? 0) + chance * proportion
      );
    }
  }
  return mergedLoot;
}

function addLoot(loots: Loot[]): Loot {
  const ret: Loot = new Map();
  for (const loot of loots) {
    for (const [item_id, chance] of loot.entries()) {
      const oldChance = ret.get(item_id) ?? 0;
      ret.set(item_id, 1 - (1 - chance) * (1 - oldChance));
    }
  }
  return ret;
}

const lootForMapgenCache = new WeakMap<raw.Mapgen, Loot>();
function getLootForMapgen(data: CddaData, mapgen: raw.Mapgen): Loot {
  if (lootForMapgenCache.has(mapgen)) return lootForMapgenCache.get(mapgen);
  const palette = parsePalette(data, mapgen.object);
  const place_items = (mapgen.object.place_items ?? []).map(
    ({ item, chance = 100, repeat }) => ({
      loot: parseItemGroup(data, item),
      chance: repeatChance(repeat, chance / 100),
    })
  );
  const place_item = [
    ...(mapgen.object.place_item ?? []),
    ...(mapgen.object.add ?? []),
  ].map(({ item, chance = 100, repeat }) => ({
    loot: new Map([[item, repeatChance(repeat, chance / 100)]]),
  }));
  const place_loot = (mapgen.object.place_loot ?? []).map(
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
  const items = (mapgen.object.rows ?? [])
    .flatMap((r) => Array.from(r))
    .map((sym) => palette.get(sym))
    .filter((loot) => loot != null)
    .map((loot) => ({ loot }));
  items.push({ loot: additional_items });
  const loot = collection(items);
  lootForMapgenCache.set(mapgen, loot);
  return loot;
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
