<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";

import { CddaData, singular, singularName } from "../data";

import type { Mutation } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: Mutation;

let data = getContext<CddaData>("data");
const _context = "Mutation";

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
  {item.threshold ? t("Threshold Mutation") : t("Mutation")}: {singularName(
    item
  )}
</h1>
<section>
  <dl>
    <dt>{t("Points", { _context })}</dt>
    <dd>{item.points}</dd>
    {#if item.category}
      <dt>{t("Category", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.category as category_id}
            <li><ThingLink type="mutation_category" id={category_id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    <dt title="You can't have two mutations that share a type.">
      {t("{n, plural, =1 {Type} other {Types}}", {
        n: item.types?.length ?? 0,
      })}
    </dt>
    <dd>
      {#if item.types}
        <ul class="comma-separated">
          {#each item.types as type_id}
            <li><ThingLink type="mutation_type" id={type_id} /></li>
          {/each}
        </ul>
      {:else}
        <em>{t("none")}</em>
      {/if}
    </dd>
    <dt>{t("Prerequisites", { _context })}</dt>
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
        <em>{t("none")}</em>
      {/if}
    </dd>
    {#if item.threshreq}
      <dt>{t("Threshold Requirement", { _context })}</dt>
      <dd>
        <ul class="comma-separated or">
          {#each item.threshreq as prereq_id}
            <li><ThingLink type="mutation" id={prereq_id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.leads_to}
      <dt>{t("Leads To", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.leads_to as id}
            <li><ThingLink {id} type="mutation" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.changes_to}
      <dt>{t("Changes To", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.changes_to as id}
            <li><ThingLink {id} type="mutation" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.cancels}
      <dt>{t("Conflicts With", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.cancels as id}
            <li><ThingLink {id} type="mutation" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
  <p style="color: var(--cata-color-gray)">{singular(item.description)}</p>
</section>

{#if item.threshold && postThresholdMutations.length}
  <section>
    <h1>{t("Post-Threshold Mutations", { _context })}</h1>
    <ul>
      {#each postThresholdMutations as m}
        <li><ThingLink id={m.id} type="mutation" /></li>
      {/each}
    </ul>
  </section>
{/if}

{#if requiredBy.length}
  <section>
    <h1>{t("Required By", { _context })}</h1>
    <ul>
      {#each requiredBy as m}
        <li><ThingLink id={m.id} type="mutation" /></li>
      {/each}
    </ul>
  </section>
{/if}
