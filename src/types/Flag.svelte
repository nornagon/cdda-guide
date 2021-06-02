<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../data";
import type { Item, VehiclePart, JsonFlag } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: JsonFlag

let data = getContext<CddaData>('data')

let itemsWithFlag = new Array<Item>()
for (const it of data.byType<Item>('item')) {
  if (!it.id) continue;
  const q = (it.flags ?? []).find(id => id === item.id)
  if (q) {
    itemsWithFlag.push(it)
  }
}

let vpartsWithFlag = new Array<VehiclePart>()
for (const it of data.byType<VehiclePart>('vehicle_part')) {
  if (!it.id) continue;
  const q = (it.flags ?? []).find(id => id === item.id)
  if (q) {
    vpartsWithFlag.push(it)
  }
}
</script>

<h1>Flag: {item.id}</h1>
{#if item.info}
<section>
  <p style="color: var(--cata-color-gray)">{item.info}</p>
</section>
{/if}
{#if itemsWithFlag.length}
<section>
  <h1>Items</h1>
  <ul>
    {#each itemsWithFlag.sort((a, b) => singularName(a).localeCompare(singularName(b))) as {id}}
    <li><ThingLink type="item" {id} /></li>
    {/each}
  </ul>
</section>
{/if}
{#if vpartsWithFlag.length}
<section>
  <h1>Vehicle Parts</h1>
  <ul>
    {#each vpartsWithFlag.sort((a, b) => singularName(a).localeCompare(singularName(b))) as {id}}
    <li><ThingLink type="vehicle_part" {id} /></li>
    {/each}
  </ul>
</section>
{/if}
