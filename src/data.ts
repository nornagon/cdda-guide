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
])

export const mapType = (type: string): string => typeMappings.get(type) ?? type

export const singularName = (obj: any): string => {
  return obj?.name
    ? typeof obj.name === 'string'
      ? obj.name
      : obj.name.str_sp ?? obj.name.str
    : /* fallback to id? */ obj?.id ?? obj?.abstract
}

export const pluralName = (obj: any): string => {
  return obj?.name
    ? typeof obj.name === 'string'
      ? obj.name
      : obj.name.str_sp ?? obj.name.str_pl ?? obj.name.str + 's'
    : /* fallback to id? */ obj?.id ?? obj?.abstract
}
  
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
      if (obj.type === 'recipe' && Object.hasOwnProperty.call(obj, 'result')) {
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
  
  byId(type: string, id: string): any {
    if (typeof id !== 'string') throw new Error('Requested non-string id')
    if (type === 'item' && this._migrations.has(id)) return this.byId(type, this._migrations.get(id))
    const obj = this._byTypeById.get(type)?.get(id)
    if (obj)
      return this._flatten(obj)
  }
  
  byType(type: string): any[] {
    // TODO: flatten...?
    return this._byType.get(type) ?? []
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
  
  _flatten(obj: any) {
    const parent = 'copy-from' in obj
      ? this._byTypeById.get(mapType(obj.type))?.get(obj['copy-from']) ??
        this._abstractsByType.get(mapType(obj.type))?.get(obj['copy-from']) : null
    if ('copy-from' in obj && !parent)
      console.error(`Missing parent in ${obj.id ?? obj.abstract}`)
    if (!parent) return obj;
    const ret = {...this._flatten(parent), ...obj}
    for (const k of Object.keys(ret.relative ?? {})) {
      if (typeof ret.relative[k] === 'number') {
        ret[k] += ret.relative[k]
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
    return ret
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
  // TODO: container-item, on_overflow
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
