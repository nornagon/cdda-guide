<script lang="ts">
import type { ToolSlot } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let item: ToolSlot;
</script>

{#if item.charges_per_use || item.sub || item.power_draw || item.turns_per_charge}
  <section>
    <h1>Tool</h1>
    <dl>
      {#if item.charges_per_use}
        <dt>Charges Per Use</dt>
        <dd>{item.charges_per_use}</dd>
      {/if}
      {#if item.power_draw}
        <dt>Power Draw</dt>
        <dd>{(item.power_draw / 1000).toFixed(1)} W</dd>
      {/if}
      {#if item.turns_per_charge}
        <dt>Turns Per Charge</dt>
        <dd>{item.turns_per_charge}</dd>
      {/if}
      {#if item.sub}
        <dt>Substitute</dt>
        <dd><ThingLink type="item" id={item.sub} /></dd>
      {/if}
    </dl>
  </section>
{/if}
