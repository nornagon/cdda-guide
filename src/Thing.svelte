<script lang="ts">
import { setContext } from 'svelte';

import type { CddaData } from './data';
import Monster from './types/Monster.svelte'
import Item from './types/Item.svelte'
import Unknown from './types/Unknown.svelte'
import Material from './types/Material.svelte';
import AmmunitionType from './types/AmmunitionType.svelte';
import ToolQuality from './types/ToolQuality.svelte';
import Furniture from './types/Furniture.svelte';
import Skill from './types/Skill.svelte';
import Proficiency from './types/Proficiency.svelte';
import Flag from './types/Flag.svelte';
import Fault from './types/Fault.svelte';
import Technique from './types/Technique.svelte';
import Vitamin from './types/Vitamin.svelte';
import VehiclePart from './types/VehiclePart.svelte';

export let item: { id: string, type: string }

export let data: CddaData
setContext('data', data)

function defaultItem(id : string, type : string) {
  if (type == 'json_flag') {
    return { id: id, type: type }
  } else {
    return null
  }
}

let obj: any;
$: obj = data.byId(item.type, item.id) ?? defaultItem(item.id, item.type)

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
  furniture: Furniture,
  skill: Skill,
  proficiency: Proficiency,
  json_flag: Flag,
  fault: Fault,
  technique: Technique,
  vitamin: Vitamin,
  vehicle_part: VehiclePart,
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
