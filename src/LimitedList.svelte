<script lang="ts">
import { t } from "@transifex/native";

export let items: any[];

export let limit = 10;

export let grace = 4;

// In test mode, always render the expanded list to catch any render bugs that
// only show up when the full list is shown.
const isTesting =
  typeof globalThis !== undefined && (globalThis as any)?.__isTesting__;

let realLimit = isTesting
  ? Infinity
  : items.length <= limit + grace
  ? limit + grace
  : limit;
</script>

<ul>
  {#each items.slice(0, realLimit) as item}
    <li><slot {item} /></li>
  {/each}
</ul>
{#if items.length > realLimit}
  <button
    class="disclosure"
    on:click={(e) => {
      e.preventDefault();
      realLimit = Infinity;
    }}
    >{t("See all {n}...", {
      n: Number(items.length).toLocaleString(),
    })}</button>
{/if}
