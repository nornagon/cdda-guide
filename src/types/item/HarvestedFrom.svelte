<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import type { Furniture, Terrain } from "../../types";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

const harvestedFrom = (data.byType("terrain") as (Terrain | Furniture)[])
  .concat(data.byType("furniture"))
  .filter((ter) =>
    (ter.harvest_by_season ?? []).some((h) => {
      const harvest = data.byId("harvest", h.id);
      return harvest.entries.some((e) => {
        if (e.type === "bionic_group") {
          return data
            .flattenItemGroup(data.byId("item_group", e.drop))
            .some((x) => x.id === item_id);
        } else {
          return e.drop === item_id;
        }
      });
    })
  );

harvestedFrom.sort((a, b) => singularName(a).localeCompare(singularName(b)));
</script>

{#if harvestedFrom.length}
  <section>
    <h1>Harvest</h1>
    <LimitedList items={harvestedFrom} let:item>
      <ItemSymbol {item} />
      <ThingLink type={item.type} id={item.id} />
    </LimitedList>
  </section>
{/if}
