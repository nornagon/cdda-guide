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

class CddaData {
  _raw: any[]
  _byId: Map<string, any>
  _abstracts: Map<string, any>
  constructor(raw: any[]) {
    this._raw = raw
    this._byId = new Map
    this._abstracts = new Map
    for (const obj of raw) {
      if (Object.hasOwnProperty.call(obj, 'id'))
        this._byId.set(obj.id, obj)
      if (Object.hasOwnProperty.call(obj, 'abstract'))
        this._abstracts.set(obj.abstract, obj)
    }
    for (const obj of this._byId.values()) {
      const parent = obj['copy-from'] ? this._byId.get(obj['copy-from']) ?? this._abstracts.get(obj['copy-from']) : null
      if (parent) {
        if (parent['copy-from']) {
          //console.log('double copy-from', obj.id)
          if (obj['relative'] && parent['relative'] && obj['type'] === 'MONSTER')
            console.log('double relative', obj.id)
        }
      }
    }
  }
  
  byId(id: string): any {
    return this._flatten(this._byId.get(id))
  }
  
  all() {
    return this._byId.values()
  }
  
  _flatten(obj: any) {
    const parent = 'copy-from' in obj ? this._byId.get(obj['copy-from']) ?? this._abstracts.get(obj['copy-from']) : null
    if (obj.id === 'mon_gasbomb_hack') debugger
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
