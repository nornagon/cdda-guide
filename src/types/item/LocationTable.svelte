<script lang="ts">
import { getContext } from "svelte";
import { CddaData, omsName } from "../../data";
import type { ItemChance, Loot } from "./spawnLocations";
import { showNumber, showProbability } from "./utils";
import type { OvermapSpecial } from "../../types";
import OvermapAppearance from "./OvermapAppearance.svelte";
import { t } from "@transifex/native";
import LimitedTableList from "../../LimitedTableList.svelte";

export let id: string;
export let loots: Promise<Map<string, { loot: Loot; ids: string[] }>>;
export let heading: string;

const data = getContext<CddaData>("data");

function filterLocations(
  lootByAppearance: Map<string, { loot: Loot; ids: string[] }>,
  id: string
): { overmap_special: OvermapSpecial; ids: string[]; chance: ItemChance }[] {
  const spawnLocations: {
    overmap_special: OvermapSpecial;
    ids: string[];
    chance: ItemChance;
  }[] = [];
  for (const { loot, ids } of lootByAppearance.values()) {
    if (loot.has(id)) {
      const chance = loot.get(id)!;
      const oms = data.byId("overmap_special", ids[0]);
      spawnLocations.push({ overmap_special: oms, ids, chance });
    }
  }
  spawnLocations.sort((a, b) =>
    Math.abs(b.chance.prob - a.chance.prob) * 100 < 0.005
      ? b.chance.expected - a.chance.expected
      : b.chance.prob - a.chance.prob
  );
  return spawnLocations;
}
</script>

{#await loots}
  <section>
    <h1>{heading}</h1>
    <p style="color: var(--cata-color-gray)"><em>{t("Loading...")}</em></p>
  </section>
{:then spawnLocationsUnfiltered}
  {@const spawnLocations = filterLocations(spawnLocationsUnfiltered, id)}
  {#if spawnLocations.length}
    <section>
      <LimitedTableList items={spawnLocations}>
        <tr slot="header">
          <th colspan="2"><h1>{heading}</h1></th>
          <th style="text-align: right; padding-left: 1em;"
            ><h1>{t("Avg. Count", { _context: "Obtaining" })}</h1></th>
          <th style="text-align: right; padding-left: 1em;"
            ><h1>{t("Chance", { _context: "Obtaining" })}</h1></th>
        </tr>
        <tr class="middle" slot="item" let:item={loc}>
          <td
            style="text-align: center; width: 0; padding-left: 0.5em; padding-right: 0.5em;">
            <OvermapAppearance overmapSpecial={loc.overmap_special} />
          </td>
          <td>
            <a href="/overmap_special/{loc.ids[0]}"
              >{omsName(data, loc.overmap_special)}</a>
            {#if loc.ids.length > 1}
              {t("({n} variants)", { n: loc.ids.length })}
            {/if}
          </td>
          <td style="text-align: right; padding-left: 1em;"
            >{showNumber(loc.chance.expected)}</td>
          <td style="text-align: right; padding-left: 1em;"
            >{showProbability(loc.chance.prob)}</td>
        </tr>
      </LimitedTableList>
    </section>
  {/if}
{/await}

<style>
tr.middle td {
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
}
</style>
