<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";
import { getItemSpawnLocations } from "./spawnLocations";
import LimitedList from "../../LimitedList.svelte";
import { showProbability } from "./utils";

export let item_id: string;

const data = getContext<CddaData>("data");
const spawnLocations = getItemSpawnLocations(data, item_id);
/*
  TODO: sort by spawn chance
  TODO: skip secret locations
  */
</script>

<!-- TODO: {#if spawnLocations.length -->
<section>
  <h1>Loot</h1>
  <LimitedList items={spawnLocations} let:item={loc}>
    <!--TODO
    <span style="font-family: monospace;" class="c_{loc.color}"
      >{loc.sym}</span>
      -->
    <!--TODO<span title={loc.id}>-->
    <span
      >{loc.singularName} ({loc.chance.map(showProbability).join(", ")})</span>
  </LimitedList>
</section>
