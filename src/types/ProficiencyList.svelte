<script lang="ts">
import { CddaData, singularName } from "../data";
import { getContext } from "svelte";
import { topologicalSortComponentsByRank } from "../toposort";
import type { Proficiency } from "../types";
import ThingLink from "./ThingLink.svelte";

let data = getContext<CddaData>("data");

interface Props {
  proficiencies: Proficiency[];
}

let { proficiencies }: Props = $props();
const allPrereqs = (p: Proficiency) => p.required_proficiencies ?? [];
let sortedMutations = topologicalSortComponentsByRank(proficiencies, (m) =>
  allPrereqs(m).map((x) => data.byId("proficiency", x)),
).sort((a, b) => singularName(a[0][0]).localeCompare(singularName(b[0][0])));
</script>

<ul>
  {#each sortedMutations as rank}
    <li>
      {#each rank as mg, i}
        {#if i > 0}&nbsp;→{/if}
        {#each mg as m, i}
          {#if i > 0},
          {/if}
          <ThingLink id={m.id} type="proficiency" />
        {/each}
      {/each}
    </li>
  {/each}
</ul>
