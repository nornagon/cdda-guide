<script lang="ts">
import { getContext } from "svelte";
import { CddaData, omsName, singularName } from "../../data";
import {
  ItemChance,
  lootByOMSAppearance,
  parseItemGroup,
} from "./spawnLocations";
import { showProbability } from "./utils";
import type { OvermapSpecial } from "../../types";
import OvermapAppearance from "./OvermapAppearance.svelte";
import { t } from "@transifex/native";
import LimitedTableList from "../../LimitedTableList.svelte";

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
      <h1>{t("Loot", { _context: "Obtaining" })}</h1>
      <LimitedTableList items={spawnLocations} let:item={loc}>
        <td style="text-align: center">
          <OvermapAppearance overmapSpecial={loc.overmap_special} />
        </td>
        <td style="vertical-align: middle">
          {#if loc.ids.length === 1}
            <a href="/overmap_special/{loc.ids[0]}"
              >{omsName(data, loc.overmap_special)}</a>
          {:else}
            <span title={loc.ids.join(", ")}
              >{omsName(data, loc.overmap_special)}</span>
          {/if}
          ({showProbability(loc.chance.prob)} / {loc.chance.expected.toFixed(
            2
          )})
        </td>
      </LimitedTableList>
    </section>
  {/if}
{/await}
