import { writable } from "svelte/store";
import makeI18n, { Gettext } from "gettext.js";

import type {
  Translation,
  Requirement,
  ItemGroup,
  ItemGroupEntry,
  Recipe,
  Mapgen,
  PaletteData,
  DamageInstance,
  DamageUnit,
  RequirementData,
  SupportedTypesWithMapped,
  SupportedTypeMapped,
  Vehicle,
  Item,
  UseFunction,
  Bionic,
  QualityRequirement,
  InlineItemGroup,
  ItemGroupData,
  MapgenValue,
  ItemBasicInfo,
} from "./types";

const typeMappings = new Map<string, keyof SupportedTypesWithMapped>([
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
  ["city_building", "overmap_special"],
]);

export const mapType = (
  type: keyof SupportedTypesWithMapped
): keyof SupportedTypesWithMapped => typeMappings.get(type) ?? type;

export let i18n: Gettext = makeI18n();

const needsPlural = [
  "AMMO",
  "ARMOR",
  "BATTERY",
  "BIONIC_ITEM",
  "BOOK",
  "COMESTIBLE",
  "CONTAINER",
  "ENGINE",
  "GENERIC",
  "GUN",
  "GUNMOD",
  "MAGAZINE",
  "PET_ARMOR",
  "TOOL",
  "TOOLMOD",
  "TOOL_ARMOR",
  "WHEEL",
  "MONSTER",
  "vehicle_part",
  "json_flag",
];

function getMsgId(t: Translation) {
  return typeof t === "string" ? t : "str_sp" in t ? t.str_sp : t.str;
}

function getMsgIdPlural(t: Translation): string {
  return typeof t === "string"
    ? t + "s"
    : "str_sp" in t
    ? t.str_sp
    : "str_pl" in t && t.str_pl
    ? t.str_pl
    : t.str + "s";
}

export function translate(
  t: Translation,
  needsPlural: boolean,
  n: number,
  domain?: string
): string {
  const sg = getMsgId(t);
  const pl = needsPlural ? getMsgIdPlural(t) : "";
  return (
    i18n.dcnpgettext(domain, undefined, sg, pl, n) || (n === 1 ? sg : pl ?? sg)
  );
}

export const singular = (name: Translation): string =>
  translate(name, false, 1);

export const plural = (name: Translation, n: number = 2): string =>
  translate(name, true, n);

export const singularName = (obj: any, domain?: string): string =>
  pluralName(obj, 1, domain);

export const pluralName = (
  obj: any,
  n: number = 2,
  domain?: string
): string => {
  const name: Translation = obj?.name?.male ?? obj?.name;
  if (name == null) return obj?.id ?? obj?.abstract;
  const txed = Array.isArray(name)
    ? translate(name[0], needsPlural.includes(obj.type), n, domain)
    : translate(name, needsPlural.includes(obj.type), n, domain);
  if (txed.length === 0) return obj?.id ?? obj?.abstract;
  return txed;
};

export const byName = (a: any, b: any) =>
  singularName(a).localeCompare(singularName(b));

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
  throw new Error("unknown volume unit: " + string);
}

export function parseMass(string: string | number): number {
  if (typeof string === "undefined") return 0;
  if (typeof string === "number") return string;
  if (string.endsWith("mg")) return parseInt(string) / 1000;
  if (string.endsWith("kg")) return parseInt(string) * 1000;
  if (string.endsWith("g")) return parseInt(string);
  throw new Error("unknown mass unit: " + string);
}

export function parseDuration(duration: string | number): number {
  if (typeof duration === "number") return duration / 100;
  const turns = 1;
  const seconds = 1;
  const minutes = 60;
  const hours = minutes * 60;
  const days = hours * 24;
  const units: [string, number][] = [
    ["turns", 1 * turns],
    ["turn", 1 * turns],
    ["t", 1 * turns],
    ["seconds", 1 * seconds],
    ["second", 1 * seconds],
    ["s", 1 * seconds],
    ["minutes", 1 * minutes],
    ["minute", 1 * minutes],
    ["m", 1 * minutes],
    ["hours", 1 * hours],
    ["hour", 1 * hours],
    ["h", 1 * hours],
    ["days", 1 * days],
    ["day", 1 * days],
    ["d", 1 * days],
  ];
  const [num, unit] = duration.trim().split(/\s+/);
  const multiplier = units.find((x) => x[0] === unit);
  if (!multiplier) throw new Error(`bad duration: ${JSON.stringify(duration)}`);
  return Number(num) * multiplier[1];
}

export function asMinutes(duration: string | number) {
  const seconds = parseDuration(duration);
  return `${Math.round(seconds / 60)} m`;
}

export function asHumanReadableDuration(duration: string | number) {
  let seconds = parseDuration(duration);
  let minutes = (seconds / 60) | 0;
  seconds -= minutes * 60;
  let hours = (minutes / 60) | 0;
  minutes -= hours * 60;
  let days = (hours / 24) | 0;
  hours -= days * 24;
  return (
    [
      [days, "d"],
      [hours, "h"],
      [minutes, "m"],
      [seconds, "s"],
    ] as [number, string][]
  )
    .filter(([n]) => n)
    .map((x) => x.join(""))
    .join(" ");
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
  _toolReplacements: Map<string, string[]> | null = null;
  _craftingPseudoItems: Map<string, string> = new Map();
  _migrations: Map<string, string> = new Map();
  _flattenCache: Map<any, any> = new Map();
  _nestedMapgensById: Map<string, Mapgen[]> = new Map();

  release: any;
  build_number: string | undefined;

  constructor(raw: any[], build_number?: string, release?: any) {
    this.release = release;
    this.build_number = build_number;
    // For some reason O—G has the string "mapgen" as one of its objects.
    this._raw = raw.filter((x) => typeof x === "object");
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
      this._byType.get(mappedType)!.push(obj);
      if (Object.hasOwnProperty.call(obj, "id")) {
        if (!this._byTypeById.has(mappedType))
          this._byTypeById.set(mappedType, new Map());
        if (typeof obj.id === "string")
          this._byTypeById.get(mappedType)!.set(obj.id, obj);
        else if (Array.isArray(obj.id))
          for (const id of obj.id)
            this._byTypeById.get(mappedType)!.set(id, obj);
      }
      // recipes are id'd by their result
      if (
        (mappedType === "recipe" || mappedType === "uncraft") &&
        Object.hasOwnProperty.call(obj, "result")
      ) {
        if (!this._byTypeById.has(mappedType))
          this._byTypeById.set(mappedType, new Map());
        const id = obj.result + (obj.id_suffix ? "_" + obj.id_suffix : "");
        this._byTypeById.get(mappedType)!.set(id, obj);
      }
      if (
        mappedType === "monstergroup" &&
        Object.hasOwnProperty.call(obj, "name")
      ) {
        if (!this._byTypeById.has(mappedType))
          this._byTypeById.set(mappedType, new Map());
        const id = obj.name;
        this._byTypeById.get(mappedType)!.set(id, obj);
      }
      if (Object.hasOwnProperty.call(obj, "abstract")) {
        if (!this._abstractsByType.has(mappedType))
          this._abstractsByType.set(mappedType, new Map());
        this._abstractsByType.get(mappedType)!.set(obj.abstract, obj);
      }

      if (Object.hasOwnProperty.call(obj, "crafting_pseudo_item")) {
        this._craftingPseudoItems.set(obj.crafting_pseudo_item, obj.id);
      }

      if (Object.hasOwnProperty.call(obj, "nested_mapgen_id")) {
        if (!this._nestedMapgensById.has(obj.nested_mapgen_id))
          this._nestedMapgensById.set(obj.nested_mapgen_id, []);
        this._nestedMapgensById.get(obj.nested_mapgen_id)!.push(obj);
      }
    }
    this._byTypeById
      .get("item_group")
      ?.set("EMPTY_GROUP", { id: "EMPTY_GROUP", entries: [] });
  }

  byIdMaybe<TypeName extends keyof SupportedTypesWithMapped>(
    type: TypeName,
    id: string
  ): (SupportedTypesWithMapped[TypeName] & { __filename: string }) | undefined {
    if (typeof id !== "string") throw new Error("Requested non-string id");
    const byId = this._byTypeById.get(type);
    if (type === "item" && !byId?.has(id) && this._migrations.has(id))
      return this.byIdMaybe(type, this._migrations.get(id)!);
    const obj = byId?.get(id);
    if (obj) return this._flatten(obj);
  }

  byId<TypeName extends keyof SupportedTypesWithMapped>(
    type: TypeName,
    id: string
  ): SupportedTypesWithMapped[TypeName] & { __filename: string } {
    const ret = this.byIdMaybe(type, id);
    if (!ret)
      throw new Error('unknown object "' + id + '" of type "' + type + '"');
    return ret;
  }

  byType<TypeName extends keyof SupportedTypesWithMapped>(
    type: TypeName
  ): SupportedTypesWithMapped[TypeName][] {
    return this._byType.get(type)?.map((x) => this._flatten(x)) ?? [];
  }

  abstractById<TypeName extends keyof SupportedTypesWithMapped>(
    type: TypeName,
    id: string
  ): object | undefined /* abstracts don't have ids, for instance */ {
    if (typeof id !== "string") throw new Error("Requested non-string id");
    const obj = this._abstractsByType.get(type)?.get(id);
    if (obj) return this._flatten(obj);
  }

  replacementTools(type: string): string[] {
    if (!this._toolReplacements) {
      this._toolReplacements = new Map();
      for (const obj of this.byType("item")) {
        if (
          obj.type === "TOOL" &&
          Object.hasOwnProperty.call(obj, "sub") &&
          obj.sub
        ) {
          if (!this._toolReplacements.has(obj.sub))
            this._toolReplacements.set(obj.sub, []);
          this._toolReplacements.get(obj.sub)!.push(obj.id);
        }
      }
    }
    return this._toolReplacements.get(type) ?? [];
  }

  craftingPseudoItem(id: string): string | undefined {
    return this._craftingPseudoItems.get(id);
  }

  nestedMapgensById(id: string): Mapgen[] | undefined {
    return this._nestedMapgensById.get(id);
  }

  all(): SupportedTypeMapped[] {
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
    if (parent === obj) {
      // Working around bad data upstream, see: https://github.com/CleverRaven/Cataclysm-DDA/pull/53930
      console.warn("Object copied from itself:", obj);
      this._flattenCache.set(obj, obj);
      return obj;
    }
    if (!parent) {
      this._flattenCache.set(obj, obj);
      return obj;
    }
    const { abstract, ...parentProps } = this._flatten(parent);
    const ret = { ...parentProps, ...obj };
    if (parentProps.vitamins && obj.vitamins) {
      ret.vitamins = [
        ...parentProps.vitamins.filter(
          (x: any) => !obj.vitamins.some((y: any) => y[0] === x[0])
        ),
        ...obj.vitamins,
      ];
    }
    if (obj.type === "vehicle" && parentProps.parts && obj.parts) {
      ret.parts = [...parentProps.parts, ...obj.parts];
    }
    for (const k of Object.keys(ret.relative ?? {})) {
      if (typeof ret.relative[k] === "number") {
        if (k === "melee_damage") {
          const di = normalizeDamageInstance(
            JSON.parse(JSON.stringify(ret.melee_damage))
          );
          for (const du of di) du.amount = (du.amount ?? 0) + ret.relative[k];
          ret.melee_damage = di;
        } else {
          ret[k] = (ret[k] ?? 0) + ret.relative[k];
        }
      } else if ((k === "damage" || k === "ranged_damage") && ret[k]) {
        ret[k] = JSON.parse(JSON.stringify(ret[k]));
        const relativeDamage = normalizeDamageInstance(ret.relative[k]);
        for (const rdu of relativeDamage) {
          const modified: DamageUnit = Array.isArray(ret[k])
            ? ret[k].find(
                (du: DamageUnit) => du.damage_type === rdu.damage_type
              )
            : ret[k].damage_type === rdu.damage_type
            ? ret[k]
            : null;
          if (modified) {
            modified.amount = (modified.amount ?? 0) + (rdu.amount ?? 0);
            modified.armor_penetration =
              (modified.armor_penetration ?? 0) + (rdu.armor_penetration ?? 0);
            modified.armor_multiplier =
              (modified.armor_multiplier ?? 0) + (rdu.armor_multiplier ?? 0);
            modified.damage_multiplier =
              (modified.damage_multiplier ?? 0) + (rdu.damage_multiplier ?? 0);
            modified.constant_armor_multiplier =
              (modified.constant_armor_multiplier ?? 0) +
              (rdu.constant_armor_multiplier ?? 0);
            modified.constant_damage_multiplier =
              (modified.constant_damage_multiplier ?? 0) +
              (rdu.constant_damage_multiplier ?? 0);
          }
        }
      }
      // TODO: vitamins, mass, volume, time
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
      } else if (k === "damage" && ret[k]) {
        ret.damage = JSON.parse(JSON.stringify(ret.damage));
        const proportionalDamage = normalizeDamageInstance(
          ret.proportional.damage
        );
        for (const pdu of proportionalDamage) {
          const modified: DamageUnit = Array.isArray(ret.damage)
            ? ret.damage.find(
                (du: DamageUnit) => du.damage_type === pdu.damage_type
              )
            : ret.damage.damage_type === pdu.damage_type
            ? ret.damage
            : null;
          if (modified) {
            modified.amount = (modified.amount ?? 0) * (pdu.amount ?? 1);
            modified.armor_penetration =
              (modified.armor_penetration ?? 0) * (pdu.armor_penetration ?? 1);
            modified.armor_multiplier =
              (modified.armor_multiplier ?? 0) * (pdu.armor_multiplier ?? 1);
            modified.damage_multiplier =
              (modified.damage_multiplier ?? 0) * (pdu.damage_multiplier ?? 1);
            modified.constant_armor_multiplier =
              (modified.constant_armor_multiplier ?? 0) *
              (pdu.constant_armor_multiplier ?? 1);
            modified.constant_damage_multiplier =
              (modified.constant_damage_multiplier ?? 0) *
              (pdu.constant_damage_multiplier ?? 1);
          }
        }
      }
      // TODO: mass, volume, time (need to check the base value's type)
    }
    delete ret.proportional;
    for (const k of Object.keys(ret.extend ?? {})) {
      if (Array.isArray(ret.extend[k])) {
        if (k === "flags")
          // Unique
          ret[k] = (ret[k] ?? []).concat(
            ret.extend[k].filter((x: any) => !ret[k]?.includes(x))
          );
        else ret[k] = (ret[k] ?? []).concat(ret.extend[k]);
      }
    }
    delete ret.extend;
    for (const k of Object.keys(ret.delete ?? {})) {
      if (Array.isArray(ret.delete[k])) {
        // Some 'delete' entries delete qualities, which are arrays. As a rough
        // heuristic, compare recursively.
        const isEqual = (x: any, y: any): boolean =>
          x === y ||
          (Array.isArray(x) &&
            Array.isArray(y) &&
            x.length === y.length &&
            x.every((j, i) => isEqual(j, y[i])));
        ret[k] = (ret[k] ?? []).filter(
          (x: any) => !ret.delete[k].some((y: any) => isEqual(y, x))
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
      return this._cachedDeathDrops.get(mon_id)!;
    const mon = this.byId("monster", mon_id);
    const ret = mon.death_drops
      ? this.flattenItemGroup(
          this.normalizeItemGroup(mon.death_drops, "distribution") ?? {
            subtype: "collection",
            entries: [],
          }
        )
      : [];
    ret.sort((a, b) => b.prob - a.prob);
    this._cachedDeathDrops.set(mon_id, ret);
    return ret;
  }

  _cachedUncraftRecipes: Map<string, Recipe> | null = null;
  uncraftRecipe(item_id: string): Recipe | undefined {
    if (!this._cachedUncraftRecipes) {
      this._cachedUncraftRecipes = new Map();
      for (const recipe of this.byType("recipe"))
        if (recipe.result && recipe.reversible)
          this._cachedUncraftRecipes.set(recipe.result, recipe);
      for (const recipe of this.byType("uncraft"))
        if (recipe.result)
          this._cachedUncraftRecipes.set(recipe.result, recipe);
    }
    return this._cachedUncraftRecipes.get(item_id);
  }

  _cachedMapgenSpawnItems = new Map<Mapgen, string[]>();
  mapgenSpawnItems(mapgen: Mapgen): string[] {
    if (this._cachedMapgenSpawnItems.has(mapgen))
      return this._cachedMapgenSpawnItems.get(mapgen)!;
    const palette = new Map<string, Set<string>>();
    const add = (c: string, item_id: MapgenValue) => {
      if (typeof item_id === "string") {
        if (!palette.has(c)) palette.set(c, new Set());
        palette.get(c)!.add(item_id);
      } else {
        // TODO: handle distribution, param, switch/cases
      }
    };

    const addGroup = (c: string, v: InlineItemGroup) => {
      // TODO dedupe?
      const group =
        typeof v === "string"
          ? this.convertTopLevelItemGroup(this.byId("item_group", v))
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

    for (const v of mapgen.object.place_item ?? [])
      if (typeof v.item === "string") ret.add(v.item);

    for (const v of mapgen.object.place_items ?? []) {
      const group =
        typeof v.item === "string"
          ? this.convertTopLevelItemGroup(this.byId("item_group", v.item))
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
        for (const { id } of this.flattenTopLevelItemGroup(
          this.byId("item_group", v.group)
        ))
          ret.add(id);
    }

    for (const v of mapgen.object.add ?? [])
      if (typeof v.item === "string") ret.add(v.item);

    const r = [...ret];
    this._cachedMapgenSpawnItems.set(mapgen, r);
    return r;
  }

  // Top-level item groups can have the "old" subtype (which is the default if
  // no other subtype is specified).
  _convertedTopLevelItemGroups = new Map<ItemGroup, ItemGroupData>();
  convertTopLevelItemGroup(group: ItemGroup): ItemGroupData {
    if (group.subtype === "distribution" || group.subtype === "collection") {
      return group;
    } else if (
      !("subtype" in group) ||
      !group.subtype ||
      group.subtype === "old"
    ) {
      if (this._convertedTopLevelItemGroups.has(group))
        return this._convertedTopLevelItemGroups.get(group)!;
      // Convert old-style item groups to new-style
      const normalizedEntries: ItemGroupEntry[] = [];
      for (const item of group.items ?? [])
        if (Array.isArray(item))
          normalizedEntries.push({ item: item[0], prob: item[1] });
        else normalizedEntries.push(item);
      const ret: ItemGroupData = {
        subtype: "distribution",
        entries: normalizedEntries,
      };
      this._convertedTopLevelItemGroups.set(group, ret);
      return ret;
    } else throw new Error("unknown item group subtype: " + group.subtype);
  }

  flattenTopLevelItemGroup(group: ItemGroup) {
    return this.flattenItemGroup(this.convertTopLevelItemGroup(group));
  }

  // This is a WeakMap because flattenItemGroup is sometimes called with temporary objects
  _flattenItemGroupCache = new WeakMap<
    ItemGroupData,
    { id: string; prob: number; count: [number, number] }[]
  >();
  flattenItemGroup(
    group: ItemGroupData
  ): { id: string; prob: number; count: [number, number] }[] {
    if (this._flattenItemGroupCache.has(group))
      return this._flattenItemGroupCache.get(group)!;
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

    if ("container-item" in group && group["container-item"])
      add({ id: group["container-item"], prob: 1, count: [1, 1] });

    let normalizedEntries: ItemGroupEntry[] = [];
    for (const entry of "entries" in group && group.entries
      ? group.entries
      : [])
      if (Array.isArray(entry))
        normalizedEntries.push({ item: entry[0], prob: entry[1] });
      else normalizedEntries.push(entry);
    for (const item of group.items ?? [])
      if (Array.isArray(item))
        normalizedEntries.push({ item: item[0], prob: item[1] });
      else if (typeof item === "string")
        normalizedEntries.push({ item, prob: 100 });
      else normalizedEntries.push(item);
    for (const g of "groups" in group && group.groups ? group.groups : [])
      if (Array.isArray(g)) normalizedEntries.push({ group: g[0], prob: g[1] });
      else if (typeof g === "string")
        normalizedEntries.push({ group: g, prob: 100 });
      else normalizedEntries.push(g);
    normalizedEntries = normalizedEntries.filter(
      (e) => !("event" in e) || !e.event
    );

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
        for (const subrefItem of [
          "container-item",
          "ammo-item",
          "contents-item",
        ] as const) {
          const ids = entry[subrefItem];
          if (ids)
            for (const id of [ids].flat())
              add({ id, prob: nProb, count: [1, 1] });
        }
        for (const subrefGroup of [
          "container-group",
          "ammo-group",
          "contents-group",
        ] as const) {
          const ids = entry[subrefGroup];
          if (ids)
            for (const id of [ids].flat())
              add(
                ...this.flattenTopLevelItemGroup(
                  this.byId("item_group", id)
                ).map((p) => prod(p, nProb, nCount))
              );
        }
        if ("item" in entry) {
          add({ id: entry.item, prob: nProb, count: nCount });
          const item = this.byIdMaybe("item", entry.item);
          if (item && item.container)
            add({ id: item.container, prob: nProb, count: nCount });
        } else if ("group" in entry) {
          add(
            ...this.flattenTopLevelItemGroup(
              this.byId("item_group", entry.group)
            ).map((p) => prod(p, nProb, nCount))
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
        for (const subrefItem of [
          "container-item",
          "ammo-item",
          "contents-item",
        ] as const) {
          const ids = entry[subrefItem];
          if (ids)
            for (const id of [ids].flat())
              add({ id, prob: nProb, count: [1, 1] });
        }
        for (const subrefGroup of [
          "container-group",
          "ammo-group",
          "contents-group",
        ] as const) {
          const ids = entry[subrefGroup];
          if (ids)
            for (const id of [ids].flat())
              add(
                ...this.flattenTopLevelItemGroup(
                  this.byId("item_group", id)
                ).map((p) => prod(p, nProb, nCount))
              );
        }
        if ("item" in entry) {
          add({ id: entry.item, prob: nProb, count: nCount });
        } else if ("group" in entry) {
          add(
            ...this.flattenTopLevelItemGroup(
              this.byId("item_group", entry.group)
            ).map((p) => prod(p, nProb, nCount))
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
    get: (x: Requirement) => (T | T[])[] | undefined,
    opts?: { expandSubstitutes?: boolean; onlyRecoverable?: boolean }
  ): { id: string; count: number }[][] {
    const cache = this._flatRequirementCacheForOpts(opts);
    if (cache.has(required)) return cache.get(required)!;
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
          flattenChoices(
            this,
            x,
            (q) => normalize(get(q) ?? []),
            onlyRecoverable
          )
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

  _normalizeRequirementsCache = new Map<
    RequirementData & { using?: Recipe["using"] },
    ReturnType<typeof this.normalizeRequirementsForDisassembly>
  >();
  normalizeRequirementsForDisassembly(
    requirement: RequirementData & { using?: Recipe["using"] }
  ): {
    tools: [string, number][][];
    qualities: QualityRequirement[][];
    components: [string, number][][];
  } {
    if (this._normalizeRequirementsCache.has(requirement))
      return this._normalizeRequirementsCache.get(requirement)!;
    const { tools, qualities, components } = this.normalizeRequirements(
      requirement,
      { onlyRecoverable: true }
    );
    let removeFire = false;
    const newQualities: typeof qualities = [];
    for (const toolOpts of tools) {
      for (const [toolId, _count] of toolOpts) {
        if (
          [
            "welder",
            "welder_crude",
            "oxy_torch",
            "forge",
            "char_forge",
          ].includes(toolId)
        ) {
          toolOpts.length = 0;
          newQualities.push([{ id: "SAW_M_FINE", level: 1 }]);
          break;
        }
        if (["sewing_kit", "mold_plastic"].includes(toolId)) {
          toolOpts.length = 0;
          newQualities.push([{ id: "CUT", level: 1 }]);
          break;
        }
        if (toolId === "crucible") {
          toolOpts.length = 0;
          break;
        }
        if (toolId === "press") {
          toolOpts.length = 0;
          removeFire = true;
          newQualities.push([{ id: "PULL", level: 1 }]);
          break;
        }
        if (toolId === "fire" && removeFire) {
          toolOpts.length = 0;
          break;
        }
      }
    }
    const filteredTools = tools.filter((t) => t.length);

    for (const qualityOpts of qualities) {
      for (const quality of qualityOpts) {
        if (quality.id === "SEW") {
          newQualities.push([{ id: "CUT", level: quality.level }]);
          qualityOpts.length = 0;
          break;
        }
        if (quality.id === "GLARE" || quality.id === "KNIT") {
          qualityOpts.length = 0;
          break;
        }
      }
    }
    const filteredQualities = qualities.filter((t) => t.length);

    const finalQualities = filteredQualities.concat(
      newQualities.filter(
        (q) => !filteredQualities.some((q2) => q2[0].id === q[0].id)
      )
    );

    const filteredComponents = components
      .map((c) =>
        c.filter(
          (c) => !this.byId("item", c[0])?.flags?.includes("UNRECOVERABLE")
        )
      )
      .filter((c) => c.length);

    const ret = {
      tools: filteredTools,
      qualities: finalQualities,
      components: filteredComponents,
    };

    this._normalizeRequirementsCache.set(requirement, ret);

    return ret;
  }

  normalizeRequirementUsing(
    requirements: (readonly [RequirementData, number])[],
    opts?: { onlyRecoverable?: boolean }
  ): {
    components: [string, number][][];
    qualities: QualityRequirement[][];
    tools: [string, number][][];
  } {
    const tools = requirements.flatMap(([req, count]) =>
      this.flattenRequirement(req.tools ?? [], (x) => x.tools, {
        expandSubstitutes: true,
      }).map((x) => x.map((x) => [x.id, x.count * count] as [string, number]))
    );
    const qualities = requirements.flatMap(([req, _count]) =>
      (req.qualities ?? []).map((x) => (Array.isArray(x) ? x : [x]))
    );
    const components = requirements.flatMap(([req, count]) =>
      this.flattenRequirement(
        req.components ?? [],
        (x) => x.components,
        opts
      ).map((x) => x.map((x) => [x.id, x.count * count] as [string, number]))
    );
    return { tools, qualities, components };
  }

  normalizeRequirements(
    requirement: RequirementData & { using?: Recipe["using"] },
    opts?: { onlyRecoverable?: boolean }
  ) {
    const using =
      typeof requirement.using === "string"
        ? ([[requirement.using, 1]] as const)
        : requirement.using;

    const requirements = (using ?? [])
      .map(
        ([id, count]) =>
          [
            this.byIdMaybe("requirement", id) as RequirementData,
            count as number,
          ] as const
      )
      .filter((x) => x[0])
      .concat([[requirement, 1] as const])
      .filter((x) => x[0]); // NB. to cope with some data errors in obsolete parts

    return this.normalizeRequirementUsing(requirements, opts);
  }

  _itemComponentCache: {
    byTool: Map<string, Set<string>>;
    byComponent: Map<string, Set<string>>;
  } | null = null;
  getItemComponents() {
    if (this._itemComponentCache) return this._itemComponentCache;
    const itemsByTool = new Map<string, Set<string>>();
    const itemsByComponent = new Map<string, Set<string>>();

    this.byType("recipe").forEach((recipe) => {
      if (!recipe.result || !this.byIdMaybe("item", recipe.result))
        return false;
      const using =
        typeof recipe.using === "string"
          ? ([[recipe.using, 1]] as const)
          : recipe.using;

      const requirements = (using ?? [])
        .map(
          ([id, count]) =>
            [
              this.byId("requirement", id) as RequirementData,
              count as number,
            ] as const
        )
        .concat([[recipe, 1] as const]);
      const tools = requirements.flatMap(([req]) =>
        this.flattenRequirement(req.tools ?? [], (x) => x.tools)
      );
      for (const toolOptions of tools)
        for (const tool of toolOptions) {
          if (!itemsByTool.has(tool.id)) itemsByTool.set(tool.id, new Set());
          itemsByTool.get(tool.id)!.add(recipe.result);
        }
      const components = requirements.flatMap(([req]) =>
        this.flattenRequirement(req.components ?? [], (x) => x.components ?? [])
      );
      for (const componentOptions of components)
        for (const component of componentOptions) {
          if (!itemsByComponent.has(component.id))
            itemsByComponent.set(component.id, new Set());
          itemsByComponent.get(component.id)!.add(recipe.result);
        }
    });
    this._itemComponentCache = {
      byTool: itemsByTool,
      byComponent: itemsByComponent,
    };
    return this._itemComponentCache;
  }

  _constructionComponentCache: {
    byTool: Map<string, Set<string>>;
    byComponent: Map<string, Set<string>>;
  } | null = null;
  getConstructionComponents() {
    if (this._constructionComponentCache)
      return this._constructionComponentCache;
    const constructionsByComponent = new Map<string, Set<string>>();
    const constructionsByTool = new Map<string, Set<string>>();
    for (const c of this.byType("construction")) {
      const { components, tools } = this.normalizeRequirements(c);
      for (const componentOptions of components)
        for (const [component] of componentOptions) {
          if (!constructionsByComponent.has(component))
            constructionsByComponent.set(component, new Set());
          constructionsByComponent.get(component)!.add(c.id);
        }
      for (const toolOptions of tools)
        for (const [tool] of toolOptions) {
          if (!constructionsByTool.has(tool))
            constructionsByTool.set(tool, new Set());
          constructionsByTool.get(tool)!.add(c.id);
        }
    }
    this._constructionComponentCache = {
      byTool: constructionsByTool,
      byComponent: constructionsByComponent,
    };
    return this._constructionComponentCache;
  }

  normalizeItemGroup(
    g: undefined | string | ItemGroupData | ItemGroupEntry[],
    subtype: "collection" | "distribution"
  ): ItemGroupData {
    if (g) {
      if (typeof g === "string") {
        return this.convertTopLevelItemGroup(this.byId("item_group", g));
      } else if (Array.isArray(g)) {
        return { subtype, entries: g };
      } else {
        return { subtype, ...g };
      }
    }
    return { subtype, entries: [] };
  }

  itemForBionic(bionic: Bionic): Item | undefined {
    return (
      this.byType("item").find(
        (i) => "bionic_id" in i && i.id && i.bionic_id === bionic.id
      ) ?? this.byIdMaybe("item", bionic.id)
    );
  }

  #compatibleItemsIdIndex = new ReverseIndex(this, "item", (item) => {
    const ret: string[] = [];
    for (const pd of item.pocket_data ?? []) {
      if (pd.pocket_type === "MAGAZINE" || pd.pocket_type === "MAGAZINE_WELL") {
        ret.push(...(pd.item_restriction ?? []));
        ret.push(...(pd.allowed_speedloaders ?? []));
      }
    }
    return ret;
  });
  #compatibleItemsFlagIndex = new ReverseIndex(this, "item", (item) => {
    const ret: string[] = [];
    for (const pd of item.pocket_data ?? []) {
      if (pd.pocket_type === "MAGAZINE" || pd.pocket_type === "MAGAZINE_WELL") {
        ret.push(...(pd.flag_restriction ?? []));
      }
    }
    return ret;
  });
  compatibleItems(item: ItemBasicInfo): Item[] {
    const byId = this.#compatibleItemsIdIndex.lookup(item.id);
    const byFlag = item.flags
      ? [item.flags]
          .flat()
          .flatMap((f) => this.#compatibleItemsFlagIndex.lookup(f))
      : [];

    return [...new Set([...byId, ...byFlag])];
  }

  #grownFromIndex = new ReverseIndex(this, "item", (item) => {
    if (!item.id || !item.seed_data) return [];
    const result: string[] = [];
    if (item.seed_data.fruit) result.push(item.seed_data.fruit);
    if (item.seed_data.byproducts) result.push(...item.seed_data.byproducts);
    return result;
  });
  grownFrom(item_id: string) {
    return this.#grownFromIndex.lookup(item_id);
  }

  #brewedFromIndex = new ReverseIndex(this, "item", (x) => {
    function normalize(
      results: undefined | string[] | Record<string, number>
    ): string[] {
      if (!results) return [];
      if (Array.isArray(results)) return results;
      return Object.keys(results);
    }
    return x.id ? normalize(x.brewable?.results) : [];
  });
  brewedFrom(item_id: string) {
    return this.#brewedFromIndex.lookup(item_id);
  }

  #transformedFromIndex = new ReverseIndex(this, "item", (x) =>
    normalizeUseAction(x.use_action).flatMap((a) =>
      "target" in a ? [a.target] : []
    )
  );
  transformedFrom(item_id: string) {
    return this.#transformedFromIndex.lookup(item_id);
  }

  #bashFromFurnitureIndex = new ReverseIndex(this, "furniture", (f) => {
    return f.bash?.items
      ? this.flattenItemGroup({
          subtype: "collection",
          entries:
            typeof f.bash.items === "string"
              ? [{ group: f.bash.items }]
              : f.bash.items,
        }).map((x) => x.id)
      : [];
  });
  bashFromFurniture(item_id: string) {
    return this.#bashFromFurnitureIndex.lookup(item_id).sort(byName);
  }

  #bashFromTerrainIndex = new ReverseIndex(this, "terrain", (f) => {
    return f.bash?.items
      ? this.flattenItemGroup({
          subtype: "collection",
          entries:
            typeof f.bash.items === "string"
              ? [{ group: f.bash.items }]
              : f.bash.items,
        }).map((x) => x.id)
      : [];
  });
  bashFromTerrain(item_id: string) {
    return this.#bashFromTerrainIndex.lookup(item_id).sort(byName);
  }

  #bashFromVehiclePartIndex = new ReverseIndex(this, "vehicle_part", (vp) => {
    if (!vp.id) return [];
    const breaksIntoGroup: ItemGroupData | null =
      typeof vp.breaks_into === "string"
        ? this.convertTopLevelItemGroup(this.byId("item_group", vp.breaks_into))
        : Array.isArray(vp.breaks_into)
        ? { subtype: "collection", entries: vp.breaks_into }
        : vp.breaks_into
        ? vp.breaks_into
        : null;
    const breaksIntoGroupFlattened =
      breaksIntoGroup && this.flattenItemGroup(breaksIntoGroup);
    return breaksIntoGroupFlattened?.map((x) => x.id) ?? [];
  });
  bashFromVehiclePart(item_id: string) {
    return this.#bashFromVehiclePartIndex.lookup(item_id);
  }

  #deconstructFromFurnitureIndex = new ReverseIndex(this, "furniture", (f) => {
    const deconstruct = f.deconstruct?.items
      ? this.flattenItemGroup({
          subtype: "collection",
          entries:
            typeof f.deconstruct.items === "string"
              ? [{ group: f.deconstruct.items }]
              : f.deconstruct.items,
        })
      : [];

    return deconstruct.map((x) => x.id);
  });
  #deconstructFromTerrainIndex = new ReverseIndex(this, "terrain", (f) => {
    const deconstruct = f.deconstruct?.items
      ? this.flattenItemGroup({
          subtype: "collection",
          entries:
            typeof f.deconstruct.items === "string"
              ? [{ group: f.deconstruct.items }]
              : f.deconstruct.items,
        })
      : [];

    return deconstruct.map((x) => x.id);
  });
  deconstructFrom(item_id: string) {
    return [
      ...this.#deconstructFromFurnitureIndex.lookup(item_id).sort(byName),
      ...this.#deconstructFromTerrainIndex.lookup(item_id).sort(byName),
    ];
  }

  allDamageTypes(
    sort_key:
      | "protection_info"
      | "bionic_info"
      | "pet_prot_info"
      | "melee_combat_info"
      | "ablative_info" = "protection_info"
  ) {
    return this.byType("damage_info_order")
      .sort((a, b) => (a[sort_key]?.order ?? -1) - (b[sort_key]?.order ?? -1))
      .map((x) => this.byId("damage_type", x.id));
  }
}
class ReverseIndex<T extends keyof SupportedTypesWithMapped> {
  constructor(
    private data: CddaData,
    private objType: T,
    private fn: (x: SupportedTypesWithMapped[T]) => string[]
  ) {}

  #_index: Map<string, SupportedTypesWithMapped[T][]> | null = null;
  get #index() {
    if (!this.#_index) {
      this.#_index = new Map();
      for (const item of this.data.byType(this.objType)) {
        for (const id of this.fn(item)) {
          if (!this.#index.has(id)) this.#index.set(id, []);
          this.#index.get(id)!.push(item);
        }
      }
    }
    return this.#_index;
  }

  lookup(id: string) {
    return this.#index.get(id) ?? [];
  }
}

function flattenChoices<T>(
  data: CddaData,
  choices: T[],
  get: (x: Requirement) => T[][],
  onlyRecoverable: boolean = false
): { id: string; count: number }[] {
  const flatChoices: { id: string; count: number }[] = [];
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
        if (otherRequirementTools.length) {
          const otherRequirementChoices = otherRequirementTools[0]; // only take the first
          flatChoices.push(
            ...flattenChoices(
              data,
              otherRequirementChoices,
              get,
              onlyRecoverable
            ).map((x) => ({ ...x, count: x.count * count }))
          );
        }
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

export function normalize<T>(xs: (T | T[])[] | undefined): T[][] {
  return xs?.map((x: T | T[]) => (Array.isArray(x) ? (x as T[]) : [x])) ?? [];
}

export const countsByCharges = (item: any): boolean => {
  return item.type === "AMMO" || item.type === "COMESTIBLE" || item.stackable;
};

export function normalizeDamageInstance(
  damageInstance: DamageInstance
): DamageUnit[] {
  if (Array.isArray(damageInstance)) return damageInstance;
  else if ("values" in damageInstance) return damageInstance.values;
  else return [damageInstance];
}

const vpartVariants = [
  "cover_left",
  "cover_right",
  "hatch_wheel_left",
  "hatch_wheel_right",
  "wheel_left",
  "wheel_right",
  "cross_unconnected",
  "cross",
  "horizontal_front_edge",
  "horizontal_front",
  "horizontal_rear_edge",
  "horizontal_rear",
  "horizontal_2_front",
  "horizontal_2_rear",
  "ne_edge",
  "nw_edge",
  "se_edge",
  "sw_edge",
  "vertical_right",
  "vertical_left",
  "vertical_2_right",
  "vertical_2_left",
  "vertical_T_right",
  "vertical_T_left",
  "front_right",
  "front_left",
  "rear_right",
  "rear_left",
  // these have to be last to avoid false positives
  "cover",
  "vertical",
  "horizontal",
  "vertical_2",
  "horizontal_2",
  "ne",
  "nw",
  "se",
  "sw",
  "front",
  "rear",
  "left",
  "right",
];

export const getVehiclePartIdAndVariant = (
  data: CddaData,
  compositePartId: string
): [string, string] => {
  if (data.byIdMaybe("vehicle_part", compositePartId))
    return [compositePartId, ""];
  const m = /^(.+)#(.+?)$/.exec(compositePartId);
  if (m) return [m[1], m[2]];

  // TODO: only check this for releases older than https://github.com/CleverRaven/Cataclysm-DDA/pull/65871
  for (const variant of vpartVariants) {
    if (compositePartId.endsWith("_" + variant)) {
      return [
        compositePartId.slice(0, compositePartId.length - variant.length - 1),
        variant,
      ];
    }
  }
  return [compositePartId, ""];
};

const _itemGroupFromVehicleCache = new Map<Vehicle, ItemGroupData>();
export function itemGroupFromVehicle(vehicle: Vehicle): ItemGroupData {
  if (_itemGroupFromVehicleCache.has(vehicle))
    return _itemGroupFromVehicleCache.get(vehicle)!;
  const ret: ItemGroupData = {
    subtype: "collection",
    entries: (vehicle.items ?? []).map((it) => {
      if (it.items) {
        return {
          collection: (typeof it.items === "string"
            ? [it.items]
            : it.items
          ).map((it_id) => ({ item: it_id })),
          prob: it.chance,
        };
      } else if (it.item_groups) {
        return {
          collection: (typeof it.item_groups === "string"
            ? [it.item_groups]
            : it.item_groups
          ).map((ig_id) => ({ group: ig_id })),
          prob: it.chance,
        };
      } else {
        return { distribution: [] };
      }
    }),
  };

  _itemGroupFromVehicleCache.set(vehicle, ret);
  return ret;
}

export function normalizeUseAction(action: Item["use_action"]): UseFunction[] {
  if (typeof action === "string")
    return [{ type: "__item_action__", id: action }];
  else if (Array.isArray(action)) {
    return action.map((s) => {
      if (typeof s === "string") return { type: "__item_action__", id: s };
      else if (Array.isArray(s)) {
        return { type: "__item_action__", id: s[0] };
      } else {
        return s;
      }
    });
  } else {
    return action ? [action] : [];
  }
}

const fetchJsonWithProgress = (
  url: string,
  progress: (receivedBytes: number, totalBytes: number) => void
): Promise<any> => {
  // GoogleBot has a 15MB limit on the size of the response, so we need to
  // serve it double-gzipped JSON.
  if (/latest/.test(url) && /googlebot/i.test(navigator.userAgent))
    return fetchGzippedJsonForGoogleBot(url);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = (e) => {
      if (xhr.response) resolve(xhr.response);
      else reject(`Unknown error fetching JSON from ${url}`);
    };
    xhr.onprogress = (e) => {
      if (e.lengthComputable) progress(e.loaded, e.total);
    };
    xhr.onerror = () => {
      reject(`Error ${xhr.status} (${xhr.statusText}) fetching ${url}`);
    };
    xhr.onabort = () => {
      reject(`Aborted while fetching ${url}`);
    };
    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.send();
  });
};

async function fetchGzippedJsonForGoogleBot(url: string): Promise<any> {
  const gzUrl = url.replace(/latest/, "latest.gz");
  const res = await fetch(gzUrl, { mode: "cors" });
  if (!res.ok)
    throw new Error(`Error ${res.status} (${res.statusText}) fetching ${url}`);
  if (!res.body)
    throw new Error(`No body in response from ${url} (status ${res.status})`);

  // Use DecompressionStream to decompress the gzipped response
  const decompressionStream = new (globalThis as any).DecompressionStream(
    "gzip"
  );
  const decompressedStream: ReadableStream<ArrayBuffer> =
    res.body.pipeThrough(decompressionStream);

  const text = await new Response(decompressedStream).text();
  return JSON.parse(text);
}

// Sigh, the fetch spec has a bug: https://github.com/whatwg/fetch/issues/1358
const fetchJsonWithIncorrectProgress = async (
  url: string,
  progress: (receivedBytes: number, totalBytes: number) => void
) => {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok)
    throw new Error(`Error ${res.status} (${res.statusText}) fetching ${url}`);
  if (!res.body)
    throw new Error(`No body in response from ${url} (status ${res.status})`);
  const reader = res.body.getReader();
  const contentLength = +(res.headers.get("Content-Length") ?? 0);
  let receivedBytes = 0;
  progress(receivedBytes, contentLength);
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    receivedBytes += value.length;
    progress(receivedBytes, contentLength);
  }
  // Wait a tick to allow the 100% progress value to get through
  await new Promise((resolve) => setTimeout(resolve));
  const chunksAll = new Uint8Array(receivedBytes); // (4.1)
  let position = 0;
  for (const chunk of chunks) {
    chunksAll.set(chunk, position); // (4.2)
    position += chunk.length;
  }
  const result = new TextDecoder("utf-8").decode(chunksAll);
  return JSON.parse(result);
};

const fetchJson = async (
  version: string,
  progress: (receivedBytes: number, totalBytes: number) => void
) => {
  return fetchJsonWithProgress(
    `https://raw.githubusercontent.com/nornagon/cdda-data/main/data/${version}/all.json`,
    progress
  );
};

const fetchLocaleJson = async (
  version: string,
  locale: string,
  progress: (receivedBytes: number, totalBytes: number) => void
) => {
  return fetchJsonWithProgress(
    `https://raw.githubusercontent.com/nornagon/cdda-data/main/data/${version}/lang/${locale}.json`,
    progress
  );
};

async function retry<T>(promiseGenerator: () => Promise<T>) {
  while (true) {
    try {
      return await promiseGenerator();
    } catch (e) {
      console.error(e);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

const loadProgressStore = writable<[number, number] | null>(null);
export const loadProgress = { subscribe: loadProgressStore.subscribe };
let _hasSetVersion = false;
const { subscribe, set } = writable<CddaData | null>(null);
export const data = {
  subscribe,
  async setVersion(version: string, locale: string | null) {
    if (_hasSetVersion) throw new Error("can only set version once");
    _hasSetVersion = true;
    let totals = [0, 0, 0];
    let receiveds = [0, 0, 0];
    const updateProgress = () => {
      const total = totals.reduce((a, b) => a + b, 0);
      const received = receiveds.reduce((a, b) => a + b, 0);
      loadProgressStore.set([received, total]);
    };
    const [dataJson, localeJson, pinyinNameJson] = await Promise.all([
      retry(() =>
        fetchJson(version, (receivedBytes, totalBytes) => {
          totals[0] = totalBytes;
          receiveds[0] = receivedBytes;
          updateProgress();
        })
      ),
      locale &&
        retry(() =>
          fetchLocaleJson(version, locale, (receivedBytes, totalBytes) => {
            totals[1] = totalBytes;
            receiveds[1] = receivedBytes;
            updateProgress();
          })
        ),
      locale?.startsWith("zh_") &&
        retry(() =>
          fetchLocaleJson(
            version,
            locale + "_pinyin",
            (receivedBytes, totalBytes) => {
              totals[2] = totalBytes;
              receiveds[2] = receivedBytes;
              updateProgress();
            }
          )
        ),
    ]);
    if (locale && localeJson) {
      if (pinyinNameJson) pinyinNameJson[""] = localeJson[""];
      i18n.loadJSON(localeJson);
      i18n.setLocale(locale);
      if (pinyinNameJson) {
        i18n.loadJSON(pinyinNameJson, "pinyin");
      }
    }
    const cddaData = new CddaData(
      dataJson.data,
      dataJson.build_number,
      dataJson.release
    );
    set(cddaData);
  },
};
