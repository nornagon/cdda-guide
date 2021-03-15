<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singular, singularName } from "../data";

import type { ComestibleSlot, Vitamin } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: Vitamin

const data = getContext<CddaData>('data')

const containingComestibles = data.byType<ComestibleSlot & {id: string, type: string}>('item').filter(t =>
  t.type === 'COMESTIBLE' && t.id && (t.vitamins ?? []).some(v => v[0] === item.id)).map(c => {
    return {comestible: c, pct: c.vitamins.find(v => v[0] === item.id)[1]}
  })
containingComestibles.sort((a, b) => b.pct - a.pct)

let limit = 10
</script>

<h1>Vitamin: {singularName(item)}</h1>
<section>
  <dl>
    <dt>Type</dt><dd>{item.vit_type}</dd>
    {#if item.excess}
    <dt>Excess</dt><dd><ul class="comma-separated">{#each data.byId('effect_type', item.excess).name as n}<li>{singular(n)}</li>{/each}</ul></dd>
    {/if}
    {#if item.deficiency}
    <dt>Deficiency</dt><dd><ul class="comma-separated">{#each data.byId('effect_type', item.deficiency).name as n}<li>{singular(n)}</li>{/each}</ul></dd>
    {/if}
    <dt>Min</dt><dd>{item.min ?? 0}</dd>
    <dt>Max</dt><dd>{item.max ?? 0}</dd>
    <dt>Rate</dt><dd>{item.rate ?? '0 m'}</dd>
  </dl>
</section>
<section>
  <h1>Comestibles</h1>
  <ul>
  {#each containingComestibles.slice(0, limit) as {comestible, pct}}
  <li><ThingLink id={comestible.id} type="item" /> ({pct}% RDA)</li>
  {/each}
  </ul>
  {#if containingComestibles.length > limit}
  <button class="disclosure" on:click={(e) => { e.preventDefault(); limit = Infinity }}>See all...</button>
  {/if}
</section>
