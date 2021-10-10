<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import { lootByOmSpecial, mergeLoot } from "./spawnLocations";
import LimitedList from "../../LimitedList.svelte";
import { showProbability } from "./utils";
import type { OvermapSpecial } from "../../types";
import OvermapAppearance from "./OvermapAppearance.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

// Showing these is a bit spoilery, and also they are visually large, so hide them.
const hiddenLocations = new Set([
  "Necropolis",
  "Isherwood Farms",
  "lab_mutagen_6_level",
  "Lab_SECURITY_1x1x6",
  "Lab_CARGO_Surface",
]);

const lootByOMS = lootByOmSpecial(data);
const lootByOMSAppearance = new Map<
  string,
  { loot: Map<string, number>; ids: string[] }
>();
for (const [oms_id, loot] of lootByOMS.entries()) {
  if (hiddenLocations.has(oms_id)) continue;
  const appearance = overmapAppearance(data.byId("overmap_special", oms_id));
  if (!lootByOMSAppearance.has(appearance))
    lootByOMSAppearance.set(appearance, { loot: undefined, ids: [] });
  const l = lootByOMSAppearance.get(appearance);
  if (l.loot)
    l.loot = mergeLoot([
      { loot: l.loot, weight: 1 },
      { loot: loot, weight: 1 },
    ]);
  else l.loot = loot;
  l.ids.push(oms_id);
}

const spawnLocations: {
  overmap_special: OvermapSpecial;
  ids: string[];
  chance: number;
}[] = [];
for (const { loot, ids } of lootByOMSAppearance.values()) {
  if (loot.has(item_id)) {
    const chance = loot.get(item_id);
    const oms = data.byId("overmap_special", ids[0]);
    spawnLocations.push({ overmap_special: oms, ids, chance });
  }
}

function overmapAppearance(oms: OvermapSpecial): string {
  const overmaps = [...(oms.overmaps ?? [])];
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  const overmapsByPoint = new Map<string, typeof overmaps[0]>();
  for (const om of overmaps) {
    const omt_id = om.overmap.replace(/_(north|south|east|west)$/, "");
    if (!data.byId("overmap_terrain", omt_id)) continue;
    const [x, y, z] = om.point;
    if (z !== 0) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    overmapsByPoint.set(`${x}|${y}`, om);
  }
  const appearanceComponents: any[] = [maxY - minY, maxX - minX];
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++) {
      const om = overmapsByPoint.get(`${x}|${y}`);
      if (om) {
        const omt_id = om.overmap.replace(/_(north|south|east|west)$/, "");
        const appearance = omtAppearanceString(omt_id);
        appearanceComponents.push(appearance);
      } else {
        appearanceComponents.push("no_om");
      }
    }

  return appearanceComponents.join("\0");

  function omtAppearanceString(omt_id: string): string {
    const omt = data.byId("overmap_terrain", omt_id);
    return omt
      ? `${omt.sym}\u0001${omt.color}\u0001${omt.name}`
      : `appearance_unk`;
  }
}

function omsName(oms: OvermapSpecial): string {
  const ground_level_omts = (oms.overmaps ?? []).filter(
    (p) => p.point[2] === 0
  );
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  const grid = new Map<string, typeof ground_level_omts[0]>();
  for (const omt of ground_level_omts) {
    const [x, y] = omt.point;
    if (
      !data.byId(
        "overmap_terrain",
        omt.overmap.replace(/_(north|south|east|west)$/, "")
      )
    )
      continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    grid.set(`${x}|${y}`, omt);
  }
  const centerX = minX + Math.floor((maxX - minX) / 2);
  const centerY = minY + Math.floor((maxY - minY) / 2);
  const centerOmt = grid.get(`${centerX}|${centerY}`);
  if (centerOmt) {
    const omt = data.byId(
      "overmap_terrain",
      centerOmt.overmap.replace(/_(north|south|east|west)$/, "")
    );
    if (omt) {
      return singularName(omt);
    }
  }
  return oms.id;
}

spawnLocations.sort((a, b) => b.chance - a.chance);

let limit = 10;

let grace = 4;

let realLimit = spawnLocations.length <= limit + grace ? limit + grace : limit;
</script>

{#if spawnLocations.length}
  <section>
    <h1>Loot</h1>
    <table class="alternating">
      <tbody>
        {#each spawnLocations.slice(0, realLimit) as loc}
          <tr>
            <td style="text-align: center">
              <OvermapAppearance overmapSpecial={loc.overmap_special} />
            </td>
            <td style="vertical-align: middle">
              <span title={loc.ids.join(", ")}
                >{omsName(loc.overmap_special)}</span>
              ({showProbability(loc.chance)})
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if spawnLocations.length > realLimit}
      <button
        class="disclosure"
        on:click={(e) => {
          e.preventDefault();
          realLimit = Infinity;
        }}>See all {Number(spawnLocations.length).toLocaleString()}...</button>
    {/if}
  </section>
{/if}
