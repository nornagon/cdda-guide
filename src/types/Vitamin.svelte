<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singular, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";

import type { SupportedTypes, Vitamin } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: Vitamin;

const data = getContext<CddaData>("data");

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
      comestible,
      pct: comestible.vitamins.find((v) => v[0] === item.id)[1],
    };
  });
containingComestibles.sort((a, b) => b.pct - a.pct);

const excessNames: any[] = item.excess
  ? data.byId("effect_type", item.excess).name
  : [];
const deficiencyNames: any[] = item.deficiency
  ? data.byId("effect_type", item.deficiency).name
  : [];
</script>

<h1>Vitamin: {singularName(item)}</h1>
<section>
  <dl>
    <dt>Type</dt>
    <dd>{item.vit_type}</dd>
    {#if item.excess}
      <dt>Excess</dt>
      <dd>
        <ul class="comma-separated">
          {#each excessNames as n}<li>{singular(n)}</li>{/each}
        </ul>
      </dd>
    {/if}
    {#if item.deficiency}
      <dt>Deficiency</dt>
      <dd>
        <ul class="comma-separated">
          {#each deficiencyNames as n}<li>{singular(n)}</li>{/each}
        </ul>
      </dd>
    {/if}
    <dt>Min</dt>
    <dd>{item.min ?? 0}</dd>
    <dt>Max</dt>
    <dd>{item.max ?? 0}</dd>
    <dt>Rate</dt>
    <dd>{item.rate ?? "0 m"}</dd>
  </dl>
</section>
<section>
  <h1>Comestibles</h1>
  <LimitedList items={containingComestibles} let:item>
    <ThingLink id={item.comestible.id} type="item" /> ({item.pct}% RDA)
  </LimitedList>
</section>
