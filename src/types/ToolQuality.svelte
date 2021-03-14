<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../data";
import ThingLink from "./ThingLink.svelte";

type ToolQuality = {
  type: "tool_quality"
  id: string
  name: string | { str: string, str_pl?: string } | { str_sp: string }
  usages?: [number, string[]][]
}

export let item: ToolQuality

let data = getContext<CddaData>('data')

let toolsWithQualityByLevel = new Map<number, any>()
for (const it of data.byType('item')) {
  if (it.type !== 'TOOL' && it.type !== 'TOOL_ARMOR') continue
  const q = (it.qualities ?? []).find(([id, level]) => id === item.id)
  if (q) {
    const [, level] = q
    if (!toolsWithQualityByLevel.has(level)) toolsWithQualityByLevel.set(level, [])
    toolsWithQualityByLevel.get(level).push(it)
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