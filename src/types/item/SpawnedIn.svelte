<script lang="ts">
  import { getContext } from "svelte";
  import type { CddaData } from "../../data";
  import { getItemSpawnLocations } from "./spawnLocations";
  import { showProbability } from "./utils";

  export let item_id: string;

  const data = getContext<CddaData>("data");
  const spawnLocations = getItemSpawnLocations(data, item_id);
</script>

<section>
  <h1>Loot</h1>
  <ul>
    {#each spawnLocations as loc}
      <li>{loc.singularName} ({showProbability(loc.chance)})</li>
    {/each}
  </ul>
</section>
