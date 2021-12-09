<script lang="ts">
import { getContext } from "svelte";
import { CddaData, mapType, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { AmmunitionType, Item } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: AmmunitionType;

const data = getContext<CddaData>("data");

const compatible = data.byType("item").flatMap((x) => {
  if (x.type !== "AMMO" || !x.id) return [];
  if (x.ammo_type === item.id) return [x];
  return [];
});
compatible.sort((a, b) => singularName(a).localeCompare(singularName(b)));

const defaultPocketData = {
  pocket_type: "CONTAINER",
  min_item_volume: "0 ml",
  moves: 100,
  fire_protection: false,
  watertight: false,
  airtight: false,
  open_container: false,
  rigid: false,
  holster: false,
};

const usesAmmoType = (w: Item, t: AmmunitionType): boolean => {
  let pockets = (w.pocket_data ?? []).map((pocket) => {
    return { ...defaultPocketData, ...pocket };
  });
  let ammo = pockets.flatMap((pocket) =>
    pocket.pocket_type === "MAGAZINE"
      ? Object.keys(pocket.ammo_restriction ?? {})
      : []
  );
  return ammo.some((a) => a === t.id);
};

const usedBy = data.byType("item").filter((w) => usesAmmoType(w, item));
usedBy.sort((a, b) => singularName(a).localeCompare(singularName(b)));
</script>

<h1>Ammunition Type: {singularName(item)}</h1>
<section>
  <h1>Compatible Variants</h1>
  <ul>
    {#each compatible as ammo}
      <li>
        <ThingLink type="item" id={ammo.id} />
        {#if ammo.id === item.default}(default){/if}
      </li>
    {/each}
  </ul>
</section>

<section>
  <h1>Used By</h1>
  {#if usedBy.length > 0}
    <LimitedList items={usedBy} let:item>
      <ItemSymbol {item} />
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  {:else}
    <p>
      <em style="color: var(--cata-color-gray)">No items use this ammo.</em>
    </p>
  {/if}
</section>
