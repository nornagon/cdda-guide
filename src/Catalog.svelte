<script lang="ts">
import { setContext } from "svelte";

import { CddaData, singularName } from "./data";
import LimitedList from "./LimitedList.svelte";
import type { Item, Monster, VehiclePart } from "./types";
import ThingLink from "./types/ThingLink.svelte";

export let type: string;
export let data: CddaData;
setContext("data", data);

const things = data.byType(type).filter((o) => o.id);
things.sort((a, b) => singularName(a).localeCompare(singularName(b)));

function groupBy<T>(things: T[], f: (x: T) => string) {
  const map = new Map<string, T[]>();
  for (const thing of things) {
    const group = f(thing);
    if (!map.has(group)) map.set(group, []);
    map.get(group).push(thing);
  }
  return map;
}

const groupingFn =
  {
    monster: (m: Monster) => m.default_faction ?? "",
    item: (i: Item) => i.type,
    vehicle_part: (vp: VehiclePart) => (vp.categories ?? [])[0] ?? "",
  }[type] ?? (() => "");

const groups = groupBy(things, groupingFn);
const groupKeys = [...groups.keys()].sort();
</script>

<h1>{type}</h1>
{#each groupKeys as groupName}
  <section>
    {#if groupName}
      <h1>{groupName}</h1>
    {/if}
    <LimitedList items={groups.get(groupName)} let:item>
      <ThingLink {type} id={item.id} />
    </LimitedList>
  </section>
{/each}
