<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";

import { byName, CddaData, singular, singularName } from "../data";

import type { Mutation } from "../types";
import MutationColor from "./MutationColor.svelte";
import MutationList from "./MutationList.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: Mutation;

let data = getContext<CddaData>("data");
const _context = "Mutation";

const postThresholdMutations = data
  .byType("mutation")
  .filter((m) => (m.threshreq ?? []).includes(item.id))
  .sort(byName);

const requiredBy = data
  .byType("mutation")
  .filter(
    (m) =>
      (m.prereqs ?? []).includes(item.id) ||
      (m.prereqs2 ?? []).includes(item.id)
  )
  .sort(byName);

const canceledByMutations = data
  .byType("mutation")
  .filter((m) => (m.cancels ?? []).includes(item.id))
  .sort(byName);

const canceledByBionics = data
  .byType("bionic")
  .filter((b) => (b.canceled_mutations ?? []).includes(item.id))
  .sort(byName);

const conflictsWithBionics = data
  .byType("bionic")
  .filter((b) => (b.mutation_conflicts ?? []).includes(item.id))
  .sort(byName);
</script>

<h1>
  {item.threshold ? t("Threshold Mutation") : t("Mutation")}: {singularName(
    item
  )}
</h1>
<section>
  <dl>
    <dt>{t("Points", { _context })}</dt>
    <dd><MutationColor mutation={item}>{item.points}</MutationColor></dd>
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
    <dt>{t("Purifiable", { _context })}</dt>
    <dd>{item.purifiable ?? true ? t("Yes") : t("No")}</dd>
    <dt>{t("Visibility", { _context })}</dt>
    <dd>{item.visibility ?? 0}</dd>
    <dt>{t("Ugliness", { _context })}</dt>
    <dd>{item.ugliness ?? 0}</dd>
    <dt title="You can't have two mutations that share a type.">
      {t("{n, plural, =1 {Type} other {Types}}", {
        n: item.types?.length ?? 0,
        _context,
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
    {#if item.changes_to?.length}
      <dt>{t("Changes To", { _context })}</dt>
      <dd>
        <MutationList
          mutations={item.changes_to.map((id) => data.byId("mutation", id))} />
      </dd>
    {/if}
    {#if item.cancels?.length}
      <dt>{t("Cancels", { _context })}</dt>
      <dd>
        <MutationList
          mutations={item.cancels.map((id) => data.byId("mutation", id))} />
      </dd>
    {/if}
    {#if canceledByMutations.length}
      <dt>{t("Canceled By", { _context })}</dt>
      <dd>
        <MutationList mutations={canceledByMutations} />
      </dd>
    {/if}
    {#if conflictsWithBionics.length}
      <dt>{t("Incompatible With", { _context })}</dt>
      <dd>
        <ul>
          {#each conflictsWithBionics as { id }}
            <li><ThingLink {id} type="bionic" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if canceledByBionics.length}
      <dt>{t("Canceled By Bionics", { _context })}</dt>
      <dd>
        <ul>
          {#each canceledByBionics as { id }}
            <li><ThingLink {id} type="bionic" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.integrated_armor}
      <dt>{t("Integrated Armor", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.integrated_armor as id}
            <li><ThingLink {id} type="item" /></li>
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
    <MutationList mutations={postThresholdMutations} />
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
