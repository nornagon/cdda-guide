<script lang="ts">
export let items: any[];

export let limit = 10;

export let grace = 4;

let realLimit = items.length <= limit + grace ? limit + grace : limit;
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
