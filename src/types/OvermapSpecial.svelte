<script lang="ts">
import { singularName, type CddaData } from "../data";
import type { OvermapSpecial } from "../types";
import { getContext, onMount } from "svelte";
import { getLootForMapgen, lootForOmSpecial } from "./item/spawnLocations";
import ThingLink from "./ThingLink.svelte";
import { showNumber, showProbability } from "./item/utils";
import { t } from "@transifex/native";
import OvermapAppearance from "./item/OvermapAppearance.svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";
import LimitedTableList from "../LimitedTableList.svelte";

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

const layerElements: HTMLElement[] = [];

onMount(() => {
  layerElements.forEach((el) => {
    // Capture the transformed element's size and adjust its wrapper element to fully contain it.
    // Surely there's a better way to do this.
    const { x, y, width, height } = el.getBoundingClientRect();
    el.parentElement!.style.width = `${width}px`;
    el.parentElement!.style.height = `${height}px`;
    const p = el.parentElement!.getBoundingClientRect();
    el.parentElement!.style.position = "relative";
    el.parentElement!.style.left = `${p.x - x}px`;
    el.parentElement!.style.top = `${p.y - y}px`;
  });
});
</script>

<h1>{singularName(item)}</h1>

<section>
  {#if item.subtype === "mutable"}
    <p>{t("This location's appearance is dynamically generated.")}</p>
  {:else}
    <div class="om-appearance">
      {#if levels.length > 1}
        {#each [...levels].reverse() as level, i}
          <div class={`level ${level === 0 ? "ground-level" : ""}`}>
            <div class="label">
              {level}
            </div>
            <div class="layer-container">
              <div class="layer" bind:this={layerElements[i]}>
                <OvermapAppearance overmapSpecial={item} showZ={level} />
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div class={`level ${levels[0] === 0 ? "ground-level" : ""}`}>
          <div class="label">
            {levels[0]}
          </div>
          <div class="layer-flat">
            <OvermapAppearance overmapSpecial={item} showZ={levels[0]} />
          </div>
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
    {@const sortedLoot = [...loot.entries()].sort(
      (a, b) => b[1].expected - a[1].expected
    )}
    <section>
      <LimitedTableList items={sortedLoot}>
        <tr slot="header">
          <th colspan="2"><h1>{t("Item")}</h1></th>
          <th style="text-align: right;"><h1>{t("Count")}</h1></th>
          <th style="text-align: right;"><h1>{t("Chance")}</h1></th>
        </tr>
        <tr slot="item" let:item={[item_id, chance]}>
          <td style="vertical-align: middle;">
            <ItemSymbol item={data.byId("item", item_id)} />
          </td>
          <td style="padding-left: 3px; vertical-align: middle">
            <ThingLink type="item" id={item_id} />
          </td>
          <td
            style="text-align: right; padding-left: 1em; white-space: nowrap; vertical-align: middle;"
            >{showNumber(chance.expected)}</td>
          <td
            style="text-align: right; padding-left: 1em; white-space: nowrap; vertical-align: middle;"
            >{showProbability(chance.prob)}</td>
        </tr>
      </LimitedTableList>
    </section>
  {/if}
{/await}

<style>
.om-appearance {
  display: flex;
  flex-direction: column;
  align-items: start;
}
.om-appearance > .level {
  display: flex;
  flex-direction: row;
  align-items: center;
  color: var(--cata-color-gray);
  font-weight: bold;
}
.om-appearance > .ground-level {
  color: white;
}
.om-appearance > .level > .label {
  width: 1.5em;
  margin-right: 1em;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.om-appearance > .level > .layer-container > .layer {
  transform-origin: center;
  transform: rotate3d(1, 0, 0, 45deg) translate(50%) rotate(45deg);
}
.layer,
.layer-container {
  width: min-content;
}

td {
  font-variant-numeric: tabular-nums;
}
th {
  padding: 0;
}
</style>
