<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import type { CddaData } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import Recipe from "../Recipe.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

let data = getContext<CddaData>("data");

const nonAbstractRecipes = data
  .byType("recipe")
  .filter((r) => r.result && !r.obsolete);

let recipes = nonAbstractRecipes.filter((x) => x.result === item_id);

const byproducts = nonAbstractRecipes.filter((x) =>
  (x.byproducts ?? []).some((b) => b[0] === item_id)
);
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
