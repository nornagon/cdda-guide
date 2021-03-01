<script lang="ts">
  import { data } from './data';
  import Monster from './types/Monster.svelte'
  import Unknown from './types/Unknown.svelte'
  export let id: string
  
  let item: any;
  $: item = $data?.byId(id)
  
  const displays = {
    MONSTER: Monster
  }
</script>

{#if !$data}
...
{:else}
{#if !item}
Unknown item: {id}
{:else}
<svelte:component this={displays[item.type] ?? Unknown} {item} />

<details>
<summary>Raw JSON</summary>
<pre>{JSON.stringify(item, null, 2)}</pre>
</details>
{/if}
{/if}