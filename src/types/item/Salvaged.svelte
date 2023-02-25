<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { byName, CddaData, parseMass } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { Item, Material } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

let data = getContext<CddaData>("data");

const item = data.byId("item", item_id);

function itemsWithOnlyMaterial(soughtMat: Material): Item[] {
  return data
    .byType("item")
    .filter((it) => it.id)
    .filter((it) => {
      const mat =
        typeof it.material === "string" ? [it.material] : it.material ?? [];
      return mat.length === 1 && mat[0] === soughtMat.id;
    });
}

const salvagedFromMaterials = data
  .byType("material")
  .filter((m) => m.id)
  .filter((mat) => mat.salvaged_into === item_id)
  .flatMap((mat) => itemsWithOnlyMaterial(mat))
  .filter((it) => !(it.flags ?? []).includes("NO_SALVAGE"))
  .filter((it) => parseMass(it.weight) >= parseMass(item.weight))
  .sort(byName);
</script>

{#if salvagedFromMaterials.length}
  <section>
    <h1>{t("Salvage", { _context: "Obtaining" })}</h1>
    <LimitedList items={salvagedFromMaterials} let:item>
      <ItemSymbol {item} />
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  </section>
{/if}
