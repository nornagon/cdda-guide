<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";
import { furnitureByOMSAppearance } from "./spawnLocations";
import { t } from "@transifex/native";
import LocationTable from "./LocationTable.svelte";

  interface Props {
    item_id: string;
  }

  let { item_id }: Props = $props();

const data = getContext<CddaData>("data");
</script>

<LocationTable
  id={item_id}
  loots={furnitureByOMSAppearance(data)}
  heading={t("Found In", { _context: "Terrain/Furniture Locations" })} />
