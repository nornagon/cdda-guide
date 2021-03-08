<script lang="ts">
  import { setContext } from 'svelte';

  import type { CddaData } from './data';
  import Monster from './types/Monster.svelte'
  import Item from './types/Item.svelte'
  import Unknown from './types/Unknown.svelte'
  import Material from './types/Material.svelte';
  import AmmunitionType from './types/AmmunitionType.svelte';
  import ToolQuality from './types/ToolQuality.svelte';

  export let item: { id: string, type: string }
  
  export let data: CddaData
  setContext('data', data)
  
  let obj: any;
  $: obj = data.byId(item.type, item.id)
  
  const displays = {
    MONSTER: Monster,
    AMMO: Item,
    GUN: Item,
    ARMOR: Item,
    PET_ARMOR: Item,
    TOOL: Item,
    TOOLMOD: Item,
    TOOL_ARMOR: Item,
    BOOK: Item,
    COMESTIBLE: Item,
    ENGINE: Item,
    WHEEL: Item,
    GUNMOD: Item,
    MAGAZINE: Item,
    BATTERY: Item,
    GENERIC: Item,
    BIONIC_ITEM: Item,
    material: Material,
    ammunition_type: AmmunitionType,
    tool_quality: ToolQuality,
  }
</script>

{#if !obj}
Unknown obj: {item.type}/{item.id}
{:else}
<svelte:component this={displays[obj.type] ?? Unknown} item={obj} />

<details>
<summary>Raw JSON</summary>
<pre>{JSON.stringify(obj, null, 2)}</pre>
</details>
{/if}