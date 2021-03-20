<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import type { Recipe, RequirementData } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string

const data = getContext<CddaData>('data')

const recipes = data.byType<Recipe>('recipe').filter(recipe => {
  if (recipe.type !== 'recipe' || !recipe.result || !data.byId('item', recipe.result)) return false
  const using = typeof recipe.using === 'string' ? [[recipe.using, 1]] as const : recipe.using

  const requirements = ((using ?? [])
    .map(([id, count]) => [data.byId<RequirementData>('requirement', id), count as number] as const)).concat([[recipe, 1] as const])
  const components = requirements.flatMap(([req, count]) =>
    data.flattenRequirement(req.components ?? [], x => x.components).map(x => x.map(x => ({...x, count: x.count * count}))))
  return components.some(c => c.some(d => d.id === item_id))
})
const results = [...new Set(recipes.map(r => r.result))].sort((a, b) => singularName(data.byId('item', a)).localeCompare(singularName(data.byId('item', b))))

let limit = 10
</script>

{#if results.length}
<section>
  <h1>Component Of</h1>
  <ul>
    {#each results.slice(0, limit) as r}
    <li><ItemSymbol item={data.byId('item', r)} /> <ThingLink type="item" id={r} /></li>
    {/each}
  </ul>
  {#if results.length > limit}
  <button class="disclosure" on:click={(e) => { e.preventDefault(); limit = Infinity }}>See all...</button>
  {/if}
</section>
{/if}
