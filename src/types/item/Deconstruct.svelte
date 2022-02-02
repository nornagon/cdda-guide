<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { Furniture, Terrain } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

let deconstructibleFrom = (data.byType("terrain") as (Terrain | Furniture)[])
  .concat(data.byType("furniture"))
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

    return deconstruct.some(({ id }) => id === item_id);
  })
  .sort((a, b) => singularName(a).localeCompare(singularName(b)));
</script>

{#if deconstructibleFrom.length}
  <section>
    <h1>Deconstruct</h1>
    <LimitedList items={deconstructibleFrom} let:item={f}>
      <ItemSymbol item={data.byId(f.type, f.id)} />
      <ThingLink id={f.id} type={f.type} />
    </LimitedList>
  </section>
{/if}
