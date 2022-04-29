<script lang="ts">
import { setContext } from "svelte";

import type { CddaData } from "./data";
import Monster from "./types/Monster.svelte";
import Item from "./types/Item.svelte";
import Unknown from "./types/Unknown.svelte";
import Material from "./types/Material.svelte";
import AmmunitionType from "./types/AmmunitionType.svelte";
import ToolQuality from "./types/ToolQuality.svelte";
import Furniture from "./types/Furniture.svelte";
import Skill from "./types/Skill.svelte";
import Proficiency from "./types/Proficiency.svelte";
import Flag from "./types/Flag.svelte";
import Fault from "./types/Fault.svelte";
import Vitamin from "./types/Vitamin.svelte";
import VehiclePart from "./types/VehiclePart.svelte";
import MartialArt from "./types/MartialArt.svelte";
import ErrorBoundary from "./ErrorBoundary";
import Mutation from "./types/Mutation.svelte";
import MutationCategory from "./types/MutationCategory.svelte";
import MutationType from "./types/MutationType.svelte";
import Vehicle from "./types/Vehicle.svelte";
import Terrain from "./types/Terrain.svelte";
import WeaponCategory from "./types/WeaponCategory.svelte";
import ConstructionGroup from "./types/ConstructionGroup.svelte";
import Achievement from "./types/Achievement.svelte";
import ObsoletionWarning from "./ObsoletionWarning.svelte";

export let item: { id: string; type: string };

export let data: CddaData;
setContext("data", data);
let error: Error = null;

function onError(e: Error) {
  error = e;
}

function defaultItem(id: string, type: string) {
  if (type === "json_flag") {
    return { id, type };
  } else {
    return null;
  }
}

let obj =
  data.byId(item.type as any, item.id) ?? defaultItem(item.id, item.type);

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
  vitamin: Vitamin,
  vehicle_part: VehiclePart,
  martial_art: MartialArt,
  mutation: Mutation,
  mutation_category: MutationCategory,
  mutation_type: MutationType,
  vehicle: Vehicle,
  terrain: Terrain,
  weapon_category: WeaponCategory,
  construction_group: ConstructionGroup,
  achievement: Achievement,
  conduct: Achievement,
};
</script>

{#if !obj}
  Unknown obj: {item.type}/{item.id}
{:else}
  {#if error}
    <section>
      <h1>Error</h1>
      <p>
        There was a problem displaying this page. Not all versions of Cataclysm
        are supported by the Guide currently. Try selecting a different build.
      </p>
      <p>
        <details>
          <summary>{error.message}</summary>
          <pre>{error.stack}</pre>
        </details>
      </p>
    </section>
  {:else if globalThis?.process}
    <!-- running in tests -->
    <svelte:component this={displays[obj.type] ?? Unknown} item={obj} />
  {:else}
    <ErrorBoundary {onError}>
      {#if /obsolet/.test(obj.__filename)}
        <ObsoletionWarning item={obj} />
      {/if}
      <svelte:component this={displays[obj.type] ?? Unknown} item={obj} />
    </ErrorBoundary>
  {/if}

  <details>
    <summary>Raw JSON</summary>
    <pre>{JSON.stringify(obj, null, 2)}</pre>
  </details>
{/if}
