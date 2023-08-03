<script lang="ts">
import { t } from "@transifex/native";
import type { ComestibleSlot } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let item: ComestibleSlot;

const _context = "Item Comestible Info";
</script>

<section>
  <h1>{t("Comestible", { _context })}</h1>
  <dl>
    <dt>{t("Calories", { _context })}</dt>
    <dd>{item.calories ?? 0} kcal</dd>
    <dt>{t("Quench", { _context })}</dt>
    <dd>{item.quench ?? 0}</dd>
    <dt>{t("Enjoyability", { _context })}</dt>
    <dd>{item.fun ?? 0}</dd>
    <dt>{t("Portions", { _context })}</dt>
    <dd>{item.charges ?? 1}</dd>
    <dt>{t("Spoils In", { _context })}</dt>
    <dd>{item.spoils_in ?? "never"}</dd>
    <dt>{t("Health", { _context })}</dt>
    <dd>{item.healthy ?? 0}</dd>
    {#if item.smoking_result}
      <dt>{t("Smoking Result", { _context })}</dt>
      <dd><ThingLink type="item" id={item.smoking_result} /></dd>
    {/if}
    {#if item.parasites ?? 0 !== 0}
      <dt>{t("Parasites", { _context })}</dt>
      <dd>{(100 / (item.parasites ?? 0)).toPrecision(2)}%</dd>
    {/if}
    {#if item.vitamins?.length}
      <dt>{t("Vitamins (%RDA)", { _context })}</dt>
      <dd>
        {#each item.vitamins as [vitamin, rdapct], i}
          <ThingLink id={vitamin} type="vitamin" /> ({rdapct}%){#if i < item.vitamins.length - 2}{", "}{:else if i === item.vitamins.length - 2}{" and "}{/if}
        {/each}
      </dd>
    {/if}
  </dl>
</section>
