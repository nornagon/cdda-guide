<script lang="ts">
import { t } from "@transifex/native";
import { setContext, SvelteComponent } from "svelte";

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
import ErrorBoundary from "./ErrorBoundary.mjs";
import Mutation from "./types/Mutation.svelte";
import MutationCategory from "./types/MutationCategory.svelte";
import MutationType from "./types/MutationType.svelte";
import Vehicle from "./types/Vehicle.svelte";
import Terrain from "./types/Terrain.svelte";
import WeaponCategory from "./types/WeaponCategory.svelte";
import ConstructionGroup from "./types/ConstructionGroup.svelte";
import Achievement from "./types/Achievement.svelte";
import ObsoletionWarning from "./ObsoletionWarning.svelte";
import Bionic from "./types/Bionic.svelte";
import AddictionType from "./types/AddictionType.svelte";
import * as Sentry from "@sentry/browser";
import type { SupportedTypes } from "./types";
import JsonView from "./JsonView.svelte";
import OvermapSpecial from "./types/OvermapSpecial.svelte";
import ItemAction from "./types/ItemAction.svelte";
import Technique from "./types/Technique.svelte";

export let item: { id: string; type: string };

export let data: CddaData;
setContext("data", data);
let error: Error | null = null;

function onError(e: Error) {
  error = e;
  Sentry.captureException(e, {
    contexts: {
      item: {
        type: item.type,
        id: item.id,
      },
    },
  });
}

function defaultItem(id: string, type: string) {
  if (type === "json_flag") {
    return { id, type, __filename: "" };
  } else {
    return undefined;
  }
}

let obj =
  data.byIdMaybe(item.type as keyof SupportedTypes, item.id) ??
  defaultItem(item.id, item.type);

const displays: Record<string, typeof SvelteComponent> = {
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
  addiction_type: AddictionType,
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
  bionic: Bionic,
  overmap_special: OvermapSpecial,
  city_building: OvermapSpecial,
  item_action: ItemAction,
  technique: Technique,
};

const display = (obj && displays[obj.type]) ?? Unknown;
</script>

{#if !obj}
  {t("Unknown object: {id}", {
    id: `${item.type}/${item.id}`,
    _comment: "Error message when an object is not found in the data",
  })}
{:else}
  {#if error}
    <section>
      <h1>{t("Error")}</h1>
      <p>
        {t(
          "There was a problem displaying this page. Not all versions of Cataclysm are supported by the Guide currently. Try selecting a different build."
        )}
      </p>
      <p>
        <details>
          <summary>{error.message}</summary>
          <pre>{error.stack}</pre>
        </details>
      </p>
    </section>
  {:else if typeof globalThis !== "undefined" && globalThis.process}
    <!-- running in tests -->
    <svelte:component this={display} item={obj} />
  {:else}
    <ErrorBoundary {onError}>
      {#if /obsolet/.test(obj.__filename)}
        <ObsoletionWarning item={obj} />
      {/if}
      <svelte:component this={display} item={obj} />
    </ErrorBoundary>
  {/if}

  <details>
    <summary>{t("Raw JSON")}</summary>
    <JsonView {obj} buildNumber={data.build_number} />
  </details>
{/if}
