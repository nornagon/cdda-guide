<script lang="ts">
import { setContext } from "svelte";

import { byName, CddaData, singularName } from "./data";
import LimitedList from "./LimitedList.svelte";
import type {
  Item,
  Monster,
  Mutation,
  SupportedTypesWithMapped,
  VehiclePart,
} from "./types";
import MutationCategory from "./types/MutationCategory.svelte";
import ThingLink from "./types/ThingLink.svelte";
import ItemSymbol from "./types/item/ItemSymbol.svelte";
import { groupBy } from "./types/item/utils";

export let type: string;
export let data: CddaData;
let typeWithCorrectType = type as keyof SupportedTypesWithMapped;
setContext("data", data);

const things = data
  .byType(type as any)
  .filter((o) => o.id)
  .sort(byName);

// Ref https://github.com/CleverRaven/Cataclysm-DDA/blob/658bbe419fb652086fd4d46bf5bbf9e137228464/src/item_factory.cpp#L4774
function getCategory(i: Item) {
  if (i.category) return i.category.toLowerCase();
  if (i.type === "GUN") return "guns";
  if (i.type === "MAGAZINE") return "magazines";
  if (i.type === "AMMO") return "ammo";
  if (i.type === "TOOL") return "tools";
  if (i.type === "ARMOR") return "clothing";
  if (i.type === "COMESTIBLE")
    return i.comestible_type === "MED" ? "drugs" : "food";
  if (i.type === "BOOK") return "books";
  if (i.type === "GUNMOD") return "mods";
  if (i.type === "BIONIC_ITEM") return "bionics";
  if (i.bashing || i.cutting) return "weapons";
  return "other";
}

function getCategoryName(category: string) {
  return singularName(data.byId("ITEM_CATEGORY", category));
}

const groupingFn =
  {
    monster: (m: Monster) => [m.default_faction ?? ""],
    item: (i: Item) => [`${i.type} (${getCategoryName(getCategory(i))})`],
    vehicle_part: (vp: VehiclePart) => vp.categories ?? [""],
    mutation: (m: Mutation) => m.category ?? [""],
  }[type] ?? (() => [""]);

const groups = groupBy(things, groupingFn);
const groupsList = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));

const groupFilter =
  {
    mutation: (m: Mutation) =>
      !/Fake\d$/.test(m.id) &&
      !m.types?.includes("BACKGROUND_OTHER_SURVIVORS_STORY") &&
      !m.types?.includes("BACKGROUND_SURVIVAL_STORY"),
  }[type] ?? (() => true);
</script>

<h1>{type}</h1>
{#each groupsList as [groupName, group]}
  {#if type === "mutation" && groupName && data.byIdMaybe("mutation_category", groupName)}
    <MutationCategory
      item={data.byId("mutation_category", groupName)}
      inCatalog={true} />
  {:else}
    <section>
      {#if groupName}
        <h1>{groupName}</h1>
      {/if}
      <LimitedList
        items={group.filter(groupFilter)}
        let:item
        limit={groupsList.length === 1 ? Infinity : 10}>
        {#if type === "item" || type === "terrain" || type === "furniture" || type === "monster" || type === "vehicle_part"}<ItemSymbol
            {item} />{/if}
        <ThingLink type={typeWithCorrectType} id={item.id} />
      </LimitedList>
    </section>
  {/if}
{/each}
