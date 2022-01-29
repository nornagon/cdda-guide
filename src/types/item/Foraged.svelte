<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import FurnitureSymbol from "./FurnitureSymbol.svelte";

export let item_id: string;

let data = getContext<CddaData>("data");
const forageGroups = {
  Spring: "forage_spring",
  Summer: "forage_summer",
  Autumn: "forage_autumn",
  Winter: "forage_winter",
  "any season": "trash_forest",
};

const forageable = Object.keys(forageGroups)
  .map((season) => {
    const flattened = data.flattenItemGroup(
      data.byId("item_group", forageGroups[season])
    );
    return [season, flattened.find((f) => f.id === item_id)?.prob] as const;
  })
  .filter((x) => x[1]);
const forageSources = data
  .byType("terrain")
  .filter((t) => t.examine_action === "shrub_wildveggies");
</script>

{#if forageable.length}
  <section>
    <h1>Forage</h1>
    <LimitedList items={forageSources} let:item>
      <FurnitureSymbol {item} />
      <ThingLink type="terrain" id={item.id} /> in
      <ul class="comma-separated or">
        {#each forageable as [season, prob /* TODO: probability is a bit messy here. */]}
          <li>{season}</li>
        {/each}
      </ul>
    </LimitedList>
  </section>
{/if}
