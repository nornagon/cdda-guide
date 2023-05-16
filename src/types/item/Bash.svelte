<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import type { CddaData } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { Terrain, Furniture, VehiclePart } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

let bashFrom = (
  data.bashFromFurniture(item_id) as (Furniture | Terrain | VehiclePart)[]
).concat(data.bashFromTerrain(item_id), data.bashFromVehiclePart(item_id));
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
