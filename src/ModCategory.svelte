<script lang="ts">
import { t } from "@transifex/native";
import { byName, type CddaData, type ModInfo, translate } from "./data";
import ThingLink from "./types/ThingLink.svelte";
import LimitedList from "./LimitedList.svelte";
import { setContext } from "svelte";

export let id: string;
export let data: CddaData;
setContext("data", data);

const mods = (
  data.activeMods
    .filter((mod) => (id ? mod === id : mod !== "dda"))
    .map((mod) => data.getModInfo(mod))
    .filter((mod) => mod !== undefined) as ModInfo[]
).sort((a, b) => a.name.localeCompare(b.name));

const listTypes = [
  "item",
  "monster",
  "furniture",
  "terrain",
  "vehicle_part",
  "tool_quality",
  "mutation",
  "martial_art",
  "json_flag",
  "proficiency",
] as const;

const modThings = mods
  .map(
    (mod) =>
      [
        mod,
        listTypes
          .map(
            (type) =>
              [
                type,
                data
                  .activeModObjects(mod.id, type)
                  .filter((o) => "id" in o && o.id)
                  .sort(byName),
              ] as const
          )
          .filter(([_, things]) => things.length > 0),
      ] as const
  )
  .filter(([_, typeThings]) => typeThings.length > 0);
</script>

<h1>{t("Mods")}</h1>
{#if mods.length > 0}
  {#each modThings as [mod, typeThings]}
    <section>
      <h1>{translate(mod.name, false, 1)}</h1>
      {#each typeThings as [type, things]}
        {#if things.length > 0}
          <section>
            <h1>{t(type)}</h1>
            <LimitedList items={things} let:item limit={10}>
              <ThingLink id={item.id} {type} />
            </LimitedList>
          </section>
        {/if}
      {/each}
    </section>
  {/each}
{:else if id}
  <p>{t("No data found for mod:")} {id}.</p>
{:else}
  <p>{t("No mods found.")}</p>
{/if}
