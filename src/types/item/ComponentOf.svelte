<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { Recipe, RequirementData } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

const recipes: Recipe[] = [];
const toolRecipes: Recipe[] = [];

data.byType("recipe").forEach((recipe) => {
  if (!recipe.result || !data.byId("item", recipe.result)) return false;
  const using =
    typeof recipe.using === "string"
      ? ([[recipe.using, 1]] as const)
      : recipe.using;

  const requirements = (using ?? [])
    .map(
      ([id, count]) =>
        [
          data.byId("requirement", id) as RequirementData,
          count as number,
        ] as const
    )
    .concat([[recipe, 1] as const]);
  const tools = requirements.flatMap(([req]) =>
    data.flattenRequirement(req.tools ?? [], (x) => x.tools)
  );
  if (tools.some((c) => c.some((d) => d.id === item_id)))
    toolRecipes.push(recipe);
  const components = requirements.flatMap(([req, count]) =>
    data
      .flattenRequirement(req.components ?? [], (x) => x.components)
      .map((x) => x.map((x) => ({ ...x, count: x.count * count })))
  );
  if (components.some((c) => c.some((d) => d.id === item_id)))
    recipes.push(recipe);
});

const results = [...new Set(recipes.map((r) => r.result))].sort((a, b) =>
  singularName(data.byId("item", a)).localeCompare(
    singularName(data.byId("item", b))
  )
);
const toolResults = [...new Set(toolRecipes.map((r) => r.result))].sort(
  (a, b) =>
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
