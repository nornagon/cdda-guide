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
])

export const mapType = (type: string): string => typeMappings.get(type) ?? type

export const singularName = (obj: any): string => {
  return obj.name ?
    obj.name.str_sp ?? obj.name.str : /* fallback to id? */ obj.id ?? obj.abstract
}

class CddaData {
  _raw: any[]
  _byType: Map<string, any[]> = new Map
  _byTypeById: Map<string, Map<string, any>> = new Map
  _abstractsByType: Map<string, Map<string, any>> = new Map
  _toolReplacements: Map<string, string[]> = new Map

  constructor(raw: any[]) {
    this._raw = raw
    for (const obj of raw) {
      if (Object.hasOwnProperty.call(obj, 'type')) {
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
        ret[k] *= ret.proportional[k]
      }
      // TODO: damage, mass, volume, time (need to check the base value's type)
    }
    delete ret.proportional
    return ret
  }
}

const json: Promise<CddaData> = (async () => {
  const res = await fetch(`/data.json`)
  if (!res.ok) {
    throw new Error(`Error ${res.status} (${res.statusText}) fetching data`)
  }
  const json = await res.json()
  /*
  const byId = new Map
  const abstract = new Map
  for (const obj of json) {
    if (obj.id) {
      byId.set(obj.id, obj)
    } else if (obj.abstract) {
      abstract.set(obj.abstract, obj)
    }
  }
  for (const value of byId.values()) {
    if (Object.hasOwnProperty.call(value, 'copy-from')) {
      let parent: any = null
      if (byId.has(value['copy-from'])) {
        parent = byId.get(value['copy-from'])
      } else if (abstract.has(value['copy-from'])) {
        parent = abstract.get(value['copy-from'])
      } else {
        console.log('unknown copy-from:', value['copy-from'])
      }
      if (parent) {
        if (parent['copy-from']) {
          //console.log('double copy', value.id)
          if (value['relative'] && parent['relative']) {
            console.log('double relative', value.id)
          }
        }
        Object.setPrototypeOf(value, parent)
      }
    }
  }
  console.log(byId.get('mon_dog_zombie_brute'))
  */
  return new CddaData(json)
})()

export const data = readable<CddaData>(null, function (set) {
  json.then(set)
});
