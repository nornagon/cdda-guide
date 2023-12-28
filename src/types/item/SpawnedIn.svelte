<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";
import { lootByOMSAppearance } from "./spawnLocations";
import { t } from "@transifex/native";
import LocationTable from "./LocationTable.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");
</script>

<LocationTable
  id={item_id}
  loots={lootByOMSAppearance(data)}
  heading={t("Loot", { _context: "Obtaining" })} />
