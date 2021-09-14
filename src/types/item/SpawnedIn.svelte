<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singular, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { OvermapTerrain } from "../../types";

export let item_id: string;

let data = getContext<CddaData>("data");

const mapgens = data
  .byType("mapgen")
  .filter((mapgen) => data.mapgenSpawnItems(mapgen).includes(item_id));
const om_terrains = new Set<OvermapTerrain>();
for (const mg of mapgens) {
  if (!mg.om_terrain) continue;
  let mg_omts: string[];
  if (typeof mg.om_terrain === "string") {
    mg_omts = [mg.om_terrain];
  } else if (typeof mg.om_terrain[0] === "string") {
    mg_omts = mg.om_terrain as string[];
  } else {
    mg_omts = (mg.om_terrain as string[][]).flatMap((t) => t);
  }
  function n(x: string | string[]): string[] {
    return typeof x === "string" ? [x] : x;
  }
  mg_omts.forEach((mo) => {
    const omt = data.byId("overmap_terrain", mo);
    // let's keep some things secret :)
    if (
      omt &&
      omt.id &&
      !n(omt.id).some((x) =>
        /necropolis|ranch_camp|robofachq|mapgen-test/.test(x)
      )
    )
      om_terrains.add(omt);
  });
}
const om_terrains_sorted = [...om_terrains].sort((a, b) =>
  singular(a.name).localeCompare(singular(b.name))
);
</script>

{#if om_terrains_sorted.length}
  <section>
    <h1>Loot</h1>
    <LimitedList items={om_terrains_sorted} let:item={omt}>
      <span style="font-family: monospace;" class="c_{omt.color}"
        >{omt.sym}</span>
      <span title={omt.id}>{singularName(omt)}</span>
    </LimitedList>
  </section>
{/if}
