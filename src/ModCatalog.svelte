<script lang="ts">
import { setContext } from "svelte";
import { t } from "@transifex/native";
import { CddaData, mapType } from "./data";
import { report } from "process";

export let data: CddaData;
export let enabledMods: string[];
export let setModEnabled: (mod: string, enabled: boolean) => void;

function toggleMod(mod: string) {
  return (event: Event) => {
    const input = event.target as HTMLInputElement;
    setModEnabled(mod, input.checked);
  };
}

const reportedTypes = {
  item: t("Items"),
  monster: t("Monsters"),
  furniture: t("Furniture"),
  terrain: t("Terrain"),
  vehicle_part: t("Vehicle Parts"),
  tool_quality: t("Tool Qualities"),
  mutation: t("Mutations"),
  martial_art: t("Martial Arts"),
  json_flag: t("Flags"),
  achievement: t("Achievements"),
  proficiencies: t("Proficiencies"),
};

const reportedTypes2 = {
  item: t("Items"),
  recipe: t("Recipes"),
  monster: t("Monsters"),
  terrain: t("Terrain"),
  furniture: t("Furniture"),
  vehicle_part: t("Vehicle Parts"),
  vehicle: t("Vehicles"),
  profession: t("Professions"),
  skill: t("Skills"),
  proficiency: t("Proficiencies"),
  bionic: t("Bionics"),
  mutation: t("Mutations"),
  construction: t("Constructions"),
  effect_type: t("Effects"),
  martial_art: t("Martial Arts"),
  technique: t("Techniques"),
  mission: t("Missions"),
  weather_type: t("Weather Types"),
  overmap_terrain: t("Overmap Terrain"),
  overmap_special: t("Overmap Specials"),
  map_extra: t("Map Extras"),
  npc: t("NPCs"),
  mapgen: t("Mapgens"),
  scenario: t("Scenarios"),
  achievement: t("Achievements"),
  other: t("Other"),
};

const hiddenMods = new Set([
  // These mods don't affect the data in the Guide at all, so hide them.
  "cbm_slots",
  "no_npc_food",
  "personal_portal_storms",
  "standard_combat_test",
  "stats_through_kills",
  "translate_dialogue",

  // MA isn't properly supported; we'd need to load all the map data and rework loot calcs to do it right.
  "MA",

  // This should probably be available, but it throws errors right now.
  "alt_map_key",
]);

setContext("data", data);
</script>

<h1>{t("Mods")}</h1>
{#each data.availableMods.filter((mod) => !hiddenMods.has(mod.id)) as mod}
  {@const modData = data.getRawModData(mod.id)}
  {@const countByType = modData.reduce((acc, item) => {
    const mappedType = mapType(item.type);
    const mappedTypeOrOther =
      mappedType in reportedTypes ? mappedType : "other";
    acc[mappedTypeOrOther] = (acc[mappedTypeOrOther] || 0) + 1;
    return acc;
  }, {})}
  {@const otherTypes = [
    ...modData
      .reduce((acc, item) => {
        const mappedType = mapType(item.type);
        if (mappedType in reportedTypes) return acc;
        acc.add(mappedType);
        return acc;
      }, new Set())
      .values(),
  ].sort()}
  <section>
    <h1 title={mod.id}>
      <label class="checkbox">
        <input
          type="checkbox"
          checked={enabledMods.includes(mod.id)}
          on:change={toggleMod(mod.id)} />
        {mod.label}
      </label>
    </h1>
    <dl>
      {#each Object.entries(reportedTypes) as [type, label]}
        {#if countByType[type]}
          {@const count = countByType[type]}
          {@const catalogLink = `/${type}?mod=${encodeURIComponent(mod.id)}`}
          <dt>
            {#if enabledMods.includes(mod.id)}
              <a href={catalogLink}>{label}</a>
            {:else}
              {label}
            {/if}
          </dt>
          <dd title={type === "other" ? otherTypes.join(", ") : undefined}>
            {count}
          </dd>
        {/if}
      {/each}
    </dl>
    <p style="color: var(--cata-color-gray); font-style: italic">
      {mod.description}
    </p>
  </section>
{:else}
  <p>{t("No mods found.")}</p>
{/each}
