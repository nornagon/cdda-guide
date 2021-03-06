<script lang="ts">
  import { getContext } from 'svelte';

  import { singularName, pluralName, CddaData } from '../data'
  let data = getContext<CddaData>('data')

  export let recipe: any
  
  type OneRequirement = [string, number] | [string, number, "LIST"]
  type RequirementChoices = OneRequirement[]
  type Requirement = RequirementChoices[]
  
  function flattenChoices(choices: RequirementChoices, get: (x: any) => Requirement): {id: string, count: number}[] {
    const flatChoices = []
    for (const choice of choices) {
      const [id, count, isList] = choice
      if (isList === 'LIST') {
        const otherRequirement = data.byId('requirement', id)
        if (otherRequirement.type !== 'requirement') {
          console.error(`Expected a requirement, got ${otherRequirement.type} (id=${otherRequirement.id})`)
        }
        const otherRequirementTools = get(otherRequirement) ?? []
        const otherRequirementChoices = otherRequirementTools[0] // only take the first
        flatChoices.push(...flattenChoices(otherRequirementChoices, get).map(x => ({...x, count: x.count * count})))
      } else {
        flatChoices.push({id, count})
      }
    }
    return flatChoices
  }
  
  function expandSubstitutes(r: {id: string, count: number}): {id: string, count: number}[] {
    const replacements = data.replacementTools(r.id)
    return [r, ...replacements.map(o => ({id: o, count: r.count}))]
  }
  
  function flattenRequirement(required: Requirement, get: (x: any) => Requirement) {
    return required.map(x => flattenChoices(x, get)).map(x => x.flatMap(expandSubstitutes)).filter(x => x.length)
  }
  
  let requirements = ((recipe.using ?? [])
    .map(([id, count]) => [data.byId('requirement', id), count])).concat([[recipe, 1]])
  
  let tools: any[][] = requirements.flatMap(([req, count]) => {
    return flattenRequirement(req.tools ?? [], x => x.tools).map(x => x.map(x => ({...x, count: x.count * count})))
  })
  let components = requirements.flatMap(([req, count]) => {
    return flattenRequirement(req.components ?? [], x => x.components).map(x => x.map(x => ({...x, count: x.count * count})))
  })
  let qualities: any[] = requirements.flatMap(([req, count]) => {
    return (req.qualities ?? []).map(x => Array.isArray(x) ? x : [x])
  })

  //let tools = flattenRequirement(recipe.tools ?? [], x => x.tools)
  //let components = flattenRequirement(recipe.components ?? [], x => x.components)
  
  function normalizeSkillsRequired(skills_required: [string, number] | [string, number][] | undefined): [string, number][] {
    if (skills_required === undefined) return []
    if (skills_required.length === 0) return []
    if (Array.isArray(skills_required[0]))
      return skills_required as [string, number][]
    return [skills_required as [string, number]]
  }
  
  let skillsRequired = normalizeSkillsRequired(recipe.skills_required)
  
  const countsByCharges = (item): boolean => {
    return item.type === 'AMMO' || item.type === 'COMESTIBLE' || item.stackable;
  }
</script>

<section class="recipe">
<dl>
  <dt>Primary skill</dt>
  <dd>
    {#if recipe.skill_used}
    <a href="#/skill/{recipe.skill_used}">{singularName(data.byId('skill', recipe.skill_used))}</a> ({recipe.difficulty ?? 0})
    {:else}
    none
    {/if}
  </dd>
  {#if skillsRequired.length}
  <dt>Other skills</dt>
  <dd>
    {#each skillsRequired as [skill, level], i}
    <a href="#/skill/{skill}">{singularName(data.byId('skill', skill))}</a> ({level}){#if i === skillsRequired.length - 2}{' and '}{:else if i !== skillsRequired.length - 1}{', '}{/if}
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
    <li><a href="#/proficiency/{prof.proficiency}">{singularName(data.byId('proficiency', prof.proficiency))}</a></li>
    {/each}
    </ul>
  </dd>
  {/if}
  <dt>Time to complete</dt>
  <dd>{recipe.time}</dd>
  {#if recipe.charges}
  <dt>Recipe makes</dt>
  <dd>{recipe.charges}<!-- TODO: properly switch on result type --></dd>
  {/if}
  {#if (qualities ?? []).length || tools.length}
  <dt>Tools required</dt>
  <dd>
    <ul>
      {#each qualities ?? [] as qualityChoices}
      <li>
        {#each qualityChoices as quality, i}
        {#if i !== 0}{' OR '}{/if}
        {quality.amount ?? 1} tool{(quality.amount ?? 1) === 1 ? '' : 's'} with <a href="#/tool_quality/{quality.id}">{singularName(data.byId('tool_quality', quality.id))}</a> of {quality.level} or more{
        ''}{/each}.
      </li>
      {/each}
      {#each tools as toolChoices}
      <li>
        {#each toolChoices as tool, i}
          {#if i !== 0}{' OR '}{/if}
          {#if data.craftingPseudoItem(tool.id)}
          <a href='#/furniture/{data.craftingPseudoItem(tool.id)}'>{singularName(data.byId('item', tool.id))}</a>
          {:else}
          <a href='#/item/{tool.id}'>{singularName(data.byId('item', tool.id))}</a>
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
          {#if !countsByCharges(item)}{count}{/if}
          <a href='#/item/{id}'>{count === 1 || countsByCharges(item) ? singularName(item) : pluralName(item)}</a>
          {#if countsByCharges(item)}({count}){/if}
        {/each}
      </li>
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

<style>
  ul {
    margin: 0;
    padding-left: 1em;
  }
</style>