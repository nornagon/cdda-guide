<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import FurnitureSymbol from "./FurnitureSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

let deconstructibleFrom = data
  .byType("furniture")
  .filter((f) => {
    const deconstruct = f.deconstruct?.items
      ? data.flattenItemGroup({
          subtype: "collection",
          entries:
            typeof f.deconstruct.items === "string"
              ? [{ group: f.deconstruct.items }]
              : f.deconstruct.items,
        })
      : [];

    const bash = f.bash?.items
      ? data.flattenItemGroup({
          subtype: "collection",
          entries:
            typeof f.bash.items === "string"
              ? [{ group: f.bash.items }]
              : f.bash.items,
        })
      : [];

    return (
      deconstruct.some(({ id }) => id === item_id) ||
      bash.some(({ id }) => id === item_id)
    );
  })
  .sort((a, b) => singularName(a).localeCompare(singularName(b)));
</script>

{#if deconstructibleFrom.length}
  <section>
    <h1>Deconstruct</h1>
    <LimitedList items={deconstructibleFrom} let:item={f}>
      <FurnitureSymbol item={data.byId("furniture", f.id)} />
      <ThingLink id={f.id} type="furniture" />
    </LimitedList>
  </section>
{/if}
