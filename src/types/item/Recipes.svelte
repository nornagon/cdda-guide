<script context="module" lang="ts">
import type { Recipe as RecipeType } from "../../types";

// Lazily compute the recipe index for each loaded data snapshot.
const recipeIndexes = new WeakMap<CddaData, Record<string, RecipeType[]>>();
function getRecipeIndex(data: CddaData) {
  let recipeIndex = recipeIndexes.get(data);
  if (!recipeIndex) {
    recipeIndex = {};
    for (const recipe of data.byType("recipe")) {
      if (recipe.result && !recipe.obsolete) {
        if (!recipeIndex[recipe.result]) {
          recipeIndex[recipe.result] = [];
        }
        recipeIndex[recipe.result].push(recipe);
      }
    }
    recipeIndexes.set(data, recipeIndex);
  }
  return recipeIndex;
}

// And the byproducts index.
const byproductsIndexes = new WeakMap<CddaData, Record<string, RecipeType[]>>();
function getByproductsIndex(data: CddaData) {
  let byproductsIndex = byproductsIndexes.get(data);
  if (!byproductsIndex) {
    byproductsIndex = {};
    for (const recipe of data.byType("recipe")) {
      if (recipe.result) {
        for (const byproduct of recipe.byproducts ?? []) {
          if (!byproductsIndex[byproduct[0]]) {
            byproductsIndex[byproduct[0]] = [];
          }
          byproductsIndex[byproduct[0]].push(recipe);
        }
      }
    }
    // Sort byproducts by result name.
    for (const byproducts of Object.values(byproductsIndex)) {
      byproducts.sort((a, b) => {
        const aResult = data.byId("item", a.result!);
        const bResult = data.byId("item", b.result!);
        return singularName(aResult).localeCompare(singularName(bResult));
      });
    }
    byproductsIndexes.set(data, byproductsIndex);
  }
  return byproductsIndex;
}
</script>

<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import Recipe from "../Recipe.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

let data = getContext<CddaData>("data");

const recipes = getRecipeIndex(data)[item_id] ?? [];
recipes.sort(
  (a, b) =>
    ((a.never_learn ?? false) as unknown as number) -
    ((b.never_learn ?? false) as unknown as number),
);

const byproducts = getByproductsIndex(data)[item_id] ?? [];
</script>

{#if recipes.length}
  {#each recipes as recipe (recipe)}
    <Recipe {recipe} showResult={recipe.result !== item_id} />
  {/each}
{/if}

{#if byproducts.length}
  <section>
    <h1>{t("Byproduct when crafting", { _context: "Obtaining" })}</h1>
    <LimitedList items={byproducts} let:item>
      <ItemSymbol item={data.byId("item", item.result)} />
      <ThingLink type="item" id={item.result} />
    </LimitedList>
  </section>
{/if}
