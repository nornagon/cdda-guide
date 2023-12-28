<script lang="ts">
import { singularName, type CddaData } from "../data";
import type { OvermapSpecial } from "../types";
import { getContext, onMount } from "svelte";
import {
  getFurnitureForMapgen,
  getLootForMapgen,
  getOMSByAppearance,
  getTerrainForMapgen,
  lootForOmSpecial,
  overmapAppearance,
} from "./item/spawnLocations";
import ThingLink from "./ThingLink.svelte";
import { t } from "@transifex/native";
import OvermapAppearance from "./item/OvermapAppearance.svelte";
import ItemTable from "./item/ItemTable.svelte";

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

const lookalikeIds = (
  getOMSByAppearance(data).get(overmapAppearance(data, item)) ?? []
).sort((a, b) => a.localeCompare(b));

const _context = "Overmap Special";

const layerElements: HTMLElement[] = [];

onMount(() => {
  layerElements.forEach((el) => {
    // Capture the transformed element's size and adjust its wrapper element to fully contain it.
    // Surely there's a better way to do this.
    function makeFitTight() {
      const { x, y, width, height } = el.getBoundingClientRect();
      el.parentElement!.style.width = `${width}px`;
      el.parentElement!.style.height = `${height}px`;
      const p = el.parentElement!.getBoundingClientRect();
      el.parentElement!.style.position = "relative";
      el.parentElement!.style.left = `${p.x - x}px`;
      el.parentElement!.style.top = `${p.y - y}px`;
    }
    // Resize observer needed to handle font changes during loading.
    new ResizeObserver(makeFitTight).observe(el);
    makeFitTight();
  });
});
</script>

<h1>{singularName(item)}</h1>

<section>
  {#if item.subtype === "mutable"}
    <p>
      {t("This location's appearance is dynamically generated.", { _context })}
    </p>
  {:else}
    <div class="om-appearance">
      {#if levels.length > 1}
        {#each [...levels].reverse() as level, i}
          <div class={`level ${level === 0 ? "ground-level" : ""}`}>
            <div class="label">
              <span style={level === 0 ? "" : "visibility: hidden"}>Z=</span
              >{level}
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

  <dl>
    <dt>{t("Locations", { _context })}</dt>
    <dd>
      <ul class="comma-separated">
        {#each item.locations ?? [] as location}
          <li>{location}</li>
        {/each}
      </ul>
    </dd>
    {#if item.flags?.length}
      <dt>{t("Flags")}</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.flags as flag}
            <li>{flag}</li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if lookalikeIds.length > 1}
      <dt>{t("Variants", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          <!-- prettier-ignore -->
          {#each lookalikeIds as id}<li>{#if id === item.id}{id}{:else}<ThingLink type="overmap_special" {id} />{/if}</li>{/each}
        </ul>
      </dd>
    {/if}
  </dl>
</section>

<ItemTable
  loot={lootForOmSpecial(data, item, (mg) => getLootForMapgen(data, mg))} />
<ItemTable
  type="terrain"
  loot={lootForOmSpecial(data, item, (mg) => getTerrainForMapgen(data, mg))} />
<ItemTable
  type="furniture"
  loot={lootForOmSpecial(data, item, (mg) =>
    getFurnitureForMapgen(data, mg)
  )} />

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
</style>
