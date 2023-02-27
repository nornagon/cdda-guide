<script lang="ts">
import { CddaData, singularName } from "../data";
import { getContext } from "svelte";
import { topologicalSortComponentsByRank } from "../toposort";
import type { Mutation } from "../types";
import ThingLink from "./ThingLink.svelte";

let data = getContext<CddaData>("data");

export let mutations: Mutation[];
const allPrereqs = (m: Mutation) =>
  (m.prereqs ?? []).concat(m.prereqs2 ?? []).concat(m.threshreq ?? []);
let sortedMutations = topologicalSortComponentsByRank(mutations, (m) =>
  allPrereqs(m).map((x) => data.byId("mutation", x))
).sort((a, b) => singularName(a[0][0]).localeCompare(singularName(b[0][0])));
</script>

<ul>
  {#each sortedMutations as rank}
    <li>
      {#each rank as mg, i}
        {#if i > 0}&nbsp;→{/if}
        {#each mg as m, i}
          {#if i > 0}, {/if}
          <ThingLink id={m.id} type="mutation" />
        {/each}
      {/each}
    </li>
  {/each}
</ul>
