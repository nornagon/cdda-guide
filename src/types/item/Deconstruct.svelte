<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { Furniture } from "../../types";
import ThingLink from "../ThingLink.svelte";
import FurnitureSymbol from "./FurnitureSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

let deconstructibleFrom = data
  .byType<Furniture>("furniture")
  .filter((f) => {
    const deconstruct = f.deconstruct?.items
      ? data.flattenItemGroup({
          subtype: "collection",
          entries: f.deconstruct.items,
        })
      : [];

    const bash = f.bash?.items
      ? data.flattenItemGroup({
          subtype: "collection",
          entries: f.bash.items,
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
