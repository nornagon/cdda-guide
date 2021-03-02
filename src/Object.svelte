<script lang="ts">
  import { data } from './data';
  import Monster from './types/Monster.svelte'
  import Item from './types/Item.svelte'
  import Unknown from './types/Unknown.svelte'
  export let item: { id: string, type: string }
  
  let obj: any;
  $: obj = $data?.byId(item.type, item.id)
  
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
Unknown obj: {item.type}/{item.id}
{:else}
<svelte:component this={displays[obj.type] ?? Unknown} item={obj} />

<details>
<summary>Raw JSON</summary>
<pre>{JSON.stringify(obj, null, 2)}</pre>
</details>
{/if}
{/if}