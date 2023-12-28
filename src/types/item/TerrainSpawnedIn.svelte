<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";
import { terrainByOMSAppearance } from "./spawnLocations";
import { t } from "@transifex/native";
import LocationTable from "./LocationTable.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");
</script>

{#await terrainByOMSAppearance(data)}
  <section>
    <h1>{t("Found In", { _context: "Terrain/Furniture Locations" })}</h1>
    <p style="color: var(--cata-color-gray)"><em>Loading...</em></p>
  </section>
{:then loots}
  <LocationTable
    id={item_id}
    {loots}
    heading={t("Found In", { _context: "Terrain/Furniture Locations" })} />
{/await}
