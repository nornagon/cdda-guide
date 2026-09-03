<script lang="ts">
import { byName, mapType } from "./data";
import LimitedList from "./LimitedList.svelte";
import type { SupportedTypeMapped, SupportedTypesWithMapped } from "./types";
import ThingLink from "./types/ThingLink.svelte";
import ItemSymbol from "./types/item/ItemSymbol.svelte";

export let title: string;
export let type: keyof SupportedTypesWithMapped;
export let items: (SupportedTypeMapped & { id: string })[];

$: sortedItems = [...items].sort(byName);
</script>

<section>
  <h1>{title}</h1>
  <LimitedList items={sortedItems} let:item>
    {#if type === "item" || type === "terrain" || type === "furniture" || type === "monster" || type === "vehicle_part"}<ItemSymbol
        {item} />{/if}
    <ThingLink type={mapType(item.type)} id={item.id} />
  </LimitedList>
</section>
