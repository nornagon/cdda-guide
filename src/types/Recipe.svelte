<script lang="ts">
  import { getContext } from 'svelte';

  import { singularName, CddaData } from '../data'
  import type { Recipe, RequirementData } from '../types';
  import ThingLink from './ThingLink.svelte';
  let data = getContext<CddaData>('data')

  export let recipe: Recipe
  
  const using = typeof recipe.using === 'string' ? [[recipe.using, 1]] as const : recipe.using
  
  let requirements = ((using ?? [])
    .map(([id, count]) => [data.byId<RequirementData>('requirement', id), count] as const)).concat([[recipe, 1] as const])
  
  let tools = requirements.flatMap(([req, count]) => {
    return data.flattenRequirement(req.tools ?? [], x => x.tools).map(x => x.map(x => ({...x, count: x.count * count})))
  })
  let components = requirements.flatMap(([req, count]) => {
    return data.flattenRequirement(req.components ?? [], x => x.components).map(x => x.map(x => ({...x, count: x.count * count})))
  })
  let qualities = requirements.flatMap(([req, count]) => {
    return (req.qualities ?? []).map(x => Array.isArray(x) ? x : [x])
  })

  function normalizeSkillsRequired(skills_required: [string, number] | [string, number][] | undefined): [string, number][] {
    if (skills_required === undefined) return []
    if (skills_required.length === 0) return []
    if (Array.isArray(skills_required[0]))
      return skills_required as [string, number][]
    return [skills_required as [string, number]]
  }
  
  let skillsRequired = normalizeSkillsRequired(recipe.skills_required)
  
  const writtenIn = Array.isArray(recipe.book_learn)
    ? [...recipe.book_learn]
    : [...Object.entries((recipe.book_learn ?? {}) as Record<string, any>)].map(([k, v]) => [k, v.skill_level])
  writtenIn.sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0))
  
</script>

<section class="recipe">
<h1>Craft</h1>
<dl>
  <dt>Primary Skill</dt>
  <dd>
    {#if recipe.skill_used}
    <ThingLink type="skill" id={recipe.skill_used} /> ({recipe.difficulty ?? 0})
    {:else}
    none
    {/if}
  </dd>
  {#if skillsRequired.length}
  <dt>Other Skills</dt>
  <dd>
    {#each skillsRequired as [skill, level], i}
    <ThingLink type="skill" id={skill} /> ({level}){#if i === skillsRequired.length - 2}{' and '}{:else if i !== skillsRequired.length - 1}{', '}{/if}
    {:else}
    none
    {/each}
  </dd>
  {/if}
  {#if recipe.proficiencies}
  <dt>Proficiencies</dt>
  <dd>
    <ul>
    {#each recipe.proficiencies ?? [] as prof}
    <li><ThingLink type="proficiency" id={prof.proficiency} /></li>
    {/each}
    </ul>
  </dd>
  {/if}
  <dt>Time to Complete</dt>
  <dd>{recipe.time ?? '0 m'}</dd>
  <dt>Batch Time Savings</dt>
  <dd>
    {#if recipe.batch_time_factors}
    {recipe.batch_time_factors[0]}% at >{recipe.batch_time_factors[1]} unit{recipe.batch_time_factors[1] === 1 ? '' : 's'}
    {:else}
    <em>none</em>
    {/if}
  </dd>
  {#if recipe.charges}
  <dt>Recipe Makes</dt>
  <dd>{recipe.charges}<!-- TODO: properly switch on result type --></dd>
  {/if}
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
        {#each componentChoices.map(c => ({...c, item: data.byId('item', c.id)})) as {id, item, count}, i}
          {#if i !== 0}{' OR '}{/if}
          <ThingLink type="item" {id} {count} />
        {/each}
      </li>
      {/each}
    </ul>
  </dd>
  {/if}
  {#if recipe.byproducts?.length}
  <dt>Byproducts</dt>
  <dd>
    <ul>
      {#each recipe.byproducts as c}
      <li><ThingLink type="item" id={c[0]} count={c[1] ?? 1} /></li>
      {/each}
    </ul>
  </dd>
  {/if}
  {#if writtenIn.length}
  <dt>Written In</dt>
  <dd>
    <ul class="comma-separated">
      {#each writtenIn as [item_id, level = 0]}
      <li><span style="white-space: nowrap"><ThingLink id={item_id} type="item" /> ({level})</span></li>
      {/each}
    </ul>
  </dd>
  {/if}
</dl>
<details>
<summary>Recipe JSON</summary>
<pre>{JSON.stringify(recipe, null, 2)}</pre>
</details>
</section>