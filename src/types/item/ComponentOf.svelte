<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { Recipe, RequirementData } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

const { byTool, byComponent } = data.getItemComponents();

const recipes: Set<string> = byComponent.get(item_id) ?? new Set();
const toolRecipes: Set<string> = byTool.get(item_id) ?? new Set();

const results = [...recipes].sort((a, b) =>
  singularName(data.byId("item", a)).localeCompare(
    singularName(data.byId("item", b))
  )
);
const toolResults = [...toolRecipes].sort((a, b) =>
  singularName(data.byId("item", a)).localeCompare(
    singularName(data.byId("item", b))
  )
);
</script>

<div class="side-by-side">
  {#if results.length}
    <section>
      <h1>Component Of</h1>
      <LimitedList items={results} let:item>
        <ItemSymbol item={data.byId("item", item)} />
        <ThingLink type="item" id={item} />
      </LimitedList>
    </section>
  {/if}

  {#if toolResults.length}
    <section>
      <h1>Tool For Crafting</h1>
      <LimitedList items={toolResults} let:item>
        <ItemSymbol item={data.byId("item", item)} />
        <ThingLink type="item" id={item} />
      </LimitedList>
    </section>
  {/if}
</div>
