<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";

import { byName, CddaData, singularName } from "../data";
import type { MutationCategory } from "../types";
import MutationList from "./MutationList.svelte";
import ThingLink from "./ThingLink.svelte";

let data = getContext<CddaData>("data");
const _context = "Mutation";

export let item: MutationCategory;
export let inCatalog: boolean = false;

const mutationsInCategory = data
  .byType("mutation")
  .filter((m) => (m.category ?? []).includes(item.id))
  .sort(byName);
const preThreshold = mutationsInCategory.filter(
  (t) => !t.threshreq || t.threshreq.length === 0
);
const postThreshold = mutationsInCategory.filter(
  (t) => !(!t.threshreq || t.threshreq.length === 0)
);
</script>

{#if !inCatalog}
  <h1>{t("Mutation Category")}: {singularName(item)}</h1>
{/if}

<section>
  {#if inCatalog}
    <h1>{singularName(item)}</h1>
  {/if}
  <dl>
    {#if item.threshold_mut}
      <dt>{t("Threshold Mutation", { _context })}</dt>
      <dd><ThingLink id={item.threshold_mut} type="mutation" /></dd>
    {/if}
    {#if preThreshold.length}
      <dt>{t("Pre-Threshold Mutations", { _context })}</dt>
      <dd>
        <MutationList mutations={preThreshold} />
      </dd>
    {/if}
    {#if postThreshold.length}
      <dt>{t("Post-Threshold Mutations", { _context })}</dt>
      <dd>
        <MutationList mutations={postThreshold} />
      </dd>
    {/if}
  </dl>
</section>
