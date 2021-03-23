<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";

import type { Recipe, RequirementData } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let requirement: RequirementData & {using?: Recipe['using']}

const data = getContext<CddaData>('data')

const using = typeof requirement.using === 'string' ? [[requirement.using, 1]] as const : requirement.using

let requirements = ((using ?? [])
  .map(([id, count]) => [data.byId<RequirementData>('requirement', id), count as number] as const)).concat([[requirement, 1] as const])
  .filter(x => x[0]) // NB. to cope with some data errors in obsolete parts

let tools = requirements.flatMap(([req, count]) =>
  data.flattenRequirement(req.tools ?? [], x => x.tools, {expandSubstitutes: true}).map(x => x.map(x => ({...x, count: x.count * count}))))
let components = requirements.flatMap(([req, count]) =>
  data.flattenRequirement(req.components ?? [], x => x.components).map(x => x.map(x => ({...x, count: x.count * count}))))
let qualities = requirements.flatMap(([req, _count]) =>
  (req.qualities ?? []).map(x => Array.isArray(x) ? x : [x]))
</script>

{#if (qualities ?? []).length || tools.length}
<dt>Tools Required</dt>
<dd>
  <ul>
    {#each qualities ?? [] as qualityChoices}
    <li>
      {#each qualityChoices as quality, i}
      {#if i !== 0}{' OR '}{/if}
      {quality.amount ?? 1} tool{(quality.amount ?? 1) === 1 ? '' : 's'}
      with <ThingLink type="tool_quality" id={quality.id} /> of {quality.level} or more{''
      }{/each}.
    </li>
    {/each}
    {#each tools as toolChoices}
    <li>
      {#each toolChoices as tool, i}
        {#if i !== 0}{' OR '}{/if}
        {#if data.craftingPseudoItem(tool.id)}
        <a href='#/furniture/{data.craftingPseudoItem(tool.id)}'>{singularName(data.byId('item', tool.id))}</a>
        {:else}
        <ThingLink type="item" id={tool.id} />
        {/if}
        {#if tool.count > 0}({tool.count} charge{#if tool.count !== 1}s{/if}){/if}
      {/each}
    </li>
    {/each}
  </ul>
</dd>
{/if}
{#if components.length}
<dt>Components</dt>
<dd>
  <ul>
    {#each components as componentChoices}
    <li>
      {#each componentChoices.map(c => ({...c, item: data.byId('item', c.id)})) as {id, count}, i}
        {#if i !== 0}{' OR '}{/if}
        <ThingLink type="item" {id} {count} />
      {/each}
    </li>
    {/each}
  </ul>
</dd>
{/if}
