<script lang="ts">
  import { data } from './data';
  export let id: string
  
  const item = $data?.find(x => x.id === id)
</script>

{#if !item}
Unknown item: {id}
{:else}
<pre>{JSON.stringify(item, null, 2)}</pre>
{/if}
