<script lang="ts">
import { setContext } from "svelte";

import { CddaData, singularName } from "./data";
import LimitedList from "./LimitedList.svelte";
import type {
  Item,
  Monster,
  Mutation,
  SupportedTypesWithMapped,
  VehiclePart,
} from "./types";
import MutationCategory from "./types/MutationCategory.svelte";
import ThingLink from "./types/ThingLink.svelte";

export let type: string;
export let data: CddaData;
let typeWithCorrectType = type as keyof SupportedTypesWithMapped;
setContext("data", data);

const things = data.byType(type as any).filter((o) => o.id);
things.sort((a, b) => singularName(a).localeCompare(singularName(b)));

function groupBy<T>(things: T[], groupsFor: (x: T) => string[]) {
  const map = new Map<string, T[]>();
  for (const thing of things) {
    const groups = groupsFor(thing);
    for (const group of groups) {
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(thing);
    }
  }
  return map;
}

const groupingFn =
  {
    monster: (m: Monster) => [m.default_faction ?? ""],
    item: (i: Item) => [i.type],
    vehicle_part: (vp: VehiclePart) => vp.categories ?? [""],
    mutation: (m: Mutation) => m.category ?? [""],
  }[type] ?? (() => [""]);

const groups = groupBy(things, groupingFn);
const groupKeys = [...groups.keys()].sort();

const groupFilter =
  {
    mutation: (m: Mutation) => !/Fake\d$/.test(m.id),
  }[type] ?? (() => true);
</script>

<h1>{type}</h1>
{#each groupKeys as groupName}
  {#if type === "mutation" && groupName && data.byId("mutation_category", groupName)}
    <MutationCategory
      item={data.byId("mutation_category", groupName)}
      inCatalog={true} />
  {:else}
    <section>
      {#if groupName}
        <h1>{groupName}</h1>
      {/if}
      <LimitedList
        items={groups.get(groupName).filter(groupFilter)}
        let:item
        limit={groupKeys.length === 1 ? Infinity : 10}>
        <ThingLink type={typeWithCorrectType} id={item.id} />
      </LimitedList>
    </section>
  {/if}
{/each}
