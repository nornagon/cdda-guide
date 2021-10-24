<script lang="ts">
import { getContext } from "svelte";

import { CddaData, singularName } from "../data";
import type { MutationCategory } from "../types";
import ThingLink from "./ThingLink.svelte";

let data = getContext<CddaData>("data");

export let item: MutationCategory;

const mutationsInCategory = data
  .byType("mutation")
  .filter((m) => (m.category ?? []).includes(item.id));
mutationsInCategory.sort((a, b) => singularName(a).localeCompare(singularName(b)))
const preThreshold = mutationsInCategory.filter(t => !t.threshreq || t.threshreq.length === 0)
const postThreshold = mutationsInCategory.filter(t => !(!t.threshreq || t.threshreq.length === 0))
</script>

<h1>Mutation Category: {singularName(item)}</h1>

<section>
  <dl>
    {#if item.threshold_mut}
      <dt>Threshold Mutation</dt>
      <dd><ThingLink id={item.threshold_mut} type="mutation" /></dd>
    {/if}
    {#if preThreshold.length}
      <dt>Pre-Threshold Mutations</dt>
      <dd>
        <ul>
          {#each preThreshold as m}
            <li><ThingLink id={m.id} type="mutation" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if postThreshold.length}
      <dt>Post-Threshold Mutations</dt>
      <dd>
        <ul>
          {#each postThreshold as m}
            <li><ThingLink id={m.id} type="mutation" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
</section>
