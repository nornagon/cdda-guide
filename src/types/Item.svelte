<script lang="ts">
import { getContext } from "svelte";

import {
  asKilograms,
  asLiters,
  CddaData,
  parseVolume,
  singular,
  singularName,
} from "../data";
import type {
  RequirementData,
  ItemBasicInfo,
  Item,
  SupportedTypesWithMapped,
} from "../types";
import AsciiPicture from "./AsciiPicture.svelte";
import AmmoInfo from "./item/AmmoInfo.svelte";
import ArmorInfo from "./item/ArmorInfo.svelte";
import BookInfo from "./item/BookInfo.svelte";
import ComestibleInfo from "./item/ComestibleInfo.svelte";
import ComponentOf from "./item/ComponentOf.svelte";
import Deconstruct from "./item/Deconstruct.svelte";
import Disassembly from "./item/Disassembly.svelte";
import DroppedBy from "./item/DroppedBy.svelte";
import GrownFrom from "./item/GrownFrom.svelte";
import GunInfo from "./item/GunInfo.svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";
import MeleeInfo from "./item/MeleeInfo.svelte";
import Recipes from "./item/Recipes.svelte";
import SpawnedIn from "./item/SpawnedIn.svelte";
import ToolInfo from "./item/ToolInfo.svelte";
import WheelInfo from "./item/WheelInfo.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: Item;
let data: CddaData = getContext("data");

function length(item: ItemBasicInfo) {
  if (item.longest_side) return item.longest_side;
  return `${Math.round(Math.cbrt(parseVolume(item.volume)))} cm`;
}

let qualities = (item.qualities ?? []).map(([id, level]) => ({
  quality: data.byId("tool_quality", id),
  level,
}));
let materials = (
  typeof item.material === "string" ? [item.material] : item.material ?? []
).map((id) => data.byId("material", id));
let flags = (item.flags ?? []).map(
  (id) => data.byId("json_flag", id) ?? { id }
);
let faults = (item.faults ?? []).map((f) => data.byId("fault", f));

const defaultPocketData = {
  pocket_type: "CONTAINER",
  min_item_volume: "0 ml",
  moves: 100,
  fire_protection: false,
  watertight: false,
  airtight: false,
  open_container: false,
  rigid: false,
  holster: false,
};
let pockets = (item.pocket_data ?? []).map((pocket) => {
  return { ...defaultPocketData, ...pocket };
});
let magazine_compatible = pockets
  .filter((p) => p.pocket_type === "MAGAZINE_WELL")
  .flatMap(
    (p) =>
      p.item_restriction?.map((id) => ({
        type: "item" as keyof SupportedTypesWithMapped,
        id,
      })) ??
      p.flag_restriction.map((id) => ({
        type: "json_flag" as keyof SupportedTypesWithMapped,
        id,
      }))
  );

function maxCharges(ammo_id: string) {
  let ret = 0;
  for (const p of pockets)
    if (p.pocket_type === "MAGAZINE" && p.ammo_restriction)
      ret += p.ammo_restriction[ammo_id] ?? 0;
  return ret;
}

let ammo = pockets.flatMap((pocket) =>
  pocket.pocket_type === "MAGAZINE"
    ? Object.keys(pocket.ammo_restriction ?? {})
    : []
);

const uncraft = (() => {
  const recipe = data.uncraftRecipe(item.id);
  if (!recipe) return undefined;
  const normalizedUsing = recipe.using
    ? Array.isArray(recipe.using)
      ? recipe.using
      : [[recipe.using, 1] as [string, number]]
    : [];
  const requirements = normalizedUsing
    .map(
      ([id, count]) =>
        [data.byId("requirement", id) as RequirementData, count] as const
    )
    .concat([[recipe, 1]]);
  const components = requirements.flatMap(([req, count]) => {
    return data
      .flattenRequirement(req.components ?? [], (x) => x.components)
      .map((x) => x.map((x) => ({ ...x, count: x.count * count })));
  });
  const defaultComponents = components.map((c) => c[0]);
  return { components: defaultComponents };
})();

const vparts = data
  .byType("vehicle_part")
  .filter((vp) => vp.id && vp.item === item.id);

const ascii_picture =
  item.ascii_picture && data.byId("ascii_art", item.ascii_picture);
</script>

<h1><ItemSymbol {item} /> {singularName(item)}</h1>
<section>
  <h1>General</h1>
  <div class="side-by-side no-margin">
    <div>
      <dl>
        {#if materials.length}
          <dt>Material</dt>
          <dd>
            <ul class="comma-separated">
              {#each materials as m}
                <li><ThingLink type="material" id={m.id} /></li>
              {/each}
            </ul>
          </dd>
        {/if}
        <dt>Volume</dt>
        <dd>{asLiters(item.volume)}</dd>
        <dt>Weight</dt>
        <dd>{asKilograms(item.weight)}</dd>
        <dt>Length</dt>
        <dd>{length(item)}</dd>
        {#if ammo.length}
          <dt>Ammo</dt>
          <dd>
            <ul class="no-bullets">
              {#each ammo.map( (id) => ({ id, max_charges: maxCharges(id) }) ) as { id: ammo_id, max_charges }}
                <li>
                  {max_charges}
                  {item.type === "GUN" ? "round" : "charge"}{max_charges === 1
                    ? ""
                    : "s"} of
                  <ThingLink type="ammunition_type" id={ammo_id} />
                </li>
              {/each}
            </ul>
          </dd>
        {/if}
        {#if magazine_compatible.length}
          <dt>Compatible Magazines</dt>
          <dd>
            <ul class="comma-separated">
              {#each magazine_compatible as { type, id }}
                <li><ThingLink {type} {id} /></li>
              {/each}
            </ul>
          </dd>
        {/if}
        <dt>Flags</dt>
        <dd>
          <ul class="comma-separated">
            <!-- prettier-ignore -->
            {#each flags as f}<li><ThingLink type="json_flag" id={f.id} /></li>{:else}<li><em>none</em></li>{/each}
          </ul>
        </dd>
        {#if faults.length}
          <dt>Possible Faults</dt>
          <dd>
            <ul class="comma-separated">
              {#each faults as fault}
                <li><ThingLink type="fault" id={fault.id} /></li>
              {/each}
            </ul>
          </dd>{/if}

        {#if qualities.length}
          <dt>Qualities</dt>
          <dd>
            <ul class="no-bullets">
              {#each qualities as { quality, level }}
                <li>
                  Has level <strong
                    >{level}
                    <ThingLink type="tool_quality" id={quality.id} /></strong> quality.
                </li>
              {/each}
            </ul>
          </dd>
        {/if}

        {#if vparts.length}
          <dt>Vehicle Parts</dt>
          <dd>
            <ul class="comma-separated">
              {#each vparts as vpart}
                <li><ThingLink type="vehicle_part" id={vpart.id} /></li>
              {/each}
            </ul>
          </dd>
        {/if}

        {#if uncraft}
          <dt>Disassembles Into</dt>
          <dd>
            <ul class="comma-separated">
              {#each uncraft.components as { id, count }}
                <li><ThingLink {id} {count} type="item" /></li>
              {/each}
            </ul>
          </dd>
        {/if}
      </dl>
      <p style="color: var(--cata-color-gray); margin-bottom: 0;">
        {singular(item.description)}
      </p>
    </div>
    <div>
      {#if ascii_picture}
        <AsciiPicture picture={ascii_picture} />
      {/if}
    </div>
  </div>
</section>
{#if item.type === "BOOK"}
  <BookInfo {item} />
{/if}
{#if item.type === "ARMOR" || item.type === "TOOL_ARMOR"}
  <ArmorInfo {item} />
{/if}
{#if item.type === "TOOL" || item.type === "TOOL_ARMOR"}
  <ToolInfo {item} />
{/if}
{#if item.type === "ENGINE" && item.displacement}
  <section>
    <h1>Engine</h1>
    <dl>
      <dt>Displacement</dt>
      <dd>{item.displacement} cc</dd>
    </dl>
  </section>
{/if}
{#if item.type === "COMESTIBLE"}
  <ComestibleInfo {item} />
{/if}
{#if item.type === "WHEEL"}
  <WheelInfo {item} />
{/if}
{#if item.seed_data}
  <section>
    <h1>Grows Into</h1>
    <dl>
      <dt>Harvest Results</dt>
      <dd>
        <ul class="comma-separated">
          {#each [item.seed_data.fruit].concat(item.seed_data.byproducts ?? []) as id}
            <li><ThingLink type="item" {id} /></li>
          {/each}
        </ul>
      </dd>
      <dt>Growing Time</dt>
      <dd>{item.seed_data.grow}</dd>
    </dl>
  </section>
{/if}
{#if item.bashing || item.cutting || item.type === "GUN" || item.type === "AMMO"}
  <div class="side-by-side">
    <MeleeInfo {item} />
    {#if item.type === "GUN"}
      <GunInfo {item} />
    {:else if item.type === "AMMO"}
      <AmmoInfo {item} />
    {/if}
  </div>
{/if}
{#if pockets.filter((p) => p.pocket_type === "CONTAINER").length}
  <section>
    <h1>Pockets</h1>
    {#each pockets.filter((p) => p.pocket_type === "CONTAINER") as pocket}
      <dl>
        {#if pocket.max_contains_volume != null}
          <dt>Volume Capacity</dt>
          <dd>{pocket.max_contains_volume}</dd>
        {/if}
        {#if pocket.max_contains_weight != null}
          <dt>Weight Capacity</dt>
          <dd>{pocket.max_contains_weight}</dd>
        {/if}
        {#if pocket.ammo_restriction}
          <dt>Ammo Restriction</dt>
          <dd>
            <ul>
              {#each [...Object.entries(pocket.ammo_restriction)] as [id, count]}
                <li>
                  {count} round{count === 1 ? "" : "s"} of <ThingLink
                    {id}
                    type="ammunition_type" />
                </li>
              {/each}
            </ul>
          </dd>
        {/if}
        {#if pocket.max_item_length}
          <dt>Max Item Length</dt>
          <dd>{pocket.max_item_length}</dd>
        {/if}
        {#if pocket.min_item_volume !== "0 ml"}
          <dt>Min Item Volume</dt>
          <dd>{pocket.min_item_volume}</dd>
        {/if}
        <dt>Moves to Remove Item</dt>
        <dd>{pocket.moves}</dd>
        {#if pocket.flag_restriction}
          <dt>Flag Restriction</dt>
          <dd>
            <ul class="comma-separated">
              {#each pocket.flag_restriction as flag}
                <li><ThingLink type="json_flag" id={flag} /></li>
              {/each}
            </ul>
          </dd>
        {/if}
        {#if pocket.item_restriction}
          <dt>Item Restriction</dt>
          <dd>
            <ul class="comma-separated">
              {#each pocket.item_restriction as item}
                <li><ThingLink type="item" id={item} /></li>
              {/each}
            </ul>
          </dd>
        {/if}
      </dl>
    {/each}
  </section>
{/if}
<ComponentOf item_id={item.id} />

<div class="hide-header-if-no-sections">
  <h2>Obtaining</h2>
  <Recipes item_id={item.id} />
  <DroppedBy item_id={item.id} />
  <GrownFrom item_id={item.id} />
  <Disassembly item_id={item.id} />
  <Deconstruct item_id={item.id} />
  <SpawnedIn item_id={item.id} />
</div>

<style>
.hide-header-if-no-sections > h2:last-child {
  display: none;
}
</style>
