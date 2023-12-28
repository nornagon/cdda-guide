<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";
import { lootByOMSAppearance } from "./spawnLocations";
import { t } from "@transifex/native";
import LocationTable from "./LocationTable.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");
</script>

{#await lootByOMSAppearance(data)}
  <section>
    <h1>{t("Loot", { _context: "Obtaining" })}</h1>
    <p style="color: var(--cata-color-gray)"><em>Loading...</em></p>
  </section>
{:then loots}
  <LocationTable
    id={item_id}
    {loots}
    heading={t("Loot", { _context: "Obtaining" })} />
{/await}
