<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import type { CddaData } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { Harvest } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";
import ItemTable from "./ItemTable.svelte";

export let item_id: string;

let data = getContext<CddaData>("data");
const mons = new Map(
  data.byType("monster").flatMap((mon) => {
    if (!mon.id) return [];
    const deathDrops = data.flatDeathDrops(mon.id);
    const dd = deathDrops.get(item_id);
    if (dd) return [[mon.id, { prob: dd.prob, expected: dd.expected }]];
    return [];
  })
);

const itemsFromHarvest = (h: Harvest): string[] =>
  h.entries?.flatMap((e) =>
    e.type && data.byIdMaybe("harvest_drop_type", e.type)?.group
      ? data
          .flattenTopLevelItemGroup(data.byId("item_group", e.drop))
          .map((x) => x.id)
      : [e.drop]
  ) ?? [];

const harvests = data
  .byType("harvest")
  .filter((h) => itemsFromHarvest(h).some((e) => e === item_id));
const harvestableFrom = data
  .byType("monster")
  .filter((m) => m.id && harvests.some((h) => h.id === m.harvest));
const dissectableFrom = data
  .byType("monster")
  .filter((m) => m.id && harvests.some((h) => h.id === m.dissect));
</script>

<ItemTable
  type="monster"
  loot={mons}
  heading={t("Dropped By", { _context: "Obtaining" })} />

{#if harvestableFrom.length}
  <section>
    <h1>{t("Butcher", { _context: "Obtaining" })}</h1>
    <LimitedList items={harvestableFrom} let:item={m}>
      <ItemSymbol item={m} />
      <ThingLink id={m.id} type="monster" />
    </LimitedList>
  </section>
{/if}

{#if dissectableFrom.length}
  <section>
    <h1>{t("Dissect", { _context: "Obtaining" })}</h1>
    <LimitedList items={dissectableFrom} let:item={m}>
      <ItemSymbol item={m} />
      <ThingLink id={m.id} type="monster" />
    </LimitedList>
  </section>
{/if}
