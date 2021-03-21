<script lang="ts">
import { getContext } from "svelte";
import { CddaData, showProbability } from "../../data";
import type { Harvest, Monster } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string

let data = getContext<CddaData>('data')
const mons = data.byType('monster').flatMap(mon => {
  if (!mon.id) return []
  const deathDrops = data.flatDeathDrops(mon.id)
  const dd = deathDrops.find(dd => dd.id === item_id)
  if (dd) return [{id: mon.id, prob: dd.prob}]
  return []
})
mons.sort((a, b) => b.prob - a.prob)

const itemsFromHarvest = (h: Harvest): string[] =>
  h.entries?.flatMap(e =>
    e.type === "bionic_group"
      ? data.flattenItemGroup(data.byId('item_group', e.drop)).map(x => x.id)
      : [e.drop]) ?? []

const harvests = data.byType<Harvest>('harvest').filter(h => itemsFromHarvest(h).some(e => e === item_id))
const harvestableFrom = data.byType<Monster>('monster').filter(m => m.id && harvests.some(h => h.id === m.harvest))

let droppedByLimit = 10
let harvestableFromLimit = 10
</script>

{#if mons.length}
<section>
  <h1>Dropped By</h1>
  <ul>
    {#each mons.slice(0, droppedByLimit) as {id, prob}}
    <li><ItemSymbol item={data.byId('monster', id)} /> <ThingLink {id} type="monster" /> ({showProbability(prob)})</li>
    {/each}
  </ul>
  {#if mons.length > droppedByLimit}
  <button class="disclosure" on:click={(e) => { e.preventDefault(); droppedByLimit = Infinity }}>See all...</button>
  {/if}
</section>
{/if}

{#if harvestableFrom.length}
<section>
  <h1>Butcher</h1>
  <ul>
    {#each harvestableFrom.slice(0, harvestableFromLimit) as m}
    <li><ItemSymbol item={m} /> <ThingLink id={m.id} type="monster" /></li>
    {/each}
  </ul>
  {#if harvestableFrom.length > harvestableFromLimit}
  <button class="disclosure" on:click={(e) => { e.preventDefault(); harvestableFromLimit = Infinity }}>See all...</button>
  {/if}
</section>
{/if}
