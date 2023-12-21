<script lang="ts">
import { singularName, type CddaData } from "../data";
import type { OvermapSpecial } from "../types";
import { getContext } from "svelte";
import { getLootForMapgen, lootForOmSpecial } from "./item/spawnLocations";
import ThingLink from "./ThingLink.svelte";
import { showProbability } from "./item/utils";
import LimitedList from "../LimitedList.svelte";
import { t } from "@transifex/native";
import OvermapAppearance from "./item/OvermapAppearance.svelte";

const data = getContext<CddaData>("data");

export let item: OvermapSpecial;
const mevels =
  item.subtype === "mutable"
    ? [0]
    : item.overmaps?.map((om) => om.point[2]) ?? [0];
const minLevel = Math.min(...mevels);
const maxLevel = Math.max(...mevels);
const levels = Array.from(
  { length: maxLevel - minLevel + 1 },
  (_, i) => i + minLevel
);

const _context = "Overmap Special";

const lootPromise = lootForOmSpecial(data, item, (mg) =>
  getLootForMapgen(data, mg)
);

let showZ = levels.includes(0) ? 0 : levels[0];
</script>

<h1>{singularName(item)}</h1>

<section>
  {#if item.subtype === "mutable"}
    <p>{t("This location's appearance is dynamically generated.")}</p>
  {:else}
    <div class="om-appearance">
      <OvermapAppearance overmapSpecial={item} {showZ} />
      {#if levels.length > 1}
        <div
          class="slider"
          style={`height: ${
            (levels[levels.length - 1] - levels[0] + 1) * 25
          }px`}>
          <input
            type="range"
            name="z"
            list="z-values"
            min={levels[0]}
            max={levels[levels.length - 1]}
            bind:value={showZ} />
          <datalist id="z-values">
            {#each [...levels].reverse() as level}
              <option value={level} label={`Z=${level}`} />{/each}
          </datalist>
        </div>
      {:else if levels[0] !== 0}
        <div>
          Z={levels[0]}
        </div>
      {/if}
    </div>
  {/if}

  {#if item.flags?.length}
    <dl>
      <dt>{t("Flags")}</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.flags as flag}
            <li>{flag}</li>
          {/each}
        </ul>
      </dd>
    </dl>
  {/if}
</section>

{#await lootPromise}
  <section>
    <h1>{t("Items", { _context })}</h1>
    <p style="color: var(--cata-color-gray)">
      <em>{t("Loading...")}</em>
    </p>
  </section>
{:then loot}
  {#if loot.size}
    {@const sortedLoot = [...loot.entries()].sort((a, b) => b[1] - a[1])}
    <section>
      <h1>{t("Items", { _context })}</h1>
      <LimitedList items={sortedLoot} let:item={[item_id, chance]}>
        <ThingLink type="item" id={item_id} />
        <span>({showProbability(chance)})</span>
      </LimitedList>
    </section>
  {/if}
{/await}

<style>
.om-appearance {
  display: flex;
  flex-direction: row;
  align-items: center;
}

datalist {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 6px 0;
}

.slider {
  display: flex;
  flex-direction: row;
}
input[type="range"] {
  margin: 0;
  writing-mode: vertical-lr;
}
option {
  padding: 0;
}
</style>
