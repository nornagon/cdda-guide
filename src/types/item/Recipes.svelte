<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";
import Recipe from "../Recipe.svelte";

export let item_id: string;

let data = getContext<CddaData>("data");

let recipes = data
  .byType("recipe")
  .filter(
    (x) =>
      (x.result === item_id ||
        (x.byproducts ?? []).some((b) => b[0] === item_id)) &&
      !x.obsolete
  )
  .sort((a, b) => {
    const aScore = a.result === item_id ? 0 : 1;
    const bScore = b.result === item_id ? 0 : 1;
    return aScore - bScore;
  });
</script>

{#if recipes.length}
  {#each recipes as recipe (recipe)}
    <Recipe {recipe} showResult={recipe.result !== item_id} />
  {/each}
{/if}
