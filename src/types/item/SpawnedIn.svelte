<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import type { Mapgen } from "../../types";

export let item_id: string

let data = getContext<CddaData>('data')
  
const mapgens = data.byType<Mapgen>('mapgen').filter(mapgen => data.mapgenSpawnItems(mapgen).includes(item_id))
const om_terrains = new Set
for (const mg of mapgens) {
  if (!mg.om_terrain) continue;
  let mg_omts: string[]
  if (typeof mg.om_terrain === 'string') {
    mg_omts = [mg.om_terrain]
  } else if (typeof mg.om_terrain[0] === 'string') {
    mg_omts = mg.om_terrain as string[]
  } else {
    mg_omts = (mg.om_terrain as string[][]).flatMap(t => t)
  }
  const n = (x) => typeof x === 'string' ? [x] : x
  mg_omts.forEach(mo => {
    const omt = data.byId('overmap_terrain', mo)
    // let's keep some things secret :)
    if (omt && omt.id && !n(omt.id).some(x => /necropolis|ranch_camp|robofachq|mapgen-test/.test(x)))
      om_terrains.add(omt)
  })
}
const om_terrains_sorted = [...om_terrains].sort((a, b) => singularName(a).localeCompare(singularName(b)))
let omTerrainLimit = 10
</script>

{#if om_terrains_sorted.length}
<section>
  <h1>Loot</h1>
  <ul>
    {#each om_terrains_sorted.slice(0, omTerrainLimit) as omt}
    <li>
      <span style="font-family: monospace;" class="c_{omt.color}">{omt.sym}</span>
      <span title={omt.id}>{singularName(omt)}</span></li>
    {/each}
  </ul>
  {#if om_terrains_sorted.length > omTerrainLimit}
  <a href="" on:click={(e) => { e.preventDefault(); omTerrainLimit = Infinity }}>See all...</a>
  {/if}
</section>
{/if}