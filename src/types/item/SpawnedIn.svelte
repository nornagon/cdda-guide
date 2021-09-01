<script lang="ts">
  import { getContext } from "svelte";
  import { CddaData, getItemSpawnLocations } from "../../data";
  import { showProbability } from "./utils.ts";

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
