<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import type { Recipe, RequirementData } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let item_id: string

let data = getContext<CddaData>('data')
const uncraftableFromSet = new Set<string>()
for (const recipe of data.byType<Recipe>('recipe')) {
  if (recipe.result && (recipe.reversible || recipe.type === 'uncraft')) {
    const normalizedUsing = recipe.using ? Array.isArray(recipe.using) ? recipe.using : [[recipe.using, 1] as [string, number]] : []
    const requirements = (normalizedUsing
      .map(([id, count]) => [data.byId<RequirementData>('requirement', id), count] as const)).concat([[recipe, 1]])
    const components = requirements.flatMap(([req, count]) => {
      return data.flattenRequirement(req.components ?? [], x => x.components).map(x => x.map(x => ({...x, count: x.count * count})))
    })
    const defaultComponents = components.map(c => c[0])
    if (defaultComponents.some(c => c.id === item_id))
      uncraftableFromSet.add(recipe.result)
  }
}
const uncraftableFrom = [...uncraftableFromSet].sort((a, b) => singularName(data.byId('item', a)).localeCompare(singularName(data.byId('item', b))))
  
let uncraftLimit = 10
</script>

{#if uncraftableFrom.length}
<section>
  <h1>Disassemble</h1>
  <ul>
    {#each uncraftableFrom.slice(0, uncraftLimit) as id}
    <li><ThingLink {id} type="item" /></li>
    {/each}
  </ul>
  {#if uncraftableFrom.length > uncraftLimit}
  <a href="" on:click={(e) => { e.preventDefault(); uncraftLimit = Infinity }}>See all...</a>
  {/if}
</section>
{/if}