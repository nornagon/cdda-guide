<script lang="ts">
import { getContext } from "svelte";
import { CddaData, showProbability } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { Harvest, Monster } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

let data = getContext<CddaData>("data");
const mons = data.byType<Monster>("monster").flatMap((mon) => {
  if (!mon.id) return [];
  const deathDrops = data.flatDeathDrops(mon.id);
  const dd = deathDrops.find((dd) => dd.id === item_id);
  if (dd) return [{ id: mon.id, prob: dd.prob }];
  return [];
});
mons.sort((a, b) => b.prob - a.prob);

const itemsFromHarvest = (h: Harvest): string[] =>
  h.entries?.flatMap((e) =>
    e.type === "bionic_group"
      ? data.flattenItemGroup(data.byId("item_group", e.drop)).map((x) => x.id)
      : [e.drop]
  ) ?? [];

const harvests = data
  .byType<Harvest>("harvest")
  .filter((h) => itemsFromHarvest(h).some((e) => e === item_id));
const harvestableFrom = data
  .byType<Monster>("monster")
  .filter((m) => m.id && harvests.some((h) => h.id === m.harvest));
</script>

{#if mons.length}
  <section>
    <h1>Dropped By</h1>
    <LimitedList items={mons} let:item>
      <ItemSymbol item={data.byId("monster", item.id)} />
      <ThingLink type="monster" id={item.id} /> ({showProbability(item.prob)})
    </LimitedList>
  </section>
{/if}

{#if harvestableFrom.length}
  <section>
    <h1>Butcher</h1>
    <LimitedList items={harvestableFrom} let:item={m}>
      <ItemSymbol item={m} />
      <ThingLink id={m.id} type="monster" />
    </LimitedList>
  </section>
{/if}
