<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { byName, CddaData, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { WeaponCategory } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: WeaponCategory;

const data = getContext<CddaData>("data");

const itemsInCategory = data
  .byType("item")
  .filter((i) => i.id)
  .filter((i) => (i.weapon_category ?? []).some((c) => c === item.id));
itemsInCategory.sort(byName);

const martialArts = data
  .byType("martial_art")
  .filter((ma) => ma.id)
  .filter((ma) => ma.weapon_category?.some((c) => c === item.id));
martialArts.sort(byName);
</script>

<h1>{t("Weapon Category")}: {singularName(item)}</h1>
<section>
  <h1>{t("Weapons", { _context: "Martial Art" })}</h1>
  {#if itemsInCategory.length}
    <LimitedList items={itemsInCategory} let:item>
      <ItemSymbol {item} />
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  {:else}
    <p style="color: var(--cata-color-gray)">
      {t("There are no weapons in this category.")}
    </p>
  {/if}
</section>

<section>
  <h1>{t("Martial Arts")}</h1>
  {#if martialArts.length}
    <LimitedList items={martialArts} let:item>
      <ItemSymbol {item} />
      <ThingLink type="martial_art" id={item.id} />
    </LimitedList>
  {:else}
    <p style="color: var(--cata-color-gray)">
      {t("There are no martial arts that use this weapon category.")}
    </p>
  {/if}
</section>
