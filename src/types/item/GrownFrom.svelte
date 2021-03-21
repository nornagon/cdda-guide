<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";
import type { Item } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string

let data = getContext<CddaData>('data')

const sources = data.byType<Item>('item').filter(item => {
  if (!item.id || !item.seed_data) return false
  return item.seed_data.fruit === item_id || item.seed_data.byproducts?.includes(item_id)
})
//mons.sort((a, b) => b.prob - a.prob)

let limit = 10
</script>

{#if sources.length}
<section>
  <h1>Grown From</h1>
  <ul>
    {#each sources.slice(0, limit) as item}
    <li><ItemSymbol {item} /> <ThingLink id={item.id} type="item" /> ({item.seed_data.grow ?? '1 day'})</li>
    {/each}
  </ul>
  {#if sources.length > limit}
  <button class="disclosure" on:click={(e) => { e.preventDefault(); limit = Infinity }}>See all...</button>
  {/if}
</section>
{/if}
