<script lang="ts">
import { getContext } from "svelte";

import { CddaData, singularName } from "../data";

import type { Mutation } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: Mutation;

let data = getContext<CddaData>("data");

const postThresholdMutations = data
  .byType("mutation")
  .filter((m) => (m.threshreq ?? []).includes(item.id))
  .sort((a, b) => singularName(a).localeCompare(singularName(b)));

const requiredBy = data
  .byType("mutation")
  .filter(
    (m) =>
      (m.prereqs ?? []).includes(item.id) ||
      (m.prereqs2 ?? []).includes(item.id)
  )
  .sort((a, b) => singularName(a).localeCompare(singularName(b)));
</script>

<h1>
  {#if item.threshold}Threshold {/if}Mutation: {singularName(item)}
</h1>
<section>
  <dl>
    <dt>Points</dt>
    <dd>{item.points}</dd>
    {#if item.category}
      <dt>Category</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.category as category_id}
            <li><ThingLink type="mutation_category" id={category_id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    <dt title="You can't have two mutations that share a type.">
      Type{#if item.types?.length > 1}s{/if}
    </dt>
    <dd>
      {#if item.types}
        <ul class="comma-separated">
          {#each item.types as type_id}
            <li><ThingLink type="mutation_type" id={type_id} /></li>
          {/each}
        </ul>
      {:else}
        <em>None</em>
      {/if}
    </dd>
    <dt>Prerequisites</dt>
    <dd>
      {#if item.prereqs}
        <ul>
          <li>
            <ul class="comma-separated or">
              {#each item.prereqs as prereq_id}
                <li><ThingLink type="mutation" id={prereq_id} /></li>
              {/each}
            </ul>
          </li>
          {#if item.prereqs2}
            <li>
              <ul class="comma-separated or">
                {#each item.prereqs2 as prereq_id}
                  <li><ThingLink type="mutation" id={prereq_id} /></li>
                {/each}
              </ul>
            </li>
          {/if}
        </ul>
      {:else}
        <em>None</em>
      {/if}
    </dd>
    {#if item.threshreq}
      <dt>Threshold Requirement</dt>
      <dd>
        <ul class="comma-separated or">
          {#each item.threshreq as prereq_id}
            <li><ThingLink type="mutation" id={prereq_id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.leads_to}
      <dt>Leads To</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.leads_to as id}
            <li><ThingLink {id} type="mutation" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.changes_to}
      <dt>Changes To</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.changes_to as id}
            <li><ThingLink {id} type="mutation" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.cancels}
      <dt>Conflicts With</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.cancels as id}
            <li><ThingLink {id} type="mutation" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>

{#if item.threshold && postThresholdMutations.length}
  <section>
    <h1>Post-Threshold Mutations</h1>
    <ul>
      {#each postThresholdMutations as m}
        <li><ThingLink id={m.id} type="mutation" /></li>
      {/each}
    </ul>
  </section>
{/if}

{#if requiredBy.length}
  <section>
    <h1>Required By</h1>
    <ul>
      {#each requiredBy as m}
        <li><ThingLink id={m.id} type="mutation" /></li>
      {/each}
    </ul>
  </section>
{/if}
