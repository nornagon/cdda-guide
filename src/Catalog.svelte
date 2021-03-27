<script lang="ts">
import { setContext } from "svelte";

import { CddaData, singularName } from "./data";
import type { Item, Monster, VehiclePart } from "./types";
import ThingLink from "./types/ThingLink.svelte";

export let type: string
export let data: CddaData
setContext('data', data)

const things = data.byType(type).filter(o => o.id)
things.sort((a, b) => singularName(a).localeCompare(singularName(b)))

function groupBy<T>(things: T[], f: (x: T) => string) {
  const map = new Map<string, T[]>()
  for (const thing of things) {
    const group = f(thing)
    if (!map.has(group)) map.set(group, [])
    map.get(group).push(thing)
  }
  return map
}

const groupingFn = {
  monster: (m: Monster) => m.default_faction ?? '',
  item: (i: Item) => i.type,
  vehicle_part: (vp: VehiclePart) => (vp.categories??[])[0] ?? '',
}[type] ?? (() => '')

const groups = groupBy(things, groupingFn)
const groupKeys = [...groups.keys()].sort()

let limits = new Map([...groupKeys.map(k => [k, 10] as [string, number])])
</script>

<h1>{type}</h1>
{#each groupKeys as groupName}
<section>
  {#if groupName}
  <h1>{groupName}</h1>
  {/if}
  <ul>
    {#each groups.get(groupName).slice(0, limits.get(groupName)) as thing}
    <li><ThingLink {type} id={thing.id} /></li>
    {/each}
  </ul>
  {#if groups.get(groupName).length > limits.get(groupName)}
  <button class="disclosure" on:click={(e) => { e.preventDefault(); limits.set(groupName, Infinity); limits = limits }}>See all...</button>
  {/if}
</section>
{/each}
