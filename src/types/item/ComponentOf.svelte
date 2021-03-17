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
}).sort((a, b) => singularName(data.byId('item', a.result)).localeCompare(singularName(data.byId('item', b.result))))

let limit = 10
</script>

{#if recipes.length}
<section>
  <h1>Component Of</h1>
  <ul>
    {#each recipes.slice(0, limit) as r}
    <li><ItemSymbol item={data.byId('item', r.result)} /> <ThingLink type="item" id={r.result} /></li>
    {/each}
  </ul>
  {#if recipes.length > limit}
  <button class="disclosure" on:click={(e) => { e.preventDefault(); limit = Infinity }}>See all...</button>
  {/if}
</section>
{/if}
