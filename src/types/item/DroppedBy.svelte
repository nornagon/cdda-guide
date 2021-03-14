<script lang="ts">
import { getContext } from "svelte";
import { CddaData, showProbability } from "../../data";
import ThingLink from "../ThingLink.svelte";

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

let droppedByLimit = 10
</script>

{#if mons.length}
<section>
  <h1>Dropped By</h1>
  <ul>
    {#each mons.slice(0, droppedByLimit) as {id, prob}}
    <li><ThingLink {id} type="monster" /> ({showProbability(prob)})</li>
    {/each}
  </ul>
  {#if mons.length > droppedByLimit}
  <a href="" on:click={(e) => { e.preventDefault(); droppedByLimit = Infinity }}>See all...</a>
  {/if}
</section>
{/if}