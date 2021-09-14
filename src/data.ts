import { writable } from "svelte/store";
import type {
  Translation,
  Requirement,
  ItemGroup,
  ItemGroupEntry,
  ItemGroupEntryOrShortcut,
  Recipe,
  Mapgen,
  PaletteData,
  Palette,
  Item,
  DamageInstance,
  DamageUnit,
  RequirementData,
  Monster,
  SupportedTypes,
  SupportedTypesWithMapped,
} from "./types";

const idlessTypes = new Set([
  "MONSTER_BLACKLIST",
  "MONSTER_FACTION",
  "charge_removal_blacklist",
  "dream",
  "hit_range",
  "mapgen",
  "monstergroup",
  "obsolete_terrain",
  "overlay_order",
  "overmap_land_use_code",
  "overmap_terrain",
  "profession_item_substitutions",
  "recipe",
  "rotatable_symbol",
  "snippet",
  "speech",
  "uncraft",
]);

const typeMappings = new Map([
  ["AMMO", "item"],
  ["GUN", "item"],
  ["ARMOR", "item"],
  ["PET_ARMOR", "item"],
  ["TOOL", "item"],
  ["TOOLMOD", "item"],
  ["TOOL_ARMOR", "item"],
  ["BOOK", "item"],
  ["COMESTIBLE", "item"],
  ["ENGINE", "item"],
  ["WHEEL", "item"],
  ["GUNMOD", "item"],
  ["MAGAZINE", "item"],
  ["BATTERY", "item"],
  ["GENERIC", "item"],
  ["BIONIC_ITEM", "item"],
  ["MONSTER", "monster"],
  ["uncraft", "recipe"],
]);

export const mapType = (type: string): string => typeMappings.get(type) ?? type;

export const singular = (name: Translation): string =>
  typeof name === "string" ? name : "str_sp" in name ? name.str_sp : name.str;

export const plural = (name: Translation): string =>
  typeof name === "string"
    ? name + "s"
    : "str_sp" in name
    ? name.str_sp
    : "str_pl" in name
    ? name.str_pl
    : name.str + "s";

export const singularName = (obj: any): string =>
  singular(obj?.name ?? obj?.id ?? obj?.abstract);

export const pluralName = (obj: any): string =>
  plural(obj?.name ?? obj?.id ?? obj?.abstract);

export function showProbability(prob: number) {
  const ret = (prob * 100).toFixed(2);
  if (ret === "0.00") return "< 0.01%";
  return ret + "%";
}

export function parseVolume(string: string | number): number {
  if (typeof string === "undefined") return 0;
  if (typeof string === "number") return string * 250;
  if (string.endsWith("ml")) return parseInt(string);
  else if (string.endsWith("L")) return parseInt(string) * 1000;
}

export function parseMass(string: string | number): number {
  if (typeof string === "undefined") return 0;
  if (typeof string === "number") return string;
  if (string.endsWith("mg")) return parseInt(string) / 1000;
  if (string.endsWith("kg")) return parseInt(string) * 1000;
  if (string.endsWith("g")) return parseInt(string);
}

export function asLiters(string: string | number): string {
  const ml = parseVolume(string);
  return `${(ml / 1000).toFixed(2)} L`;
}

export function asKilograms(string: string | number): string {
  const g = parseMass(string);
  return `${(g / 1000).toFixed(2)} kg`;
}

export class CddaData {
  _raw: any[];
  _byType: Map<string, any[]> = new Map();
  _byTypeById: Map<string, Map<string, any>> = new Map();
  _abstractsByType: Map<string, Map<string, any>> = new Map();
  _toolReplacements: Map<string, string[]>;
  _craftingPseudoItems: Map<string, string> = new Map();
  _migrations: Map<string, string> = new Map();
  _flattenCache: Map<any, any> = new Map();

  release: any;
  build_number: string;

  constructor(raw: any[], build_number?: string, release?: any) {
    this.release = release;
    this.build_number = build_number;
    this._raw = raw;
    for (const obj of raw) {
      if (!Object.hasOwnProperty.call(obj, "type")) continue;
      if (obj.type === "MIGRATION") {
        for (const id of typeof obj.id === "string" ? [obj.id] : obj.id) {
          const { replace } = obj;
          this._migrations.set(id, replace);
        }
        continue;
      }
      const mappedType = mapType(obj.type);
      if (!this._byType.has(mappedType)) this._byType.set(mappedType, []);
      this._byType.get(mappedType).push(obj);
      if (Object.hasOwnProperty.call(obj, "id")) {
        if (!this._byTypeById.has(mappedType))
          this._byTypeById.set(mappedType, new Map());
        if (typeof obj.id === "string")
          this._byTypeById.get(mappedType).set(obj.id, obj);
        else if (Array.isArray(obj.id))
          for (const id of obj.id)
            this._byTypeById.get(mappedType).set(id, obj);
      }
      // recipes are id'd by their result
      if (
        mappedType === "recipe" &&
        Object.hasOwnProperty.call(obj, "result")
      ) {
        if (!this._byTypeById.has(mappedType))
          this._byTypeById.set(mappedType, new Map());
        const id = obj.result + (obj.id_suffix ? "_" + obj.id_suffix : "");
        this._byTypeById.get(mappedType).set(id, obj);
      }
      if (
        mappedType === "monstergroup" &&
        Object.hasOwnProperty.call(obj, "name")
      ) {
        if (!this._byTypeById.has(mappedType))
          this._byTypeById.set(mappedType, new Map());
        const id = obj.name;
        this._byTypeById.get(mappedType).set(id, obj);
      }
      if (Object.hasOwnProperty.call(obj, "abstract")) {
        if (!this._abstractsByType.has(mappedType))
          this._abstractsByType.set(mappedType, new Map());
        this._abstractsByType.get(mappedType).set(obj.abstract, obj);
      }

      if (Object.hasOwnProperty.call(obj, "crafting_pseudo_item")) {
        this._craftingPseudoItems.set(obj.crafting_pseudo_item, obj.id);
      }
    }
  }

  byId<TypeName extends keyof SupportedTypesWithMapped>(
    type: TypeName,
    id: string
  ): SupportedTypesWithMapped[TypeName] {
    if (typeof id !== "string") throw new Error("Requested non-string id");
    if (type === "item" && this._migrations.has(id))
      return this.byId(type, this._migrations.get(id));
    const obj = this._byTypeById.get(type)?.get(id);
    if (obj) return this._flatten(obj);
  }

  byType<TypeName extends keyof SupportedTypesWithMapped>(
    type: TypeName
  ): SupportedTypesWithMapped[TypeName][] {
    return this._byType.get(type)?.map((x) => this._flatten(x)) ?? [];
  }

  replacementTools(type: string): string[] {
    if (!this._toolReplacements) {
      this._toolReplacements = new Map();
      for (const obj of this.byType("item")) {
        if (obj.type === "TOOL" && Object.hasOwnProperty.call(obj, "sub")) {
          if (!this._toolReplacements.has(obj.sub))
            this._toolReplacements.set(obj.sub, []);
          this._toolReplacements.get(obj.sub).push(obj.id);
        }
      }
    }
    return this._toolReplacements.get(type) ?? [];
  }

  craftingPseudoItem(id: string): string | undefined {
    return this._craftingPseudoItems.get(id);
  }

  all() {
    return this._raw;
  }

  _flatten<T = any>(_obj: T): T {
    const obj: any = _obj;
    if (this._flattenCache.has(obj)) return this._flattenCache.get(obj);
    const parent =
      "copy-from" in obj
        ? this._byTypeById.get(mapType(obj.type))?.get(obj["copy-from"]) ??
          this._abstractsByType.get(mapType(obj.type))?.get(obj["copy-from"])
        : null;
    if ("copy-from" in obj && !parent)
      console.error(
        `Missing parent in ${
          obj.id ?? obj.abstract ?? obj.result ?? JSON.stringify(obj)
        }`
      );
    if (!parent) {
      this._flattenCache.set(obj, obj);
      return obj;
    }
    const ret = { ...this._flatten(parent), ...obj };
    for (const k of Object.keys(ret.relative ?? {})) {
      if (typeof ret.relative[k] === "number") {
        ret[k] = (ret[k] ?? 0) + ret.relative[k];
      }
      // TODO: damage, vitamins, mass, volume, time
    }
    delete ret.relative;
    for (const k of Object.keys(ret.proportional ?? {})) {
      if (typeof ret.proportional[k] === "number") {
        if (k === "attack_cost" && !(k in ret)) ret[k] = 100;
        if (typeof ret[k] === "string") {
          const m = /^\s*(\d+)\s*(.+)$/.exec(ret[k]);
          if (m) {
            const [, num, unit] = m;
            ret[k] = `${Number(num) * ret.proportional[k]} ${unit}`;
          }
        } else {
          ret[k] *= ret.proportional[k];
          ret[k] = ret[k] | 0; // most things are ints.. TODO: what keys are float?
        }
      }
      // TODO: damage, mass, volume, time (need to check the base value's type)
    }
    delete ret.proportional;
    for (const k of Object.keys(ret.extend ?? {})) {
      if (Array.isArray(ret.extend[k])) {
        ret[k] = (ret[k] ?? []).concat(ret.extend[k]);
      }
    }
    delete ret.extend;
    for (const k of Object.keys(ret.delete ?? {})) {
      if (Array.isArray(ret.delete[k])) {
        // Some 'delete' entries delete qualities, which are arrays. As a rough
        // heuristic, compare recursively.
        const isEqual = (x, y) =>
          x === y ||
          (Array.isArray(x) &&
            Array.isArray(y) &&
            x.length === y.length &&
            x.every((j, i) => isEqual(j, y[i])));
        ret[k] = (ret[k] ?? []).filter(
          (x) => !ret.delete[k].some((y) => isEqual(y, x))
        );
      }
    }
    delete ret.delete;
    this._flattenCache.set(obj, ret);
    return ret;
  }

  _cachedDeathDrops: Map<
    string,
    { id: string; prob: number; count: [number, number] }[]
  > = new Map();
  flatDeathDrops(
    mon_id: string
  ): { id: string; prob: number; count: [number, number] }[] {
    if (this._cachedDeathDrops.has(mon_id))
      return this._cachedDeathDrops.get(mon_id);
    const normalizeDeathDrops = (
      death_drops: Monster["death_drops"]
    ): ItemGroup | undefined => {
      if (death_drops) {
        if (typeof death_drops === "string") {
          return this.byId("item_group", death_drops);
        } else if (Array.isArray(death_drops)) {
          return { subtype: "distribution", entries: death_drops };
        } else {
          return { subtype: "distribution", ...death_drops };
        }
      }
    };
    const mon = this.byId("monster", mon_id);
    const ret = mon.death_drops
      ? this.flattenItemGroup(normalizeDeathDrops(mon.death_drops))
      : [];
    ret.sort((a, b) => b.prob - a.prob);
    this._cachedDeathDrops.set(mon_id, ret);
    return ret;
  }

  uncraftRecipe(item_id: string): Recipe | undefined {
    let reversed: Recipe;
    for (const recipe of this.byType("recipe")) {
      if (recipe.result === item_id) {
        if ((recipe.type as any) === "uncraft") return recipe;
        else if (recipe.reversible) reversed = recipe;
      }
    }
    return reversed;
  }

  _cachedMapgenSpawnItems = new Map<Mapgen, string[]>();
  mapgenSpawnItems(mapgen: Mapgen): string[] {
    if (this._cachedMapgenSpawnItems.has(mapgen))
      return this._cachedMapgenSpawnItems.get(mapgen);
    const palette = new Map<string, Set<string>>();
    const add = (c: string, item_id: string) => {
      if (!palette.has(c)) palette.set(c, new Set());
      palette.get(c).add(item_id);
    };

    const addGroup = (c: string, v: string | ItemGroup | ItemGroupEntry[]) => {
      const group =
        typeof v === "string"
          ? this.byId("item_group", v)
          : Array.isArray(v)
          ? { subtype: "collection" as const, entries: v }
          : v;
      if (group) {
        for (const { id } of this.flattenItemGroup(group)) add(c, id);
      } else {
        if (typeof v === "string") {
          const item = this.byId("item", v);
          if (item) add(c, v);
        }
      }
    };

    const addPalette = (palette: PaletteData) => {
      for (const [c, v] of Object.entries(palette.item ?? {})) {
        const va = Array.isArray(v) ? v : [v];
        for (const s of va) add(c, s.item);
      }
      for (const [c, v] of Object.entries(palette.items ?? {})) {
        const va = Array.isArray(v) ? v : [v];
        for (const s of va) addGroup(c, s.item);
      }
      for (const [c, v] of Object.entries(palette.sealed_item ?? {})) {
        const va = Array.isArray(v) ? v : [v];
        for (const s of va) {
          if (s.item?.item) add(c, s.item.item);
          if (s.items?.item) addGroup(c, s.items.item);
        }
      }
    };

    addPalette(mapgen.object);

    for (const p_id of mapgen.object.palettes ?? [])
      if (typeof p_id === "string") addPalette(this.byId("palette", p_id));
      else {
        // TODO: handle param/distribution/switch
      }

    const ret = new Set<string>();

    const usedChars = new Set<string>();
    for (const row of mapgen.object.rows ?? []) {
      for (const char of row) {
        usedChars.add(char);
      }
    }
    for (const char of usedChars) {
      const v = palette.get(char) ?? new Set();
      for (const x of v) ret.add(x);
    }

    for (const v of mapgen.object.place_item ?? []) ret.add(v.item);

    for (const v of mapgen.object.place_items ?? []) {
      const group =
        typeof v.item === "string"
          ? this.byId("item_group", v.item)
          : Array.isArray(v.item)
          ? { subtype: "collection" as const, entries: v.item }
          : v.item;
      if (group) {
        for (const { id } of this.flattenItemGroup(group)) ret.add(id);
      } else {
        if (typeof v === "string") {
          const item = this.byId("item", v);
          if (item) ret.add(v);
        }
      }
    }

    for (const v of mapgen.object.place_loot ?? []) {
      if (v.item) ret.add(v.item);
      if (v.group)
        for (const { id } of this.flattenItemGroup(
          this.byId("item_group", v.group)
        ))
          ret.add(id);
    }

    for (const v of mapgen.object.add ?? []) ret.add(v.item);

    const r = [...ret];
    this._cachedMapgenSpawnItems.set(mapgen, r);
    return r;
  }

  // This is a WeakMap because flattenItemGroup is sometimes called with temporary objects
  _flattenItemGroupCache = new WeakMap<
    ItemGroup,
    { id: string; prob: number; count: [number, number] }[]
  >();
  flattenItemGroup(
    group: ItemGroup
  ): { id: string; prob: number; count: [number, number] }[] {
    if (this._flattenItemGroupCache.has(group))
      return this._flattenItemGroupCache.get(group);
    const retMap = new Map<string, { prob: number; count: [number, number] }>();

    function addOne({
      id,
      prob,
      count,
    }: {
      id: string;
      prob: number;
      count: [number, number];
    }) {
      const { prob: prevProb, count: prevCount } = retMap.get(id) ?? {
        prob: 0,
        count: [0, 0],
      };
      const newProb = 1 - (1 - prevProb) * (1 - prob);
      const newCount: [number, number] = [
        count[0] + prevCount[0],
        count[1] + prevCount[1],
      ];
      retMap.set(id, { prob: newProb, count: newCount });
    }

    function add(
      ...args: { id: string; prob: number; count: [number, number] }[]
    ) {
      args.forEach(addOne);
    }

    if (group["container-item"])
      add({ id: group["container-item"], prob: 1, count: [1, 1] });

    const normalizedEntries: ItemGroupEntry[] = [];
    if (group.subtype === "old" || !group.subtype) {
      for (const item of group.items as ItemGroupEntryOrShortcut[])
        if (Array.isArray(item))
          normalizedEntries.push({ item: item[0], prob: item[1] });
        else normalizedEntries.push(item);
    } else {
      for (const entry of group.entries ?? [])
        if (Array.isArray(entry))
          normalizedEntries.push({ item: entry[0], prob: entry[1] });
        else normalizedEntries.push(entry);
      for (const item of group.items ?? [])
        if (Array.isArray(item))
          normalizedEntries.push({ item: item[0], prob: item[1] });
        else if (typeof item === "string")
          normalizedEntries.push({ item, prob: 100 });
        else normalizedEntries.push(item);
      for (const g of group.groups ?? [])
        if (Array.isArray(g))
          normalizedEntries.push({ group: g[0], prob: g[1] });
        else if (typeof g === "string")
          normalizedEntries.push({ group: g, prob: 100 });
        else normalizedEntries.push(g);
    }

    function prod(
      p: { id: string; prob: number; count: [number, number] },
      prob: number,
      count: [number, number]
    ): { id: string; prob: number; count: [number, number] } {
      return {
        id: p.id,
        prob: p.prob * prob,
        count: [p.count[0] * count[0], p.count[1] * count[1]],
      };
    }

    function normalizeCount(entry: ItemGroupEntry): [number, number] {
      if (entry.count)
        if (typeof entry.count === "number") return [entry.count, entry.count];
        else return entry.count;
      else if (entry.charges)
        if (typeof entry.charges === "number")
          return [entry.charges, entry.charges];
        else return entry.charges;
      return [1, 1];
    }

    if (group.subtype === "collection") {
      for (const entry of normalizedEntries) {
        const { prob = 100 } = entry;
        const nProb = Math.min(prob, 100) / 100;
        const nCount = normalizeCount(entry);
        if ("item" in entry) {
          add({ id: entry.item, prob: nProb, count: nCount });
        } else if ("group" in entry) {
          add(
            ...this.flattenItemGroup(this.byId("item_group", entry.group)).map(
              (p) => prod(p, nProb, nCount)
            )
          );
        } else if ("collection" in entry) {
          add(
            ...this.flattenItemGroup({
              subtype: "collection",
              entries: entry.collection,
            }).map((p) => prod(p, nProb, nCount))
          );
        } else if ("distribution" in entry) {
          add(
            ...this.flattenItemGroup({
              subtype: "distribution",
              entries: entry.distribution,
            }).map((p) => prod(p, nProb, nCount))
          );
        } else {
          throw new Error(`unknown item group entry: ${JSON.stringify(entry)}`);
        }
      }
    } else {
      // distribution
      let totalProb = 0;
      for (const entry of normalizedEntries) totalProb += entry.prob ?? 100;
      for (const entry of normalizedEntries) {
        const nProb = (entry.prob ?? 100) / totalProb;
        const nCount = normalizeCount(entry);
        if ("item" in entry) {
          add({ id: entry.item, prob: nProb, count: nCount });
        } else if ("group" in entry) {
          add(
            ...this.flattenItemGroup(this.byId("item_group", entry.group)).map(
              (p) => prod(p, nProb, nCount)
            )
          );
        } else if ("collection" in entry) {
          add(
            ...this.flattenItemGroup({
              subtype: "collection",
              entries: entry.collection,
            }).map((p) => prod(p, nProb, nCount))
          );
        } else if ("distribution" in entry) {
          add(
            ...this.flattenItemGroup({
              subtype: "distribution",
              entries: entry.distribution,
            }).map((p) => prod(p, nProb, nCount))
          );
        } else {
          throw new Error(`unknown item group entry: ${JSON.stringify(entry)}`);
        }
      }
    }

    const r = [...retMap.entries()].map(([id, v]) => ({ id, ...v }));
    this._flattenItemGroupCache.set(group, r);
    return r;
  }

  _flatRequirementCache = new WeakMap<any, { id: string; count: number }[][]>();
  _flatRequirementCacheExpandSubs = new WeakMap<
    any,
    { id: string; count: number }[][]
  >();
  _flatRequirementCacheOnlyRecoverable = new WeakMap<
    any,
    { id: string; count: number }[][]
  >();
  _flatRequirementCacheForOpts(opts?: {
    expandSubstitutes?: boolean;
    onlyRecoverable?: boolean;
  }): WeakMap<any, { id: string; count: number }[][]> {
    if (opts?.expandSubstitutes && opts?.onlyRecoverable)
      throw new Error(
        "didn't expect to see expandSubstitutes && onlyRecoverable"
      );
    if (opts?.expandSubstitutes) return this._flatRequirementCacheExpandSubs;
    if (opts?.onlyRecoverable) return this._flatRequirementCacheOnlyRecoverable;
    return this._flatRequirementCache;
  }
  flattenRequirement<T>(
    required: (T | T[])[],
    get: (x: Requirement) => (T | T[])[],
    opts?: { expandSubstitutes?: boolean; onlyRecoverable?: boolean }
  ): { id: string; count: number }[][] {
    const cache = this._flatRequirementCacheForOpts(opts);
    if (cache.has(required)) return cache.get(required);
    const {
      expandSubstitutes: doExpandSubstitutes = false,
      onlyRecoverable = false,
    } = opts ?? {};
    const maybeExpandSubstitutes: (
      x: { id: string; count: number }[]
    ) => { id: string; count: number }[] = doExpandSubstitutes
      ? (x) => x.flatMap((y) => expandSubstitutes(this, y))
      : (x) => x;
    const ret = normalize(required)
      .map((x) =>
        maybeExpandSubstitutes(
          flattenChoices(this, x, (q) => normalize(get(q)), onlyRecoverable)
        )
      )
      .map((x) =>
        onlyRecoverable
          ? x.filter(
              (c) =>
                !(this.byId("item", c.id).flags ?? []).includes("UNRECOVERABLE")
            )
          : x
      )
      .filter((x) => x.length);
    cache.set(required, ret);
    return ret;
  }

  normalizeRequirements(
    requirement: RequirementData & { using?: Recipe["using"] }
  ) {
    const using =
      typeof requirement.using === "string"
        ? ([[requirement.using, 1]] as const)
        : requirement.using;

    const requirements = (using ?? [])
      .map(
        ([id, count]) =>
          [
            this.byId("requirement", id) as RequirementData,
            count as number,
          ] as const
      )
      .concat([[requirement, 1] as const])
      .filter((x) => x[0]); // NB. to cope with some data errors in obsolete parts

    const tools = requirements.flatMap(([req, count]) =>
      this.flattenRequirement(req.tools ?? [], (x) => x.tools, {
        expandSubstitutes: true,
      }).map((x) => x.map((x) => ({ ...x, count: x.count * count })))
    );
    const qualities = requirements.flatMap(([req, _count]) =>
      (req.qualities ?? []).map((x) => (Array.isArray(x) ? x : [x]))
    );
    const components = requirements.flatMap(([req, count]) =>
      this.flattenRequirement(req.components ?? [], (x) => x.components).map(
        (x) => x.map((x) => ({ ...x, count: x.count * count }))
      )
    );
    return { tools, qualities, components };
  }
}

function flattenChoices<T>(
  data: CddaData,
  choices: T[],
  get: (x: Requirement) => T[][],
  onlyRecoverable: boolean = false
): { id: string; count: number }[] {
  const flatChoices = [];
  for (const choice of choices) {
    if (Array.isArray(choice)) {
      const [id, count, ...rest] = choice;
      const isList = rest.includes("LIST");
      const noRecover = rest.includes("NO_RECOVER");
      if (noRecover && onlyRecoverable) continue;
      if (isList) {
        const otherRequirement = data.byId("requirement", id);
        if (otherRequirement.type !== "requirement") {
          console.error(
            `Expected a requirement, got ${otherRequirement.type} (id=${otherRequirement.id})`
          );
        }
        const otherRequirementTools = get(otherRequirement) ?? [];
        const otherRequirementChoices = otherRequirementTools[0]; // only take the first
        flatChoices.push(
          ...flattenChoices(
            data,
            otherRequirementChoices,
            get,
            onlyRecoverable
          ).map((x) => ({ ...x, count: x.count * count }))
        );
      } else {
        flatChoices.push({ id, count });
      }
    } else if (typeof choice === "string") {
      flatChoices.push({ id: choice, count: 1 });
    } else {
      throw new Error("unexpected choice type");
    }
  }
  return flatChoices;
}

function expandSubstitutes(
  data: CddaData,
  r: { id: string; count: number }
): { id: string; count: number }[] {
  const replacements = data.replacementTools(r.id);
  return [r, ...replacements.map((o) => ({ id: o, count: r.count }))];
}

export function normalize<T>(xs: (T | T[])[]): T[][] {
  return xs.map((x: T | T[]) => (Array.isArray(x) ? (x as T[]) : [x]));
}

export const countsByCharges = (item): boolean => {
  return item.type === "AMMO" || item.type === "COMESTIBLE" || item.stackable;
};

export function normalizeDamageInstance(
  damageInstance: DamageInstance
): DamageUnit[] {
  if (Array.isArray(damageInstance)) return damageInstance;
  else if ("values" in damageInstance) return damageInstance.values;
  else return [damageInstance];
}

const fetchJson = async (version: string) => {
  const res = await fetch(
    `https://raw.githubusercontent.com/nornagon/cdda-data/main/data/${version}/all.json`,
    {
      mode: "cors",
    }
  );
  if (!res.ok)
    throw new Error(`Error ${res.status} (${res.statusText}) fetching data`);
  const json = await res.json();
  return new CddaData(json.data, json.build_number, json.release);
};

let _hasSetVersion = false;
const { subscribe, set } = writable(null);
export const data = {
  subscribe,
  setVersion(version: string) {
    if (_hasSetVersion) throw new Error("can only set version once");
    _hasSetVersion = true;
    fetchJson(version).then(set);
  },
};
