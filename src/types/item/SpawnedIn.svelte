<script lang="ts">
import { getContext } from "svelte";
import { CddaData, omsName, singularName } from "../../data";
import {
  ItemChance,
  lootByOMSAppearance,
  parseItemGroup,
} from "./spawnLocations";
import { showNumber, showProbability } from "./utils";
import type { OvermapSpecial } from "../../types";
import OvermapAppearance from "./OvermapAppearance.svelte";
import { t } from "@transifex/native";
import LimitedTableList from "../../LimitedTableList.svelte";
import LimitedList from "../../LimitedList.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

const spawnLocationsPromise = lootByOMSAppearance(data).then(
  (lootByAppearance) => {
    const spawnLocations: {
      overmap_special: OvermapSpecial;
      ids: string[];
      chance: ItemChance;
    }[] = [];
    for (const { loot, ids } of lootByAppearance.values()) {
      if (loot.has(item_id)) {
        const chance = loot.get(item_id)!;
        const oms = data.byId("overmap_special", ids[0]);
        spawnLocations.push({ overmap_special: oms, ids, chance });
      }
    }
    spawnLocations.sort((a, b) => b.chance.expected - a.chance.expected);
    return spawnLocations;
  }
);
</script>

{#await spawnLocationsPromise}
  <section>
    <h1>{t("Loot", { _context: "Obtaining" })}</h1>
    <p style="color: var(--cata-color-gray)"><em>Loading...</em></p>
  </section>
{:then spawnLocations}
  {#if spawnLocations.length}
    <section>
      <!--
      <LimitedTableList items={spawnLocations}>
        <tr class="middle" slot="item" let:item={loc}>
          <td style="text-align: center">
            <OvermapAppearance overmapSpecial={loc.overmap_special} />
          </td>
          <td>
            {#if loc.ids.length === 1}
              <a href="/overmap_special/{loc.ids[0]}"
                >{omsName(data, loc.overmap_special)}</a>
            {:else}
              <span title={loc.ids.join(", ")}
                >{omsName(data, loc.overmap_special)}</span>
            {/if}
            ({showProbability(loc.chance.prob)} > 0 / ×{loc.chance.expected.toFixed(2)})
          </td>
        </tr>
      </LimitedTableList>
    -->
      <LimitedTableList items={spawnLocations}>
        <tr slot="header">
          <th colspan="2"><h1>{t("Loot", { _context: "Obatining" })}</h1></th>
          <th style="text-align: right; padding-left: 1em;"
            ><h1>{t("Count")}</h1></th>
          <th style="text-align: right; padding-left: 1em;"
            ><h1>{t("Chance")}</h1></th>
        </tr>
        <tr class="middle" slot="item" let:item={loc}>
          <td
            style="text-align: center; width: 0; padding-left: 0.5em; padding-right: 0.5em;">
            <OvermapAppearance overmapSpecial={loc.overmap_special} />
          </td>
          <td>
            {#if loc.ids.length === 1}
              <a href="/overmap_special/{loc.ids[0]}"
                >{omsName(data, loc.overmap_special)}</a>
            {:else}
              <span title={loc.ids.join(", ")}
                >{omsName(data, loc.overmap_special)}</span>
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
tr:nth-child(even) {
  /*background-color: rgba(255, 255, 255, 0.05);*/
}
td {
  border: 0;
}
</style>
