<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { byName, CddaData, i18n } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

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
  .sort(byName);
</script>

{#if constructions.length}
  <section>
    <h1>{t("Construct", { _context: "Obtaining" })}</h1>
    <LimitedList items={constructions} let:item={f}>
      <ThingLink id={f.group} type="construction_group" />
      {#if f.pre_terrain}
        on {#each [f.pre_terrain].flat() as preTerrain, i}
          {@const itemType = preTerrain.startsWith("f_")
            ? "furniture"
            : "terrain"}
          {#if i !== 0}{i18n.__(" OR ")}{/if}
          <ItemSymbol item={data.byId(itemType, preTerrain)} />
          <ThingLink type={itemType} id={preTerrain} />
        {/each}
      {/if}
    </LimitedList>
  </section>
{/if}
