<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { CddaData, normalizeUseAction, singular, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";

import type {
  ConsumeDrugUseFunction,
  Item,
  SupportedTypes,
  Vitamin,
} from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: Vitamin;

const data = getContext<CddaData>("data");
const _context = "Vitamin";

const containingComestibles = data
  .byType("item")
  .filter(
    (t) =>
      t.type === "COMESTIBLE" &&
      t.id &&
      (t.vitamins ?? []).some((v) => v[0] === item.id)
  )
  .map((c) => {
    const comestible = c as SupportedTypes["COMESTIBLE"];
    return {
      comestible: c as Item,
      pct: comestible.vitamins.find((v) => v[0] === item.id)[1],
    };
  });
const containingDrugs = data
  .byType("item")
  .filter((t) =>
    normalizeUseAction(t.use_action).some(
      (u) =>
        u.type === "consume_drug" &&
        (u.vitamins ?? []).some((v) => v[0] === item.id)
    )
  )
  .map((c) => {
    return {
      comestible: c as Item,
      pct: normalizeUseAction(c.use_action)
        .filter((u) => u.type === "consume_drug")
        .map((u) => (u as ConsumeDrugUseFunction).vitamins ?? [])
        .flat()
        .find((v) => v[0] === item.id)[1],
    };
  });
const containing = containingComestibles.concat(containingDrugs);
containing.sort((a, b) =>
  b.pct - a.pct === 0
    ? singularName(a.comestible).localeCompare(singularName(b.comestible))
    : b.pct - a.pct
);

const excessNames = item.excess
  ? data.byId("effect_type", item.excess).name ?? []
  : [];
const deficiencyNames = item.deficiency
  ? data.byId("effect_type", item.deficiency).name ?? []
  : [];
</script>

<h1>{t("Vitamin")}: {singularName(item)}</h1>
<section>
  <dl>
    <dt>{t("Type", { _context })}</dt>
    <dd>{item.vit_type}</dd>
    {#if item.excess}
      <dt>{t("Excess", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          {#each excessNames as n}<li>{singular(n)}</li>{/each}
        </ul>
      </dd>
    {/if}
    {#if item.deficiency}
      <dt>{t("Deficiency", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          {#each deficiencyNames as n}<li>{singular(n)}</li>{/each}
        </ul>
      </dd>
    {/if}
    <dt>{t("Min", { _context })}</dt>
    <dd>{item.min ?? 0}</dd>
    <dt>{t("Max", { _context })}</dt>
    <dd>{item.max ?? 0}</dd>
    <dt>{t("Rate", { _context })}</dt>
    <dd>{item.rate ?? "0 m"}</dd>
  </dl>
</section>
<section>
  <h1>{t("Comestibles", { _context })}</h1>
  <LimitedList items={containing} let:item={other}>
    <ThingLink id={other.comestible.id} type="item" /> ({other.pct}{item.vit_type ===
    "counter"
      ? " U"
      : "% RDA"})
  </LimitedList>
</section>
