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

class CddaData {
  _raw: any[]
  _byType: Map<string, any[]> = new Map
  _byTypeById: Map<string, Map<string, any>> = new Map
  _abstractsByType: Map<string, Map<string, any>> = new Map
  _toolReplacements: Map<string, string[]> = new Map
  _craftingPseudoItems: Map<string, string> = new Map

  constructor(raw: any[]) {
    this._raw = raw
    for (const obj of raw) {
      if (!Object.hasOwnProperty.call(obj, 'type'))
        continue
      const mappedType = mapType(obj.type)
      if (!this._byType.has(mappedType)) this._byType.set(mappedType, [])
      this._byType.get(mappedType).push(obj)
      if (Object.hasOwnProperty.call(obj, 'id')) {
        if (!this._byTypeById.has(mappedType)) this._byTypeById.set(mappedType, new Map)
        this._byTypeById.get(mappedType).set(obj.id, obj)
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
    if (!id) throw new Error('fix')
    const obj = this._byTypeById.get(type)?.get(id)
    if (obj)
      return this._flatten(obj)
  }
  
  byType(type: string): any[] {
    // TODO: flatten...?
    return this._byType.get(type)
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
      }
      // TODO: damage, mass, volume, time (need to check the base value's type)
    }
    delete ret.proportional
    return ret
  }
}

const json: Promise<CddaData> = (async () => {
  const latestBuildRes = await fetch(`https://raw.githubusercontent.com/nornagon/cdda-data/main/latest-build.json`)
  if (!latestBuildRes.ok)
    throw new Error(`Error ${latestBuildRes.status} (${latestBuildRes.statusText}) fetching data`)
  const {latest_build} = await latestBuildRes.json()
  const res = await fetch(`https://raw.githubusercontent.com/nornagon/cdda-data/main/data/${latest_build}/all.json`)
  if (!res.ok)
    throw new Error(`Error ${res.status} (${res.statusText}) fetching data`)
  const json = await res.json()
  return new CddaData(json)
})()

export const data = readable<CddaData>(null, function (set) {
  json.then(set)
});
