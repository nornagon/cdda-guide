<script lang="ts">
import { t } from "@transifex/native";

import type { ToolSlot } from "../../types";
import ThingLink from "../ThingLink.svelte";

const _context = "Item Tool Info";

export let item: ToolSlot;
</script>

{#if item.charges_per_use || item.sub || item.power_draw || item.turns_per_charge}
  <section>
    <h1>{t("Tool", { _context, _comment: "Section heading" })}</h1>
    <dl>
      {#if item.ammo?.length}
        <dt>{t("Ammo", { _context })}</dt>
        <dd>
          <ul class="comma-separated">
            {#each [item.ammo].flat() as ammo}
              <li><ThingLink type="ammunition_type" id={ammo} /></li>
            {/each}
          </ul>
        </dd>
      {/if}
      {#if item.charges_per_use}
        <dt>{t("Charges Per Use", { _context })}</dt>
        <dd>{item.charges_per_use}</dd>
      {/if}
      {#if item.power_draw}
        <dt>{t("Power Draw", { _context })}</dt>
        <dd>{item.power_draw}</dd>
      {/if}
      {#if item.turns_per_charge}
        <dt>{t("Turns Per Charge", { _context })}</dt>
        <dd>{item.turns_per_charge}</dd>
      {/if}
      {#if item.sub}
        <dt>{t("Substitute", { _context })}</dt>
        <dd><ThingLink type="item" id={item.sub} /></dd>
      {/if}
    </dl>
  </section>
{/if}
