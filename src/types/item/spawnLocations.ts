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
  const min = (x: number | [number] | [number, number]) =>
    Array.isArray(x) ? x[0] : x;
  const mx = x * 24;
  const my = y * 24;
  if (object.place_items)
    object.place_items = object.place_items.filter(
      (p) =>
        min(p.x) >= mx &&
        min(p.y) >= my &&
        min(p.x) < mx + 24 &&
        min(p.y) < my + 24
    );
  if (object.place_item)
    object.place_item = object.place_item.filter(
      (p) =>
        min(p.x) >= mx &&
        min(p.y) >= my &&
        min(p.x) < mx + 24 &&
        min(p.y) < my + 24
    );
  if (object.add)
    object.add = object.add.filter(
      (p) =>
        min(p.x) >= mx &&
        min(p.y) >= my &&
        min(p.x) < mx + 24 &&
        min(p.y) < my + 24
    );
  if (object.place_loot)
    object.place_loot = object.place_loot.filter(
      (p) =>
        min(p.x) >= mx &&
        min(p.y) >= my &&
        min(p.x) < mx + 24 &&
        min(p.y) < my + 24
    );
  if (object.place_nested)
    object.place_nested = object.place_nested.filter(
      (p) =>
        min(p.x) >= mx &&
        min(p.y) >= my &&
        min(p.x) < mx + 24 &&
        min(p.y) < my + 24
    );
  return { ...mapgen, object };
}

const requestIdleCallback: typeof window.requestIdleCallback =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback
    : function (cb: (deadline: IdleDeadline) => void): number {
        var start = Date.now();
        return setTimeout(function () {
          cb({
            didTimeout: false,
            timeRemaining: function () {
              return Math.max(0, 50 - (Date.now() - start));
            },
          });
        }, 0) as unknown as number;
      };

function yieldUntilIdle(): Promise<IdleDeadline> {
  return new Promise<IdleDeadline>((resolve) => {
    requestIdleCallback(resolve, { timeout: 100 });
  });
}

async function yieldable<T>(
  f: (wait: () => Promise<void>) => Promise<T>
): Promise<T> {
  let deadline = await yieldUntilIdle();
  return f(async () => {
    if (deadline.timeRemaining() <= 0) {
      deadline = await yieldUntilIdle();
    }
  });
}

const lootByOmSpecialCache = new WeakMap<CddaData, Map<string, Loot>>();
export async function lootByOmSpecial(data: CddaData) {
  if (lootByOmSpecialCache.has(data)) return lootByOmSpecialCache.get(data)!;
  const mapgensByOmt = new Map<string, raw.Mapgen[]>();
  const add = (id: string, mapgen: raw.Mapgen) => {
    if (!mapgensByOmt.has(id)) mapgensByOmt.set(id, []);
    mapgensByOmt.get(id)!.push(mapgen);
  };
  // If om_terrain is missing, this is nested_mapgen or update_mapgen
  for (const mapgen of data.byType("mapgen")) {
    if (!mapgen.om_terrain) continue;
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
  await yieldable(async (relinquish) => {
    for (const om_special of overmap_specials) {
      if (om_special.subtype === "mutable") continue;
      const loots: Loot[] = [];
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
        await relinquish();
      }
      lootByOmSpecial.set(om_special.id, addLoot(loots));
    }
  });
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
    if (!data.byIdMaybe("overmap_terrain", omt_id)) continue;
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
  "aircraft_carrier",
  "airliner_crashed",
  "farm_abandoned",
  "ranch_camp",
  "mil_base",
  "valhalla_cult",
  "nuclear power plant",
  "tutorial",
]);
const lootByOmAppearanceCache = new WeakMap<
  CddaData,
  Promise<Map<string, { loot: Map<string, number>; ids: string[] }>>
>();
export function lootByOMSAppearance(data: CddaData) {
  if (!lootByOmAppearanceCache.has(data))
    lootByOmAppearanceCache.set(data, computeLootByOMSAppearance(data));
  return lootByOmAppearanceCache.get(data)!;
}
async function computeLootByOMSAppearance(data: CddaData) {
  const lootByOMS = await lootByOmSpecial(data);
  const lootByOMSAppearance = new Map<
    string,
    { loot: Map<string, number>; ids: string[] }
  >();
  await yieldable(async (relinquish) => {
    for (const [oms_id, loot] of lootByOMS.entries()) {
      if (hiddenLocations.has(oms_id)) continue;
      const appearance = overmapAppearance(
        data,
        data.byId("overmap_special", oms_id)
      );
      if (!appearance) continue;
      if (!lootByOMSAppearance.has(appearance))
        lootByOMSAppearance.set(appearance, {
          loot: undefined as any,
          ids: [],
        });
      const l = lootByOMSAppearance.get(appearance)!;
      if (l.loot)
        l.loot = mergeLoot([
          { loot: l.loot, weight: 1 },
          { loot: loot, weight: 1 },
        ]);
      else l.loot = loot;
      await relinquish();
      l.ids.push(oms_id);
    }
  });
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

function attenuateLoot(loot: Loot, t: number): Loot {
  const attenuatedLoot: Loot = new Map();
  for (const [k, v] of loot.entries()) attenuatedLoot.set(k, v * t);
  return attenuatedLoot;
}

function attenuatePalette(
  palette: Map<string, Loot>,
  t: number
): Map<string, Loot> {
  const attenuatedPalette: Map<string, Loot> = new Map();
  for (const [k, v] of palette.entries())
    attenuatedPalette.set(k, attenuateLoot(v, t));
  return attenuatedPalette;
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

let onStack = 0;
function lootForChunks(
  data: CddaData,
  chunks: (string | [string, number])[]
): Loot {
  onStack += 1;
  // TODO: See https://github.com/nornagon/cdda-guide/issues/73
  if (onStack > 4) return new Map();
  const normalizedChunks = (chunks ?? []).map((c) =>
    typeof c === "string" ? ([c, 100] as [string, number]) : c
  );
  const loot = mergeLoot(
    normalizedChunks.map(([chunkId, weight]) => {
      const chunkMapgens = data.nestedMapgensById(chunkId) ?? [];
      const loot = mergeLoot(
        chunkMapgens.map((mg) => {
          const loot = getLootForMapgen(data, mg);
          const weight = mg.weight ?? 1000;
          return { loot, weight };
        })
      );
      return { loot, weight };
    })
  );
  onStack -= 1;
  return loot;
}

const lootForMapgenCache = new WeakMap<raw.Mapgen, Loot>();
export function getLootForMapgen(data: CddaData, mapgen: raw.Mapgen): Loot {
  if (lootForMapgenCache.has(mapgen)) return lootForMapgenCache.get(mapgen)!;
  const palette = parsePalette(data, mapgen.object);
  const place_items = (mapgen.object.place_items ?? []).map(
    ({ item, chance = 100, repeat }) => ({
      loot: parseItemGroup(data, item, repeat, chance / 100),
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
      loot: item
        ? new Map([[item, 1]])
        : group
        ? parseItemGroup(data, group, repeat, chance / 100)
        : new Map(),
    })
  );
  const place_nested = (mapgen.object.place_nested ?? []).map((nested) => {
    const loot = lootForChunks(data, nested.chunks ?? []);
    const multipliedLoot: Loot = new Map();
    for (const [id, chance] of loot.entries()) {
      multipliedLoot.set(id, repeatChance(nested.repeat, chance));
    }
    return { loot: multipliedLoot };
  });
  const additional_items = collection([
    ...place_items,
    ...place_item,
    ...place_loot,
    ...place_nested,
  ]);
  const countByPalette = new Map<string, number>();
  for (const row of mapgen.object.rows ?? [])
    for (const char of row)
      if (palette.has(char))
        countByPalette.set(char, (countByPalette.get(char) ?? 0) + 1);
  const items: { loot: Loot }[] = [];
  for (const [sym, count] of countByPalette.entries()) {
    const loot = palette.get(sym)!;
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

function repeatThroughArr(
  loot: [string, chance][],
  repeat: undefined | number | [number] | [number, number],
  chance: number
): [string, chance][] {
  return loot.map(([id, v]) => {
    return [id, repeatChance(repeat, chance * v)];
  });
}

function parseItemGroup(
  data: CddaData,
  group: string | raw.ItemGroup | raw.ItemGroupEntry[],
  repeat: undefined | number | [number] | [number, number],
  chance: chance
): Loot {
  const g =
    typeof group === "string"
      ? data.byId("item_group", group)
      : Array.isArray(group)
      ? { subtype: "collection" as "collection", entries: group }
      : group;
  const flat = data.flattenItemGroup(g);
  return new Map(
    repeatThroughArr(
      flat.map(({ id, prob }) => [id, prob]),
      repeat,
      chance
    )
  );
}

function mergePalettes(palettes: Map<string, Loot>[]): Map<string, Loot> {
  return [palettes]
    .map((x) => x.flatMap((p) => [...p]))
    .map((x) => [...multimap(x)])
    .map((x) =>
      x.map(
        ([k, v]) =>
          [
            k,
            collection(
              v.map((l) => ({
                loot: l,
              }))
            ),
          ] as const
      )
    )
    .map((x: (readonly [string, Loot])[]) => new Map(x))[0];
}

type RawPalette = {
  item?: raw.PlaceMapping<raw.MapgenSpawnItem>;
  items?: raw.PlaceMapping<raw.MapgenItemGroup>;
  sealed_item?: raw.PlaceMapping<raw.MapgenSealedItem>;
  nested?: raw.PlaceMapping<raw.MapgenNested>;
  palettes?: (
    | string
    | { param: any }
    | { distribution: [string, number][] }
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
      collection(
        (Array.isArray(val) ? val : [val]).flatMap((x: T) => [...extract(x)])
      ),
    ])
  );
}

const paletteCache = new WeakMap<RawPalette, Map<string, Loot>>();
export function parsePalette(
  data: CddaData,
  palette: RawPalette
): Map<string, Loot> {
  if (paletteCache.has(palette)) return paletteCache.get(palette)!;
  const sealed_item = parsePlaceMapping(
    palette.sealed_item,
    function* ({ item, items, chance = 100 }) {
      if (items)
        yield {
          loot: parseItemGroup(
            data,
            items.item,
            items.repeat,
            ((chance / 100) * (items.chance ?? 100)) / 100
          ),
          chance: 1,
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
        loot: parseItemGroup(data, item, repeat, chance / 100),
        chance: 1,
      };
    }
  );
  const nested = parsePlaceMapping(palette.nested, function* ({ chunks }) {
    yield {
      loot: lootForChunks(data, chunks ?? []),
      chance: 1,
    };
  });
  const palettes = (palette.palettes ?? []).flatMap((id) => {
    if (typeof id === "string") {
      return [parsePalette(data, data.byId("palette", id))];
    } else if ("distribution" in id) {
      const opts = id.distribution;
      const totalProb = opts.reduce((m, [, prob]) => m + prob, 0);
      return opts.map(([subId, prob]) =>
        attenuatePalette(
          parsePalette(data, data.byId("palette", subId)),
          prob / totalProb
        )
      );
    } else return [];
  });
  const ret = mergePalettes([item, items, sealed_item, nested, ...palettes]);
  paletteCache.set(palette, ret);
  return ret;
}
