<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type {
  Terrain,
  Furniture,
  ItemGroupData,
  VehiclePart,
} from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

const byName = (a: any, b: any) =>
  singularName(a).localeCompare(singularName(b));
let bashFromFurnitureOrTerrain = (
  data.byType("terrain") as (Terrain | Furniture)[]
)
  .concat(data.byType("furniture"))
  .filter((f) => {
    const bash = f.bash?.items
      ? data.flattenItemGroup({
          subtype: "collection",
          entries:
            typeof f.bash.items === "string"
              ? [{ group: f.bash.items }]
              : f.bash.items,
        })
      : [];

    return bash.some(({ id }) => id === item_id);
  })
  .sort(byName);

let bashFromVP = data
  .byType("vehicle_part")
  .filter((vp) => {
    if (!vp.id) return;
    const breaksIntoGroup: ItemGroupData | null =
      typeof vp.breaks_into === "string"
        ? data.convertTopLevelItemGroup(data.byId("item_group", vp.breaks_into))
        : Array.isArray(vp.breaks_into)
        ? { subtype: "collection", entries: vp.breaks_into }
        : vp.breaks_into
        ? vp.breaks_into
        : null;
    const breaksIntoGroupFlattened =
      breaksIntoGroup && data.flattenItemGroup(breaksIntoGroup);
    return breaksIntoGroupFlattened?.some((v) => v.id === item_id);
  })
  .sort(byName);

let bashFrom = (
  bashFromFurnitureOrTerrain as (Furniture | Terrain | VehiclePart)[]
).concat(bashFromVP);
</script>

{#if bashFrom.length}
  <section>
    <h1>{t("Bash", { _context: "Obtaining" })}</h1>
    <LimitedList items={bashFrom} let:item={f}>
      <ItemSymbol item={data.byId(f.type, f.id)} />
      <ThingLink id={f.id} type={f.type} />
      {#if f.bash?.str_min}
        <span style="color: var(--cata-color-gray)">
          (≥ {f.bash.str_min} STR)
        </span>
      {/if}
    </LimitedList>
  </section>
{/if}
