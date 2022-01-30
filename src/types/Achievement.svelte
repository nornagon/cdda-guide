<script lang="ts">
import { getContext } from "svelte";

import { CddaData, plural, singularName } from "../data";
import type { Achievement } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: Achievement;
const data = getContext<CddaData>("data");

const unlocks = data
  .byType("achievement")
  .filter((x) => x.id !== item.id && x.hidden_by?.includes(item.id));
</script>

<h1>
  {item.type === "achievement" ? "Achievement" : "Conduct"}: {singularName(
    item
  )}
</h1>

<section>
  {#if item.description}
    <p style="color: var(--cata-color-gray)">{item.description}</p>
  {/if}
  <dl>
    {#if item.hidden_by}
      <dt>Hidden By</dt>
      <dd>
        <ul class="comma-separated and">
          {#each item.hidden_by as id}
            <li><ThingLink type={item.type} {id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if unlocks.length}
      <dt>Unlocks</dt>
      <dd>
        <ul class="comma-separated and">
          {#each unlocks as a}
            <li><ThingLink type={item.type} id={a.id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.time_constraint}
      <dt>Time Constraint</dt>
      <dd>
        Time since <strong>{item.time_constraint.since}</strong> is
        <strong
          >{item.time_constraint.is}
          {item.time_constraint.target ?? ""}</strong>
      </dd>
    {/if}
    <dt>Requirements</dt>
    <dd>
      <ul>
        {#each item.requirements as req}
          <li>
            {#if req.description}
              <strong>{req.description}</strong>
            {:else}
              <strong
                >{plural(
                  data.byId("event_statistic", req.event_statistic).description
                )}</strong>
              is <strong>{req.is} {req.target ?? ""}</strong>
            {/if}
          </li>
        {/each}
      </ul>
    </dd>
  </dl>
</section>
