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

export let loot: Loot;
export let type: keyof SupportedTypesWithMapped = "item";
export let heading: string =
  type === "furniture"
    ? t("Furniture")
    : type === "terrain"
    ? t("Terrain")
    : t("Loot");

function stripType(x: any): any {
  return x;
}

const data = getContext<CddaData>("data");
</script>

{#if loot.size}
  {@const sortedLoot = [...loot.entries()].sort((a, b) =>
    Math.abs(b[1].prob - a[1].prob) * 100 < 0.005
      ? b[1].expected - a[1].expected
      : b[1].prob - a[1].prob
  )}
  <section>
    <LimitedTableList items={sortedLoot}>
      <tr slot="header">
        <th colspan="2"><h1>{heading}</h1></th>
        <th class="numeric"><h1>{t("Avg. Count")}</h1></th>
        <th class="numeric"><h1>{t("Chance")}</h1></th>
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
