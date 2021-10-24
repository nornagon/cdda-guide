<script lang="ts">
import { getContext } from "svelte";

import { CddaData, singularName } from "../data";
import type { MutationType } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: MutationType;

let data = getContext<CddaData>("data");

const mutationsWithType = data
  .byType("mutation")
  .filter((m) => (m.types ?? []).includes(item.id));
mutationsWithType.sort((a, b) =>
  singularName(a).localeCompare(singularName(b))
);
</script>

<h1>Mutation Type: {singularName(item)}</h1>
<section>
  <dl>
    <dt>Mutations</dt>
    <dd>
      <ul>
        {#each mutationsWithType as m}
          <li><ThingLink id={m.id} type="mutation" /></li>
        {/each}
      </ul>
    </dd>
  </dl>
</section>
