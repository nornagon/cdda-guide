<script lang="ts">
import { setContext } from "svelte";

import {
  byName,
  CddaData,
  getAllObjectSources,
  singularName,
  translate,
} from "./data";
import LimitedList from "./LimitedList.svelte";
import {
  isItemSubtype,
  type Item,
  type Monster,
  type Mutation,
  type Proficiency,
  type SupportedTypeMapped,
  type SupportedTypesWithMapped,
  type VehiclePart,
} from "./types";
import MutationCategory from "./types/MutationCategory.svelte";
import ThingLink from "./types/ThingLink.svelte";
import ItemSymbol from "./types/item/ItemSymbol.svelte";
import { groupBy } from "./types/item/utils";
import ProficiencyList from "./types/ProficiencyList.svelte";
import OvermapAppearance from "./types/item/OvermapAppearance.svelte";

export let type: string;
export let data: CddaData;
let typeWithCorrectType = type as keyof SupportedTypesWithMapped;
setContext("data", data);

const modFilter = new URLSearchParams(location.search).get("mod");
const things = data
  .byType(type as keyof SupportedTypesWithMapped)
  .filter(
    (o) =>
      "id" in o &&
      o.id &&
      (!modFilter || getAllObjectSources(o).some((m) => m.__mod === modFilter))
  )
  .sort(byName);

// Ref https://github.com/CleverRaven/Cataclysm-DDA/blob/658bbe419fb652086fd4d46bf5bbf9e137228464/src/item_factory.cpp#L4774
function getCategory(i: Item) {
  if (i.category) return i.category.toLowerCase();
  if (isItemSubtype("COMESTIBLE", i))
    return i.comestible_type === "MED" ? "drugs" : "food";
  if (isItemSubtype("GUN", i)) return "guns";
  if (isItemSubtype("MAGAZINE", i)) return "magazines";
  if (isItemSubtype("AMMO", i)) return "ammo";
  if (isItemSubtype("TOOL", i)) return "tools";
  if (isItemSubtype("ARMOR", i)) return "clothing";
  if (isItemSubtype("BOOK", i)) return "books";
  if (isItemSubtype("GUNMOD", i)) return "mods";
  if (isItemSubtype("BIONIC_ITEM", i)) return "bionics";
  const i2 = i as Item & { bashing?: number; cutting?: number };
  if (i2.bashing || i2.cutting) return "weapons";
  return "other";
}

function getCategoryName(category: string) {
  const cat = data.byIdMaybe("ITEM_CATEGORY", category);
  return cat ? singularName(cat) : category;
}

function getProficiencyCategoryName(category_id: string) {
  const cat = data.byIdMaybe("proficiency_category", category_id);
  return cat ? singularName(cat) : category_id;
}

const groupingFn =
  {
    monster: (m: Monster) => [m.default_faction ?? ""],
    item: (i: Item) => [`${i.type} (${getCategoryName(getCategory(i))})`],
    proficiency: (p: Proficiency) => [
      p.category ? getProficiencyCategoryName(p.category) : "",
    ],
    vehicle_part: (vp: VehiclePart) => vp.categories ?? [""],
    mutation: (m: Mutation) => m.category ?? [""],
  }[type] ?? (() => [""]);

const groups = groupBy(
  things,
  groupingFn as (t: SupportedTypeMapped) => string[]
);
const groupsList = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));

const groupFilter = ({
  mutation: (m: Mutation) =>
    !/Fake\d$/.test(m.id) &&
    !m.types?.includes("BACKGROUND_OTHER_SURVIVORS_STORY") &&
    !m.types?.includes("BACKGROUND_SURVIVAL_STORY"),
}[type] ?? (() => true)) as (t: SupportedTypeMapped) => boolean;

function isProficiency(t: SupportedTypeMapped): t is Proficiency {
  return t.type === "proficiency";
}
</script>

<h1>
  {type}
</h1>
{#if modFilter}
  {@const modInfo = data.getModInfo(modFilter)}
  <h2>
    {modInfo ? translate(modInfo.name, false, 1) : modFilter}
  </h2>
{/if}
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
      {#if type === "proficiency"}
        <ProficiencyList proficiencies={group.filter(isProficiency)} />
      {:else}
        <LimitedList
          items={group.filter(groupFilter)}
          let:item
          limit={groupsList.length === 1 ? Infinity : 10}>
          {#if type === "item" || type === "terrain" || type === "furniture" || type === "monster" || type === "vehicle_part"}<ItemSymbol
              {item} />{/if}
          {#if (type === "overmap_special" || type === "city_building") && item.subtype !== "mutable"}
            <OvermapAppearance overmapSpecial={item} />
          {/if}
          <ThingLink type={typeWithCorrectType} id={item.id} />
        </LimitedList>
      {/if}
    </section>
  {/if}
{/each}
