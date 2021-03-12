import { readable } from 'svelte/store';

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
  "uncraft"
])

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
])

// TODO: should be called "Translation"
export type Name = string | { str: string, str_pl?: string } | { str_sp: string }

export const mapType = (type: string): string => typeMappings.get(type) ?? type

export const singular = (name: Name): string =>
  typeof name === 'string'
    ? name 
    : 'str_sp' in name
      ? name.str_sp
      : name.str

export const plural = (name: Name): string =>
  typeof name === 'string'
    ? name + 's'
    : 'str_sp' in name
      ? name.str_sp
      : 'str_pl' in name
        ? name.str_pl
        : name.str + 's'

export const singularName = (obj: any): string =>
  singular(obj?.name ?? obj?.id ?? obj?.abstract)

export const pluralName = (obj: any): string =>
  plural(obj?.name ?? obj?.id ?? obj?.abstract)
  
export function parseVolume(string: string | number): number {
  if (typeof string === 'undefined') return 0
  if (typeof string === 'number')
    return string * 250
  if (string.endsWith('ml'))
    return parseInt(string)
  else if (string.endsWith('L'))
    return parseInt(string) * 1000
}

export function parseMass(string: string | number): number {
  if (typeof string === 'undefined') return 0
  if (typeof string === 'number')
    return string
  if (string.endsWith('mg'))
    return parseInt(string) / 1000
  if (string.endsWith('kg'))
    return parseInt(string) * 1000
  if (string.endsWith('g'))
    return parseInt(string)
}

export function asLiters(string: string | number): string {
  const ml = parseVolume(string)
  return `${(ml / 1000).toFixed(2)} L`
}

export function asKilograms(string: string | number): string {
  const g = parseMass(string)
  return `${(g / 1000).toFixed(2)} kg`
}

export class CddaData {
  _raw: any[]
  _byType: Map<string, any[]> = new Map
  _byTypeById: Map<string, Map<string, any>> = new Map
  _abstractsByType: Map<string, Map<string, any>> = new Map
  _toolReplacements: Map<string, string[]> = new Map
  _craftingPseudoItems: Map<string, string> = new Map
  _migrations: Map<string, string> = new Map
  _flattenCache: Map<any, any> = new Map

  constructor(raw: any[]) {
    this._raw = raw
    for (const obj of raw) {
      if (!Object.hasOwnProperty.call(obj, 'type'))
        continue
      if (obj.type === 'MIGRATION') {
        for (const id of (typeof obj.id === 'string' ? [obj.id] : obj.id)) {
          const { replace } = obj
          this._migrations.set(id, replace)
        }
        continue
      }
      const mappedType = mapType(obj.type)
      if (!this._byType.has(mappedType)) this._byType.set(mappedType, [])
      this._byType.get(mappedType).push(obj)
      if (Object.hasOwnProperty.call(obj, 'id')) {
        if (!this._byTypeById.has(mappedType)) this._byTypeById.set(mappedType, new Map)
        this._byTypeById.get(mappedType).set(obj.id, obj)
      }
      // recipes are id'd by their result
      if (mappedType === 'recipe' && Object.hasOwnProperty.call(obj, 'result')) {
        if (!this._byTypeById.has(mappedType)) this._byTypeById.set(mappedType, new Map)
        const id = obj.result + (obj.id_suffix ? '_' + obj.id_suffix : '')
        this._byTypeById.get(mappedType).set(id, obj)
      }
      if (Object.hasOwnProperty.call(obj, 'abstract')) {
        if (!this._abstractsByType.has(mappedType)) this._abstractsByType.set(mappedType, new Map)
        this._abstractsByType.get(mappedType).set(obj.abstract, obj)
      }
      if (obj.type === 'TOOL' && Object.hasOwnProperty.call(obj, 'sub')) {
        if (!this._toolReplacements.has(obj.sub))
          this._toolReplacements.set(obj.sub, [])
        this._toolReplacements.get(obj.sub).push(obj.id)
      }
      
      if (Object.hasOwnProperty.call(obj, 'crafting_pseudo_item')) {
        this._craftingPseudoItems.set(obj.crafting_pseudo_item, obj.id)
      }
    }
  }
  
  byId<T = any>(type: string, id: string): T {
    if (typeof id !== 'string') throw new Error('Requested non-string id')
    if (type === 'item' && this._migrations.has(id)) return this.byId(type, this._migrations.get(id))
    const obj = this._byTypeById.get(type)?.get(id)
    if (obj)
      return this._flatten(obj)
  }
  
  byType<T = any>(type: string): T[] {
    return this._byType.get(type).map(x => this._flatten(x)) ?? []
  }
  
  replacementTools(type: string): string[] {
    return this._toolReplacements.get(type) ?? []
  }
  
  craftingPseudoItem(id: string): string | undefined {
    return this._craftingPseudoItems.get(id)
  }
  
  all() {
    return this._raw
  }
  
  _flatten<T = any>(_obj: T): T {
    const obj: any = _obj
    if (this._flattenCache.has(obj)) return this._flattenCache.get(obj)
    const parent = 'copy-from' in obj
      ? this._byTypeById.get(mapType(obj.type))?.get(obj['copy-from']) ??
        this._abstractsByType.get(mapType(obj.type))?.get(obj['copy-from']) : null
    if ('copy-from' in obj && !parent)
      console.error(`Missing parent in ${obj.id ?? obj.abstract ?? obj.result ?? JSON.stringify(obj)}`)
    if (!parent) {
      this._flattenCache.set(obj, obj)
      return obj;
    }
    const ret = {...this._flatten(parent), ...obj}
    for (const k of Object.keys(ret.relative ?? {})) {
      if (typeof ret.relative[k] === 'number') {
        ret[k] = (ret[k] ?? 0) + ret.relative[k]
      }
      // TODO: damage, vitamins, mass, volume, time
    }
    delete ret.relative
    for (const k of Object.keys(ret.proportional ?? {})) {
      if (typeof ret.proportional[k] === 'number') {
        if (k === 'attack_cost' && !(k in ret)) ret[k] = 100
        ret[k] *= ret.proportional[k]
        ret[k] = ret[k] | 0 // most things are ints.. TODO: what keys are float?
      }
      // TODO: damage, mass, volume, time (need to check the base value's type)
    }
    delete ret.proportional
    for (const k of Object.keys(ret.extend ?? {})) {
      if (Array.isArray(ret.extend[k])) {
        ret[k] = (ret[k] ?? []).concat(ret.extend[k])
      }
    }
    delete ret.extend
    for (const k of Object.keys(ret.delete ?? {})) {
      if (Array.isArray(ret.delete[k])) {
        ret[k] = (ret[k] ?? []).filter(x => !ret.delete[k].includes(x))
      }
    }
    this._flattenCache.set(obj, ret)
    return ret
  }
  
  _cachedDeathDrops: Map<string, {id: string, prob: number, count: [number, number]}[]> = new Map
  flatDeathDrops(mon_id: string): {id: string, prob: number, count: [number, number]}[] {
    if (this._cachedDeathDrops.has(mon_id)) return this._cachedDeathDrops.get(mon_id)
    const normalizeDeathDrops = (death_drops): ItemGroup | undefined => {
      if (death_drops) {
        if (typeof death_drops === 'string') {
          return this.byId('item_group', death_drops) as ItemGroup
        } else if (Array.isArray(death_drops)) {
          return {subtype: 'distribution', entries: death_drops}
        } else {
          return {subtype: 'distribution', ...death_drops}
        }
      }
    }
    const mon = this.byId('monster', mon_id)
    const ret = mon.death_drops
      ? flattenItemGroup(this, normalizeDeathDrops(mon.death_drops))
      : []
    ret.sort((a, b) => b.prob - a.prob)
    this._cachedDeathDrops.set(mon_id, ret)
    return ret
  }
  
  uncraftRecipe(item_id: string): Recipe | undefined {
    let reversed: Recipe
    for (const recipe of this.byType<Recipe>('recipe')) {
      if (recipe.result === item_id) {
        if (recipe.type === 'uncraft') return recipe
        else if (recipe.reversible) reversed = recipe
      }
    }
    return reversed
  }
}

export type ItemGroupEntry = 
  (
    { item: string } |
    { group: string } |
    { distribution: ItemGroupEntry[] } |
    { collection: ItemGroupEntry[] }
  ) & {
    prob?: number
    count?: number | [number, number]
    charges?: number | [number, number]
    // TODO: damage, dirt, charges, ammo, container, contents, snippets?, sealed, custom-flags
  }

export type ItemGroupEntryOrShortcut =
  ItemGroupEntry |
  [ string, number ] // item_id, prob (or item_group_id, prob if in 'groups' array)
  
export type ItemGroup = {
  subtype: "collection" | "distribution"
  entries?: ItemGroupEntryOrShortcut[]
  items?: (string /* item_id with prob=100 */ | ItemGroupEntryOrShortcut)[]
  groups?: (string /* item_group_id with prob=100 */ | ItemGroupEntryOrShortcut)[]
  "container-item"?: string
  // TODO: on_overflow
} | {
  subtype?: "old" // ~= "distribution"
  items: ItemGroupEntryOrShortcut[]
}

export function flattenItemGroup(data: CddaData, group: ItemGroup): {id: string, prob: number, count: [number, number]}[] {
  const retMap = new Map<string, {prob: number, count: [number, number]}>()
  
  function addOne({id, prob, count}: {id: string, prob: number, count: [number, number]}) {
    const {prob: prevProb, count: prevCount} = retMap.get(id) ?? {prob: 0, count: [0, 0]}
    const newProb = 1 - (1 - prevProb) * (1 - prob)
    const newCount: [number, number] = [count[0] + prevCount[0], count[1] + prevCount[1]]
    retMap.set(id, {prob: newProb, count: newCount})
  }
  
  function add(...args: {id: string, prob: number, count: [number, number]}[]) {
    args.forEach(addOne)
  }
  
  if (group['container-item'])
    add({id: group['container-item'], prob: 1, count: [1, 1]})
  
  const normalizedEntries: ItemGroupEntry[] = []
  if (group.subtype === 'old' || !group.subtype) {
    for (const item of group.items as ItemGroupEntryOrShortcut[])
      if (Array.isArray(item))
        normalizedEntries.push({ item: item[0], prob: item[1] })
      else
        normalizedEntries.push(item)
  } else {
    for (const entry of group.entries ?? [])
      if (Array.isArray(entry))
        normalizedEntries.push({ item: entry[0], prob: entry[1] })
      else
        normalizedEntries.push(entry)
    for (const item of group.items ?? [])
      if (Array.isArray(item))
        normalizedEntries.push({ item: item[0], prob: item[1] })
      else if (typeof item === 'string')
        normalizedEntries.push({ item, prob: 100 })
      else
        normalizedEntries.push(item)
    for (const g of group.groups ?? [])
      if (Array.isArray(g))
        normalizedEntries.push({ group: g[0], prob: g[1] })
      else if (typeof g === 'string')
        normalizedEntries.push({ group: g, prob: 100 })
      else
        normalizedEntries.push(g)
  }
  
  function prod(p: {id: string, prob: number, count: [number, number]}, prob: number, count: [number, number]): {id: string, prob: number, count: [number, number]} {
    return {id: p.id, prob: p.prob * prob, count: [p.count[0] * count[0], p.count[1] * count[1]]}
  }
  
  function normalizeCount(entry: ItemGroupEntry): [number, number] {
    if (entry.count)
      if (typeof entry.count === 'number')
        return [entry.count, entry.count]
      else
        return entry.count
    else if (entry.charges)
      if (typeof entry.charges === 'number')
        return [entry.charges, entry.charges]
      else
        return entry.charges
    return [1, 1]
  }
  
  if (group.subtype === 'collection') {
    for (const entry of normalizedEntries) {
      const { prob = 100 } = entry
      const nProb = Math.min(prob, 100) / 100
      const nCount = normalizeCount(entry)
      if ('item' in entry) {
        add({id: entry.item, prob: nProb, count: nCount})
      } else if ('group' in entry) {
        add(...flattenItemGroup(data,
          data.byId('item_group', entry.group)
        ).map(p => prod(p, nProb, nCount)))
      } else if ('collection' in entry) {
        add(...flattenItemGroup(data, {
          subtype: 'collection',
          entries: entry.collection
        }).map(p => prod(p, nProb, nCount)))
      } else if ('distribution' in entry) {
        add(...flattenItemGroup(data, {
          subtype: 'distribution',
          entries: entry.distribution
        }).map(p => prod(p, nProb, nCount)))
      } else {
        throw new Error(`unknown item group entry: ${JSON.stringify(entry)}`)
      }
    }
  } else { // distribution
    let totalProb = 0
    for (const entry of normalizedEntries)
      totalProb += entry.prob ?? 100
    for (const entry of normalizedEntries) {
      const nProb = (entry.prob ?? 100) / totalProb
      const nCount = normalizeCount(entry)
      if ('item' in entry) {
        add({id: entry.item, prob: nProb, count: nCount})
      } else if ('group' in entry) {
        add(...flattenItemGroup(data,
          data.byId('item_group', entry.group)
        ).map(p => prod(p, nProb, nCount)))
      } else if ('collection' in entry) {
        add(...flattenItemGroup(data, {
          subtype: 'collection',
          entries: entry.collection
        }).map(p => prod(p, nProb, nCount)))
      } else if ('distribution' in entry) {
        add(...flattenItemGroup(data, {
          subtype: 'distribution',
          entries: entry.distribution
        }).map(p => prod(p, nProb, nCount)))
      } else {
        throw new Error(`unknown item group entry: ${JSON.stringify(entry)}`)
      }
    }
  }

  return [...retMap.entries()].map(([id, v]) => ({id, ...v}))
}

export type Construction = {
  type: 'construction'
  id: string
  group: string // construction_group_id
  required_skills?: [string /* skill_id */, number /* level */][]
  
  // legacy, superceded by required_skills
  skill?: string
  difficulty?: number
  
  category?: string // construction_category_id, default: OTHER
  time?: string | number /* minutes */
  
  using?: string | [string /* requirement_id */, number /* count */][]
  pre_note?: string
  
  pre_terrain?: string // if starts with f_, then furniture_id, else terrain_id
  post_terrain?: string // as above

  pre_flags?: string[]
  post_flags?: string[]
  
  byproducts?: ItemGroupEntry[] // subtype collection
  
  pre_special?: string
  post_special?: string
  explain_failure?: string
  
  vehicle_start?: boolean
  on_display?: boolean // default: true
  dark_craftable?: boolean
} & RequirementData


export type ItemComponent = [ string /* item_id */, number /* count */, ...('LIST' | 'NO_RECOVER')[] ]
export type QualityRequirement = {
  id: string
  level?: number // default: 1
  amount?: number // default: 1
}
export type ToolComponent = string | [string, number] | [string, number, "LIST"]

export type Requirement = {
  id: string
  type: 'requirement'
} & RequirementData

export type RequirementData = {
  components?: (ItemComponent | ItemComponent[])[]
  qualities?: (QualityRequirement | QualityRequirement[])[]
  tools?: (ToolComponent | ToolComponent[])[]
}

export type Recipe = {
  result?: string
  abstract?: string // mutex with result
  type: 'recipe' | 'uncraft'
  
  id_suffix?: string // only for type 'recipe'. not allowed for abstracts
  obsolete?: boolean
  
  time?: number /* moves */ | string /* duration */
  difficulty?: number // default: 0
  flags?: string[]
  
  contained?: boolean
  container?: string /* item_id, implies contained */
  sealed?: boolean
  
  batch_time_factors?: [number /* int */, number /* int */] // [rscale (percentage), rsize]
  
  charges?: number // int, no default
  result_mult?: number // int, default: 1
  
  skill_used?: string // skill_id
  
  skills_required?: [string, number] | [string, number][] // skill_id, level
  
  proficiencies?: any[] // TODO
  autolearn?: boolean | [string, number][]
  never_learn?: boolean
  decomp_learn?: number | [string, number][]
  book_learn?: ([string] | [string, number])[] | Record<string, {skill_level?: number, recipe_name?: string, hidden?: boolean}>
  
  activity_level?: string
  
  delete_flags?: string[] // flag_id
  using?: string | [string, number][] // requirement_id
  
  // for type: 'recipe' only
  category: string
  subcategory: string
  description: string
  reversible: boolean
  byproducts?: ([string] | [string, number])[]
  // TODO: construction_blueprint
} & RequirementData

function flattenChoices<T>(data: CddaData, choices: T[], get: (x: Requirement) => T[][]): {id: string, count: number}[] {
  const flatChoices = []
  for (const choice of choices) {
    if (Array.isArray(choice)) {
      const [id, count, isList] = choice
      if (isList === 'LIST') {
        const otherRequirement = data.byId('requirement', id)
        if (otherRequirement.type !== 'requirement') {
          console.error(`Expected a requirement, got ${otherRequirement.type} (id=${otherRequirement.id})`)
        }
        const otherRequirementTools = get(otherRequirement) ?? []
        const otherRequirementChoices = otherRequirementTools[0] // only take the first
        flatChoices.push(...flattenChoices(data, otherRequirementChoices, get).map(x => ({...x, count: x.count * count})))
      } else {
        flatChoices.push({id, count})
      }
    } else if (typeof choice === 'string') {
      flatChoices.push({id: choice, count: 1})
    } else {
      throw new Error('unexpected choice type')
    }
  }
  return flatChoices
}

function expandSubstitutes(data: CddaData, r: {id: string, count: number}): {id: string, count: number}[] {
  const replacements = data.replacementTools(r.id)
  return [r, ...replacements.map(o => ({id: o, count: r.count}))]
}

export function normalize<T>(xs: (T | T[])[]): T[][] {
  return xs.map((x: T | T[]) => Array.isArray(x) ? x as T[] : [x])
}

export function flattenRequirement<T>(data: CddaData, required: (T | T[])[], get: (x: Requirement) => (T | T[])[]) {
  return normalize(required)
    .map(x => flattenChoices(data, x, q => normalize(get(q))).flatMap(y => expandSubstitutes(data, y)))
    .filter(x => x.length)
}

export const countsByCharges = (item): boolean => {
  return item.type === 'AMMO' || item.type === 'COMESTIBLE' || item.stackable;
}

const fetchJson = async () => {
  const res = await fetch(`https://raw.githubusercontent.com/nornagon/cdda-data/main/data/latest/all.json`, {
    mode: 'cors'
  })
  if (!res.ok)
    throw new Error(`Error ${res.status} (${res.statusText}) fetching data`)
  const json = await res.json()
  return new CddaData(json.data)
}

const json = (() => {
  let promise: Promise<CddaData>
  return () => {
    if (!promise) promise = fetchJson()
    return promise
  }
})()

export const data = readable<CddaData>(null, function (set) {
  json().then(set)
});
