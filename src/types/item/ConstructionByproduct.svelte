<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import FurnitureSymbol from "./FurnitureSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

const constructions = data
  .byType("construction")
  .filter((c) => {
    const byproducts = data.flattenItemGroup(
      data.normalizeItemGroup(c.byproducts, "collection")
    );
    return byproducts.some((d) => d.id === item_id);
  })
  .sort((a, b) => singularName(a).localeCompare(singularName(b)));
</script>

{#if constructions.length}
  <section>
    <h1>Construct</h1>
    <LimitedList items={constructions} let:item={f}>
      <ThingLink id={f.group} type="construction_group" />
      {#if f.pre_terrain}
        on <FurnitureSymbol item={data.byId(f.pre_terrain.startsWith("f_") ? "furniture" : "terrain", f.pre_terrain)} />
        <ThingLink type={f.pre_terrain.startsWith("f_") ? "furniture" : "terrain"} id={f.pre_terrain} />
      {/if}
    </LimitedList>
  </section>
{/if}
