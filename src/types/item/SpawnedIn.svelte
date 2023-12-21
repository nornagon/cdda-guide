<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import { lootByOMSAppearance } from "./spawnLocations";
import { showProbability } from "./utils";
import type { OvermapSpecial } from "../../types";
import OvermapAppearance from "./OvermapAppearance.svelte";
import { t } from "@transifex/native";
import ThingLink from "../ThingLink.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

const spawnLocationsPromise = lootByOMSAppearance(data).then(
  (lootByAppearance) => {
    const spawnLocations: {
      overmap_special: OvermapSpecial;
      ids: string[];
      chance: number;
    }[] = [];
    for (const { loot, ids } of lootByAppearance.values()) {
      if (loot.has(item_id)) {
        const chance = loot.get(item_id)!;
        const oms = data.byId("overmap_special", ids[0]);
        spawnLocations.push({ overmap_special: oms, ids, chance });
      }
    }
    spawnLocations.sort((a, b) => b.chance - a.chance);
    realLimit = spawnLocations.length <= limit + grace ? limit + grace : limit;
    return spawnLocations;
  }
);

function omsName(oms: OvermapSpecial): string {
  if (oms.subtype === "mutable") return oms.id;
  const ground_level_omts = (oms.overmaps ?? []).filter(
    (p) => p.point[2] === 0
  );
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  const grid = new Map<string, (typeof ground_level_omts)[0]>();
  for (const omt of ground_level_omts) {
    const [x, y] = omt.point;
    if (
      !data.byIdMaybe(
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

let limit = 10;

let grace = 4;

let realLimit = 0; // Filled in later
</script>

{#await spawnLocationsPromise}
  <section>
    <h1>{t("Loot", { _context: "Obtaining" })}</h1>
    <p style="color: var(--cata-color-gray)"><em>Loading...</em></p>
  </section>
{:then spawnLocations}
  {#if spawnLocations.length}
    <section>
      <h1>{t("Loot", { _context: "Obtaining" })}</h1>
      <table class="alternating">
        <tbody>
          {#each spawnLocations.slice(0, realLimit) as loc}
            <tr>
              <td style="text-align: center">
                <OvermapAppearance overmapSpecial={loc.overmap_special} />
              </td>
              <td style="vertical-align: middle">
                {#if loc.ids.length === 1}
                  <a href="/overmap_special/{loc.ids[0]}"
                    >{omsName(loc.overmap_special)}</a>
                {:else}
                  <span title={loc.ids.join(", ")}
                    >{omsName(loc.overmap_special)}</span>
                {/if}
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
          }}
          >See all {Number(spawnLocations.length).toLocaleString()}...</button>
      {/if}
    </section>
  {/if}
{/await}
