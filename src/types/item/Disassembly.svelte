<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { Recipe, RequirementData } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

let data = getContext<CddaData>("data");

const uncraftableFromSet = new Set<string>();
for (const recipe of (data.byType("recipe") as Recipe[]).concat(
  data.byType("uncraft")
)) {
  if (recipe.result && (recipe.reversible || recipe.type === "uncraft")) {
    const normalizedUsing = recipe.using
      ? Array.isArray(recipe.using)
        ? recipe.using
        : [[recipe.using, 1] as [string, number]]
      : [];
    const requirements = normalizedUsing
      .map(
        ([id, count]) =>
          [data.byId("requirement", id) as RequirementData, count] as const
      )
      .concat([[recipe, 1]]);
    const components = requirements.flatMap(([req, count]) => {
      return data
        .flattenRequirement(req.components ?? [], (x) => x.components, {
          onlyRecoverable: true,
        })
        .map((x) => x.map((x) => ({ ...x, count: x.count * count })));
    });
    const defaultComponents = components.map((c) => c[0]);
    if (defaultComponents.some((c) => c.id === item_id))
      uncraftableFromSet.add(recipe.result);
  }
}
const uncraftableFrom = [...uncraftableFromSet].sort((a, b) =>
  singularName(data.byId("item", a)).localeCompare(
    singularName(data.byId("item", b))
  )
);
</script>

{#if uncraftableFrom.length}
  <section>
    <h1>Disassemble</h1>
    <LimitedList items={uncraftableFrom} let:item={id}>
      <ItemSymbol item={data.byId("item", id)} />
      <ThingLink type="item" {id} />
    </LimitedList>
  </section>
{/if}
