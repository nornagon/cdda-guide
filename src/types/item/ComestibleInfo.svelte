<script lang="ts">
import type { ComestibleSlot } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let item: ComestibleSlot;
</script>

<section>
  <h1>Comestible</h1>
  <dl>
    <dt>Calories</dt>
    <dd>{item.calories ?? 0} kcal</dd>
    <dt>Quench</dt>
    <dd>{item.quench ?? 0}</dd>
    <dt>Enjoyability</dt>
    <dd>{item.fun ?? 0}</dd>
    <dt>Portions</dt>
    <dd>{item.charges ?? 1}</dd>
    <dt>Spoils In</dt>
    <dd>{item.spoils_in ?? "never"}</dd>
    <dt>Health</dt>
    <dd>{item.healthy ?? 0}</dd>
    {#if item.vitamins}
      <dt>Vitamins (%RDA)</dt>
      <dd>
        {#each item.vitamins as [vitamin, rdapct], i}
          <ThingLink id={vitamin} type="vitamin" /> ({rdapct}%){#if i < item.vitamins.length - 2}{", "}{:else if i === item.vitamins.length - 2}{" and "}{/if}
        {/each}
      </dd>
    {/if}
  </dl>
</section>
