<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { WeaponCategory } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: WeaponCategory;

const data = getContext<CddaData>("data");

const itemsInCategory = data
  .byType("item")
  .filter((i) => (i.weapon_category ?? []).some((i) => i === item.id));
itemsInCategory.sort((a, b) => singularName(a).localeCompare(singularName(b)));

const martialArts = data
  .byType("martial_art")
  .filter((ma) => ma.weapon_category?.some((i) => i === item.id));
martialArts.sort((a, b) => singularName(a).localeCompare(singularName(b)));
</script>

<h1>Weapon Category: {singularName(item)}</h1>
<section>
  <h1>Weapons</h1>
  {#if itemsInCategory.length}
    <LimitedList items={itemsInCategory} let:item>
      <ItemSymbol {item} />
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  {:else}
    <p style="color: var(--cata-color-gray)">
      There are no weapons in this category.
    </p>
  {/if}
</section>

<section>
  <h1>Martial Arts</h1>
  {#if martialArts.length}
    <LimitedList items={martialArts} let:item>
      <ItemSymbol {item} />
      <ThingLink type="martial_art" id={item.id} />
    </LimitedList>
  {:else}
    <p style="color: var(--cata-color-gray)">
      There are no martial arts that use this weapon category.
    </p>
  {/if}
</section>
