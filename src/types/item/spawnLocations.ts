import type { CddaData } from "../../data";
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
  items: Array<{ loot: Loot; chance?: chance }>
): Loot {
  if (items.length === 1 && (items[0].chance ?? 1) === 1) return items[0].loot;
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
  if (object.add)
    object.add = object.add.filter(
      (p) => p.x >= x && p.y >= y && p.x < x + 24 && p.y < y + 24
    );
  if (object.place_loot)
    object.place_loot = object.place_loot.filter(
      (p) => p.x >= x && p.y >= y && p.x < x + 24 && p.y < y + 24
    );
  return { ...mapgen, object };
}

const lootByOmSpecialCache = new WeakMap<CddaData, Map<string, Loot>>();
export function lootByOmSpecial(data: CddaData) {
  if (lootByOmSpecialCache.has(data)) return lootByOmSpecialCache.get(data);
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
  lootByOmSpecialCache.set(data, lootByOmSpecial);
  return lootByOmSpecial;
}

function overmapAppearance(
  data: CddaData,
  oms: raw.OvermapSpecial
): string | undefined {
  if (oms.subtype === "mutable") return;
  const overmaps = [...(oms.overmaps ?? [])];
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  const overmapsByPoint = new Map<string, typeof overmaps[0]>();
  for (const om of overmaps) {
    const omt_id = om.overmap.replace(/_(north|south|east|west)$/, "");
    if (!data.byId("overmap_terrain", omt_id)) continue;
    const [x, y, z] = om.point;
    if (z !== 0) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    overmapsByPoint.set(`${x}|${y}`, om);
  }
  // Skip any location that has no surface-level appearance.
  if (minX === Infinity || minY === Infinity) return;
  const appearanceComponents: any[] = [maxY - minY, maxX - minX];
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++) {
      const om = overmapsByPoint.get(`${x}|${y}`);
      if (om) {
        const omt_id = om.overmap.replace(/_(north|south|east|west)$/, "");
        const appearance = omtAppearanceString(omt_id);
        appearanceComponents.push(appearance);
      } else {
        appearanceComponents.push("no_om");
      }
    }

  return appearanceComponents.join("\0");

  function omtAppearanceString(omt_id: string): string {
    const omt = data.byId("overmap_terrain", omt_id);
    return omt
      ? `${omt.sym}\u0001${omt.color}\u0001${omt.name}`
      : `appearance_unk`;
  }
}

// Showing these is a bit spoilery, and also they are visually large, so hide them.
const hiddenLocations = new Set([
  "Necropolis",
  "Isherwood Farms",
  "lab_mutagen_6_level",
  "Lab_SECURITY_1x1x6",
  "Lab_CARGO_Surface",
  "hub_01",
]);
const lootByOmAppearanceCache = new WeakMap<
  CddaData,
  Map<string, { loot: Map<string, number>; ids: string[] }>
>();
export function lootByOMSAppearance(data: CddaData) {
  if (lootByOmAppearanceCache.has(data))
    return lootByOmAppearanceCache.get(data);
  const lootByOMS = lootByOmSpecial(data);
  const lootByOMSAppearance = new Map<
    string,
    { loot: Map<string, number>; ids: string[] }
  >();
  for (const [oms_id, loot] of lootByOMS.entries()) {
    if (hiddenLocations.has(oms_id)) continue;
    const appearance = overmapAppearance(
      data,
      data.byId("overmap_special", oms_id)
    );
    if (!appearance) continue;
    if (!lootByOMSAppearance.has(appearance))
      lootByOMSAppearance.set(appearance, { loot: undefined, ids: [] });
    const l = lootByOMSAppearance.get(appearance);
    if (l.loot)
      l.loot = mergeLoot([
        { loot: l.loot, weight: 1 },
        { loot: loot, weight: 1 },
      ]);
    else l.loot = loot;
    l.ids.push(oms_id);
  }
  lootByOmAppearanceCache.set(data, lootByOMSAppearance);
  return lootByOMSAppearance;
}

// Weighted average.
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
export function getLootForMapgen(data: CddaData, mapgen: raw.Mapgen): Loot {
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
  const countByPalette = new Map<string, number>();
  for (const row of mapgen.object.rows ?? [])
    for (const char of row)
      if (palette.has(char))
        countByPalette.set(char, (countByPalette.get(char) ?? 0) + 1);
  const items: { loot: Loot }[] = [];
  for (const [sym, count] of countByPalette.entries()) {
    const loot = palette.get(sym);
    const multipliedLoot: Loot = new Map();
    for (const [id, chance] of loot.entries()) {
      multipliedLoot.set(id, 1 - Math.pow(1 - chance, count));
    }
    items.push({ loot: multipliedLoot });
  }
  items.push({ loot: additional_items });
  const loot = collection(items);
  lootForMapgenCache.set(mapgen, loot);
  return loot;
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

const paletteCache = new WeakMap<RawPalette, Map<string, Loot>>();
export function parsePalette(
  data: CddaData,
  palette: RawPalette
): Map<string, Loot> {
  if (paletteCache.has(palette)) return paletteCache.get(palette);
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
  const ret = mergePalettes([item, items, sealed_item, ...palettes]);
  paletteCache.set(palette, ret);
  return ret;
}
