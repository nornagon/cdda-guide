<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";

export let item_id: string;

let data = getContext<CddaData>("data");

const salvagedFromMaterials = data
  .byType("material")
  .filter((mat) => mat.salvaged_into === item_id);
</script>

{#if salvagedFromMaterials.length}
  <section>
    <h1>Salvage</h1>
    <LimitedList items={salvagedFromMaterials} let:item>
      <ThingLink type="material" id={item.id} />
    </LimitedList>
  </section>
{/if}
