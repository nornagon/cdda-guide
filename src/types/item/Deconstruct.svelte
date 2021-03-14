<script lang="ts">
import { getContext } from "svelte";
import { CddaData, flattenItemGroup, singularName } from "../../data";
import type { Furniture } from "../../types";
import ThingLink from "../ThingLink.svelte";
import FurnitureSymbol from "./FurnitureSymbol.svelte";

export let item_id: string

const data = getContext<CddaData>('data')

let deconstructibleFrom = data.byType<Furniture>('furniture').filter(f => {
  const deconstruct = f.deconstruct?.items
    ? flattenItemGroup(data, { subtype: "collection", entries: f.deconstruct.items })
    : []
    
  const bash = f.bash?.items
    ? flattenItemGroup(data, { subtype: "collection", entries: f.bash.items })
    : []
    
  return deconstruct.some(({id}) => id === item_id) || bash.some(({id}) => id === item_id)
}).sort((a, b) => singularName(a).localeCompare(singularName(b)))

let limit = 10
</script>

{#if deconstructibleFrom.length}
<section>
  <h1>Deconstruct</h1>
  <ul>
    {#each deconstructibleFrom.slice(0, limit) as f}
    <li><FurnitureSymbol item={data.byId('furniture', f.id)} /> <ThingLink id={f.id} type="furniture" /></li>
    {/each}
  </ul>
  {#if deconstructibleFrom.length > limit}
  <a href="" on:click={(e) => { e.preventDefault(); limit = Infinity }}>See all...</a>
  {/if}
</section>
{/if}