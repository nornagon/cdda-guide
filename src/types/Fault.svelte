<script lang="ts">
import { flattenRequirement, normalize, singularName } from "../data";
import type { CddaData, Name, Requirement } from "../data"
import ThingLink from "./ThingLink.svelte";
import { getContext } from "svelte";

const data = getContext<CddaData>('data')

type MendingMethod = {
  id: string
  name?: Name
  description?: Name
  success_msg: Name
  time: string // duration
  skills: {id: string, level: number}[]
  requirements: string | Omit<Requirement, 'id' | 'type'>
  turns_into?: string // fault_id
  also_mends?: string // fault_id
}

type Fault = {
  type: 'fault'
  id: string
  name: Name
  description: Name
  
  mending_methods?: MendingMethod[]
  
  flags?: string[]
}
export let item: Fault
  
const mendingMethods = (item.mending_methods ?? []).map(mm => {
  const requirement = typeof mm.requirements === 'string'
    ? data.byId<Requirement>('requirement', mm.requirements)
    : mm.requirements
  const tools = flattenRequirement(data, requirement.tools ?? [], r => r.tools)
  const components = flattenRequirement(data, requirement.components ?? [], r => r.components)
  const qualities = normalize(requirement.qualities ?? []) // TODO: flatten...?
  return { mending_method: mm, tools, components, qualities }
})
</script>

<h1>Fault: {singularName(item)}</h1>

<section>
  <dl>
    <dt>Flags</dt><dd><ul class="comma-separated">{#each item.flags ?? [] as flag}<li>{flag}</li>{:else}<li><em>none</em></li>{/each}</ul></dd>
  </dl>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>

{#if mendingMethods.length}
<h2>Mending Methods</h2>
{/if}

{#each mendingMethods as {tools, components, qualities, mending_method}}
<section>
  <h1>{singularName(mending_method)}</h1>
  <dl>
  <dt>Skills Used</dt>
  <dd>
    {#each mending_method.skills as {id, level}, i}
    <ThingLink type="skill" {id} /> ({level}){#if i === mending_method.skills.length - 2}{' and '}{:else if i !== mending_method.skills.length - 1}{', '}{/if}
    {:else}
    none
    {/each}
  </dd>
  <dt>Time to Complete</dt>
  <dd>{mending_method.time}</dd>
  {#if qualities.length || tools.length}
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
        {#each componentChoices.map(c => ({...c, item: data.byId('item', c.id)})) as {id, item, count}, i}
          {#if i !== 0}{' OR '}{/if}
          <ThingLink {id} {count} type="item" />
        {/each}
      </li>
      {/each}
    </ul>
  </dd>
  {/if}
  {#if mending_method.turns_into}
  <dt>Turns Into</dt>
  <dd><ThingLink type="fault" id={mending_method.turns_into} /></dd>
  {/if}
  </dl>
</section>
{/each}