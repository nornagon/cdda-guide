<script lang="ts">
import { t } from "@transifex/native";

interface Props {
  items: any[];
  limit?: number;
  grace?: number;
  header?: () => any;
  item: (props: { item: any }) => any;
}

let {
  items,
  limit = 10,
  grace = 4,
  header = () => null,
  item,
}: Props = $props();

// In test mode, always render the expanded list to catch any render bugs that
// only show up when the full list is shown.
const isTesting =
  typeof globalThis !== undefined && (globalThis as any)?.__isTesting__;

let realLimit = $state(
  isTesting ? Infinity : items.length <= limit + grace ? limit + grace : limit,
);
</script>

<table>
  {@render header()}
  <tbody>
    {#each items.slice(0, realLimit) as it}
      {@render item({ item: it })}
    {/each}
  </tbody>
</table>
{#if items.length > realLimit}
  <button
    class="disclosure"
    onclick={(e) => {
      e.preventDefault();
      realLimit = Infinity;
    }}
    >{t("See all {n}...", {
      n: Number(items.length).toLocaleString(),
    })}</button>
{/if}

<style>
table {
  border-collapse: collapse;
}
</style>
