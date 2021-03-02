<script lang="ts">
  import { data } from './data';
  import Monster from './types/Monster.svelte'
  import Item from './types/Item.svelte'
  import Unknown from './types/Unknown.svelte'
  export let id: string
  
  let obj: any;
  $: obj = $data?.byId(id)
  
  const displays = {
    MONSTER: Monster,
    TOOL: Item,
    GENERIC: Item,
    COMESTIBLE: Item,
  }
</script>

{#if !$data}
...
{:else}
{#if !obj}
Unknown obj: {id}
{:else}
<svelte:component this={displays[obj.type] ?? Unknown} item={obj} />

<details>
<summary>Raw JSON</summary>
<pre>{JSON.stringify(obj, null, 2)}</pre>
</details>
{/if}
{/if}