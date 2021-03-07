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

const fetchJson = async () => {
  const res = await fetch(`https://raw.githubusercontent.com/nornagon/cdda-data/main/data/latest/all.json`, {
    mode: 'cors'
  })
  console.log(res)
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
