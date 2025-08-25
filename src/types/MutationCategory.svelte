<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";

import { byName, CddaData, singularName } from "../data";
import type { MutationCategory } from "../types";
import MutationList from "./MutationList.svelte";
import ThingLink from "./ThingLink.svelte";
import ModTag from "./ModTag.svelte";

let data = getContext<CddaData>("data");
const _context = "Mutation";

interface Props {
  item: MutationCategory;
  inCatalog?: boolean;
}

let { item, inCatalog = false }: Props = $props();

const mutationsInCategory = data
  .byType("mutation")
  .filter((m) => (m.category ?? []).includes(item.id))
  .sort(byName);
const preThreshold = mutationsInCategory.filter(
  (t) => !t.threshreq || t.threshreq.length === 0,
);
const postThreshold = mutationsInCategory.filter(
  (t) => !(!t.threshreq || t.threshreq.length === 0),
);
</script>

{#if !inCatalog}
  <h1>
    {t("Mutation Category")}: {singularName(item)}
    <ModTag {item} clickable />
  </h1>
{/if}

<section>
  {#if inCatalog}
    <h1>{singularName(item)} <ModTag {item} /></h1>
  {/if}
  <dl>
    {#if item.vitamin}
      <dt>{t("Vitamin", { _context })}</dt>
      <dd><ThingLink id={item.vitamin} type="vitamin" /></dd>
    {/if}
    {#if preThreshold.length}
      <dt>{t("Pre-Threshold Mutations", { _context })}</dt>
      <dd>
        <MutationList mutations={preThreshold} />
      </dd>
    {/if}
    {#if item.threshold_mut}
      <dt>{t("Threshold Mutation", { _context })}</dt>
      <dd><ThingLink id={item.threshold_mut} type="mutation" /></dd>
    {/if}
    {#if postThreshold.length}
      <dt>{t("Post-Threshold Mutations", { _context })}</dt>
      <dd>
        <MutationList mutations={postThreshold} />
      </dd>
    {/if}
  </dl>
</section>
