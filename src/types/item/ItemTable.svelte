<script lang="ts">
import { getContext } from "svelte";
import LimitedTableList from "../../LimitedTableList.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";
import type { Loot } from "./spawnLocations";
import { showNumber, showProbability } from "./utils";
import type { CddaData } from "../../data";
import { t } from "@transifex/native";
import type { SupportedTypesWithMapped } from "src/types";

export let loot: Loot | Promise<Loot>;
export let type: keyof SupportedTypesWithMapped = "item";
export let heading: string =
  type === "furniture"
    ? t("Furniture", { _context: "Loot Table" })
    : type === "terrain"
    ? t("Terrain", { _context: "Loot Table" })
    : t("Loot", { _context: "Loot Table" });

function stripType(x: any): any {
  return x;
}

const data = getContext<CddaData>("data");
</script>

{#await Promise.resolve(loot)}
  <section>
    <h1>{heading}</h1>
    <p style="color: var(--cata-color-gray)" data-testid="loading-indicator">
      <em>{t("Loading...")}</em>
    </p>
  </section>
{:then loot}
  {#if loot.size}
    {@const sortedLoot = [...loot.entries()].sort((a, b) =>
      (b[1].prob * 100).toFixed(2) === (a[1].prob * 100).toFixed(2)
        ? b[1].expected - a[1].expected
        : b[1].prob - a[1].prob
    )}
    <section>
      <LimitedTableList items={sortedLoot}>
        <tr slot="header">
          <th colspan="2"><h1>{heading}</h1></th>
          <th class="numeric"
            ><h1>
              {t("Avg. Count", {
                _context: "Loot Table",
                _comment:
                  "Column heading in a table: average number of an item found in a location/vehicle, dropped by a monster, etc.",
              })}
            </h1></th>
          <th class="numeric"
            ><h1>
              {t("Chance", {
                _context: "Loot Table",
                _comment:
                  "Column heading in a table: chance that at least one of an item is found in a location/vehicle, dropped by a monster, etc.",
              })}
            </h1></th>
        </tr>
        <tr slot="item" let:item={[item_id, chance]}>
          {@const item = stripType(data.byId(type, item_id))}
          <td>
            <ItemSymbol {item} />
          </td>
          <td style="padding-left: 5px;">
            <ThingLink {type} id={item_id} />
          </td>
          <td class="numeric">{showNumber(chance.expected)}</td>
          <td class="numeric">{showProbability(chance.prob)}</td>
        </tr>
      </LimitedTableList>
    </section>
  {/if}
{/await}

<style>
th,
td {
  padding: 0;
  padding-left: 1em;
  white-space: nowrap;
}
th:first-child,
td:first-child {
  padding-left: 0;
}
td {
  vertical-align: middle;
}
td.numeric,
th.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
