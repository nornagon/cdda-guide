<script lang="ts">
  import { data, singularName } from '../data'

  export let recipe: any
  
  type OneRequirement = [string, number] | [string, number, "LIST"]
  type RequirementChoices = OneRequirement[]
  type Requirement = RequirementChoices[]
  
  function flattenChoices(choices: RequirementChoices): {id: string, count: number}[] {
    const flatChoices = []
    for (const choice of choices) {
      const [id, count, isList] = choice
      if (isList) {
        const otherRequirement = $data.byId('requirement', id)
        if (otherRequirement.type !== 'requirement') {
          console.error(`Expected a requirement, got ${otherRequirement.type} (id=${otherRequirement.id})`)
        }
        const otherRequirementTools = otherRequirement.tools ?? []
        const otherRequirementChoices = otherRequirementTools[0] // only take the first
        flatChoices.push(...flattenChoices(otherRequirementChoices))
      } else {
        flatChoices.push({id, count})
      }
    }
    return flatChoices
  }
  
  function expandSubstitutes(r: {id: string, count: number}): {id: string, count: number}[] {
    const replacements = $data.replacementTools(r.id)
    return [r, ...replacements.map(o => ({id: o, count: r.count}))]
  }
  
  function flattenRequirement(required: Requirement) {
    return required.map(flattenChoices).map(x => x.flatMap(expandSubstitutes)).filter(x => x.length)
  }
  
  let result = $data.byId('item', recipe.result)
  let tools = flattenRequirement(recipe.tools ?? [])
  
  function normalizeSkillsRequired(skills_required: [string, number] | [string, number][] | undefined): [string, number][] {
    if (skills_required === undefined) return []
    if (Array.isArray(typeof skills_required[0]))
      return skills_required as [string, number][]
    return [skills_required as [string, number]]
  }
  
  let skillsRequired = normalizeSkillsRequired(recipe.skills_required)
</script>
<dl>
  <dt>Primary skill:</dt>
  <dd><a href="#/skill/{recipe.skill_used}">{recipe.skill_used}</a> ({recipe.difficulty ?? 0})</dd>
  <dt>Other skills:</dt>
  <dd>
    {#each skillsRequired as [skill, level], i}
    <a href="#/skill/{skill}">{skill}</a> ({level}){#if i === skillsRequired.length - 2}{' and '}{:else if i !== skillsRequired.length - 1}{', '}{/if}
    {:else}
    none
    {/each}
  </dd>
  <dt>Time to complete:</dt>
  <dd>{recipe.time}</dd>
  <dt>Recipe makes:</dt>
  <dd>{recipe.charges ?? result.initial_charges ?? result.count ?? result.charges}<!-- TODO: properly switch on result type --></dd>
  <dt>Tools required:</dt>
  <dd>
    <ul>
      {#each recipe.qualities ?? [] as quality}
        <li>{quality.amount ?? 1} tool{(quality.amount ?? 1) === 1 ? '' : 's'} with <a href="#/tool_quality/{quality.id}">{singularName($data.byId('tool_quality', quality.id))}</a> of {quality.level} or more.</li>
      {/each}
      {#each tools as toolChoices}
      <li>
        {#each toolChoices as tool, i}
          {#if i !== 0}{' OR '}{/if}
          {#if $data.craftingPseudoItem(tool.id)}
          <a href='#/furniture/{$data.craftingPseudoItem(tool.id)}'>{singularName($data.byId('item', tool.id))}</a>
          {:else}
          <a href='#/item/{tool.id}'>{singularName($data.byId('item', tool.id))}</a>
          {/if}
          {#if tool.count > 0}({tool.count} charge{#if tool.count !== 1}s{/if}){/if}
        {/each}
      </li>
      {/each}
    </ul>
  </dd>
</dl>
<pre>{JSON.stringify(recipe, null, 2)}</pre>