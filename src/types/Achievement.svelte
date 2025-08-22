<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";

import { CddaData, plural, singular, singularName } from "../data";
import type { Achievement } from "../types";
import ThingLink from "./ThingLink.svelte";

interface Props {
  item: Achievement;
}

let { item }: Props = $props();
const data = getContext<CddaData>("data");
const _context = "Achievement";

const unlocks = data
  .byType("achievement")
  .filter(
    (x) => x.id !== item.id && [x.hidden_by ?? []].flat().includes(item.id),
  );
</script>

<h1>
  {item.type === "achievement" ? "Achievement" : "Conduct"}: {singularName(
    item,
  )}
</h1>

<section>
  {#if item.description}
    <p style="color: var(--cata-color-gray)">{singular(item.description)}</p>
  {/if}
  <dl>
    {#if item.hidden_by}
      <dt>{t("Hidden By", { _context })}</dt>
      <dd>
        <ul class="comma-separated and">
          {#each [item.hidden_by].flat() as id}
            <li><ThingLink type={item.type} {id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if unlocks.length}
      <dt>{t("Unlocks", { _context })}</dt>
      <dd>
        <ul class="comma-separated and">
          {#each unlocks as a}
            <li><ThingLink type={item.type} id={a.id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.time_constraint}
      <dt>{t("Time Constraint", { _context })}</dt>
      <dd>
        Time since <strong>{item.time_constraint.since}</strong> is
        <strong
          >{item.time_constraint.is}
          {item.time_constraint.target ?? ""}</strong>
      </dd>
    {/if}
    <dt>{t("Requirements", { _context })}</dt>
    <dd>
      <ul>
        {#each item.requirements as req}
          <li>
            {#if req.description}
              <strong>{req.description}</strong>
            {:else}
              {@const stat = data.byId("event_statistic", req.event_statistic)}
              <strong
                >{stat.description
                  ? plural(stat.description)
                  : stat.id}</strong>
              is <strong>{req.is} {req.target ?? ""}</strong>
            {/if}
          </li>
        {/each}
      </ul>
    </dd>
  </dl>
</section>
