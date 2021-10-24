<script lang="ts">
import { getContext } from "svelte";

import { CddaData, singularName } from "../data";
import type { Mutation, MutationCategory } from "../types";
import ThingLink from "./ThingLink.svelte";

let data = getContext<CddaData>("data");

export let item: MutationCategory;
export let inCatalog: boolean = false;

function topologicalSort<T>(xs: T[], outgoingEdges: (n: T) => T[]) {
  const result: T[] = [];
  let isDag = true;
  const unmarked = new Set(xs);
  const tempMarks = new Set();
  while (unmarked.size) {
    const n = unmarked.values().next().value as T;
    visit(n);
    if (!isDag) {
      throw new Error("Not a DAG");
    }
  }
  return result;

  function visit(n: T) {
    if (!unmarked.has(n)) return;
    if (tempMarks.has(n)) {
      isDag = false;
      return;
    }
    tempMarks.add(n);
    for (const m of outgoingEdges(n)) {
      visit(m);
    }
    tempMarks.delete(n);
    unmarked.delete(n);
    result.push(n);
  }
}

const mutationsInCategory = data
  .byType("mutation")
  .filter((m) => (m.category ?? []).includes(item.id));
mutationsInCategory.sort((a, b) =>
  singularName(a).localeCompare(singularName(b))
);
const allPrereqs = (m: Mutation) =>
  (m.prereqs ?? []).concat(m.prereqs2 ?? []).concat(m.threshreq ?? []);
const preThreshold = topologicalSort(
  mutationsInCategory.filter((t) => !t.threshreq || t.threshreq.length === 0),
  (m) => allPrereqs(m).map((x) => data.byId("mutation", x))
);
const postThreshold = topologicalSort(
  mutationsInCategory.filter(
    (t) => !(!t.threshreq || t.threshreq.length === 0)
  ),
  (m) => allPrereqs(m).map((x) => data.byId("mutation", x))
);
</script>

{#if !inCatalog}
  <h1>Mutation Category: {singularName(item)}</h1>
{/if}

<section>
  {#if inCatalog}
    <h1>{singularName(item)}</h1>
  {/if}
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
