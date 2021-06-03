<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../data";
import type { Item, VehiclePart, ToolQuality } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: ToolQuality

let data = getContext<CddaData>('data')

let toolsWithQualityByLevel = new Map<number, Item[]>()
for (const it of data.byType('item')) {
  if (!it.id) continue;
  const q = (it.qualities ?? []).find(([id, _level]) => id === item.id)
  if (q) {
    const [, level] = q
    if (!toolsWithQualityByLevel.has(level)) toolsWithQualityByLevel.set(level, [])
    toolsWithQualityByLevel.get(level).push(it)
  }
}

let vpartsWithQualityByLevel = new Map<number, VehiclePart[]>()
for (const it of data.byType('vehicle_part')) {
  if (!it.id) continue;
  const q = (it.qualities ?? []).find(([id, _level]) => id === item.id)
  if (q) {
    const [, level] = q
    if (!vpartsWithQualityByLevel.has(level)) vpartsWithQualityByLevel.set(level, [])
    vpartsWithQualityByLevel.get(level).push(it)
  }
}
</script>

<h1>Quality: {singularName(item)}</h1>
{#if item.usages}
<section>
  <h1>Usages</h1>
  <dl>
    {#each item.usages as [level, usages]}
    <dt>At Level {level}</dt>
    <dd>
      <ul class="comma-separated">
        {#each usages as usage}
        <li>{usage}</li>
        {/each}
      </ul>
    </dd>
    {/each}
  </dl>
</section>
{/if}
<section>
  <h1>Tools</h1>
  <dl>
    {#each [...toolsWithQualityByLevel.keys()].sort((a, b) => a - b) as level}
    <dt>Level {level}</dt>
    <dd>
      <ul>
        {#each toolsWithQualityByLevel.get(level).sort((a, b) => singularName(a).localeCompare(singularName(b))) as {id}}
        <li><ThingLink type="item" {id} /></li>
        {/each}
      </ul>
    </dd>
    {/each}
  </dl>
</section>
{#if vpartsWithQualityByLevel.size > 0}
<section>
  <h1>Vehicle Parts</h1>
  <dl>
    {#each [...vpartsWithQualityByLevel.keys()].sort((a, b) => a - b) as level}
    <dt>Level {level}</dt>
    <dd>
      <ul>
        {#each vpartsWithQualityByLevel.get(level).sort((a, b) => singularName(a).localeCompare(singularName(b))) as {id}}
        <li><ThingLink type="vehicle_part" {id} /></li>
        {/each}
      </ul>
    </dd>
    {/each}
  </dl>
</section>
{/if}
