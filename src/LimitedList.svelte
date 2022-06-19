<script lang="ts">
export let items: any[];

export let limit = 10;

export let grace = 4;

// In test mode, always render the expanded list to catch any render bugs that
// only show up when the full list is shown.
const isTesting = (globalThis as any).__isTesting__;

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
    }}>See all {Number(items.length).toLocaleString()}...</button>
{/if}
