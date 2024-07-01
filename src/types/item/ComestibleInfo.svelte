<script lang="ts">
import { t } from "@transifex/native";
import type { ComestibleSlot } from "../../types";
import ThingLink from "../ThingLink.svelte";
import {
  CddaData,
  normalizeAddictionTypes,
  parseDuration,
  parseMass,
} from "../../data";
import { getContext } from "svelte";

export let item: ComestibleSlot;

const _context = "Item Comestible Info";

const data = getContext<CddaData>("data");
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
    {#if item.addiction_type}
      <dt>{t("Addiction", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          {#each normalizeAddictionTypes(item) as { addiction, potential }}
            <li>
              <ThingLink type="addiction_type" id={addiction} /> ({potential})
            </li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.smoking_result}
      <dt>{t("Smoking Result", { _context })}</dt>
      <dd><ThingLink type="item" id={item.smoking_result} /></dd>
    {/if}
    {#if item.parasites ?? 0 !== 0}
      <dt>{t("Parasites", { _context })}</dt>
      <dd>{(100 / (item.parasites ?? 0)).toPrecision(2)}%</dd>
    {/if}
    {#if item.vitamins?.length}
      <dt>{t("Vitamins", { _context })}</dt>
      <dd>
        <dl style="font-variant: tabular-nums">
          {#each item.vitamins as [vitamin, rdapct]}
            {@const v = data.byId("vitamin", vitamin)}
            {@const massPerUnit = v.weight_per_unit
              ? parseMass(v.weight_per_unit)
              : null}
            {@const unitsPerDay = (24 * 60 * 60) / parseDuration(v.rate)}
            {@const mass =
              typeof rdapct === "string"
                ? parseMass(rdapct)
                : massPerUnit
                ? (rdapct / 100) * unitsPerDay * massPerUnit
                : null}
            {@const rda =
              typeof rdapct === "number"
                ? rdapct
                : mass && massPerUnit
                ? (mass / massPerUnit / unitsPerDay) * 100
                : null}
            <dt>
              <ThingLink id={vitamin} type="vitamin" />
            </dt>
            <dd>
              {#if v.vit_type === "counter" || v.vit_type === "drug"}
                {rda} U
              {:else}
                {rda?.toFixed(2)}%{" "}
                {#if mass}
                  {#if mass >= 0.001}
                    ({(mass * 1000).toFixed(1)} mg)
                  {:else}
                    ({(mass * 1000 * 1000).toFixed(0)} μg)
                  {/if}
                {/if}
              {/if}
            </dd>
          {/each}
        </dl>
      </dd>
    {/if}
  </dl>
</section>
