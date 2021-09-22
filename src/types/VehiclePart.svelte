<script lang="ts">
import { getContext } from "svelte";

import {
  asKilograms,
  asLiters,
  CddaData,
  singular,
  singularName,
} from "../data";

import type { ItemGroup, VehiclePart } from "../types";
import RequirementData from "./item/RequirementData.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: VehiclePart;

function bonusLabel(item: VehiclePart) {
  const light_flags = [
    "LIGHT",
    "CONE_LIGHT",
    "WIDE_CONE_LIGHT",
    "CIRCLE_LIGHT",
    "DOME_LIGHT",
    "AISLE_LIGHT",
    "EVENTURN",
    "ODDTURN",
    "ATOMIC_LIGHT",
  ];
  const flags = item.flags ?? [];
  if (flags.includes("SEATBELT")) return "Strength";
  else if (flags.includes("HORN")) return "Noise";
  else if (flags.includes("MUFFLER")) return "Noise Reduction";
  else if (flags.includes("VISION")) return "Range";
  else if (light_flags.some((lf) => flags.includes(lf))) return "Light";
  else if (flags.includes("REAPER")) return "Plant Harvested";
}

const data = getContext<CddaData>("data");

function showProbability(prob: number) {
  const ret = (prob * 100).toFixed(2);
  if (ret === "0.00") return "< 0.01%";
  return ret + "%";
}

const breaksIntoGroup: ItemGroup | null =
  typeof item.breaks_into === "string"
    ? data.byId("item_group", item.breaks_into)
    : Array.isArray(item.breaks_into)
    ? { subtype: "collection", entries: item.breaks_into }
    : item.breaks_into
    ? item.breaks_into
    : null;
const breaksIntoGroupFlattened =
  breaksIntoGroup && data.flattenItemGroup(breaksIntoGroup);

function parseDuration(duration: string | number) {
  if (typeof duration === "number") return duration / 100;
  const turns = 1;
  const seconds = 1;
  const minutes = 60;
  const hours = minutes * 60;
  const days = hours * 24;
  const units: [string, number][] = [
    ["turns", 1 * turns],
    ["turn", 1 * turns],
    ["t", 1 * turns],
    ["seconds", 1 * seconds],
    ["second", 1 * seconds],
    ["s", 1 * seconds],
    ["minutes", 1 * minutes],
    ["minute", 1 * minutes],
    ["m", 1 * minutes],
    ["hours", 1 * hours],
    ["hour", 1 * hours],
    ["h", 1 * hours],
    ["days", 1 * days],
    ["day", 1 * days],
    ["d", 1 * days],
  ];
  const [num, unit] = duration.trim().split(/\s+/);
  const multiplier = units.find((x) => x[0] === unit);
  if (!multiplier) throw new Error(`bad duration: ${JSON.stringify(duration)}`);
  return Number(num) * multiplier[1];
}

function asMinutes(duration: string | number) {
  const seconds = parseDuration(duration);
  return `${Math.round(seconds / 60)} m`;
}
</script>

<h1>
  {item.name ? singularName(item) : singularName(data.byId("item", item.item))}
</h1>

<section>
  <h1>Vehicle Part</h1>
  <dl>
    <dt>Item</dt>
    <dd><ThingLink id={item.item} type="item" /></dd>
    <dt>Weight</dt>
    <dd>{asKilograms(data.byId("item", item.item).weight)}</dd>
    {#if item.fuel_type}
      <dt>Charge</dt>
      <dd><ThingLink type="item" id={item.fuel_type} /></dd>
    {/if}
    <dt title="Maximum damage part can sustain before being destroyed">
      Durability
    </dt>
    <dd>{item.durability ?? 0}</dd>
    {#if item.size}
      <dt>Capacity</dt>
      <dd>{asLiters(item.size)}</dd>
    {/if}
    {#if item.folded_volume}
      <dt>Folded Volume</dt>
      <dd>{asLiters(item.folded_volume)}</dd>
    {/if}
    {#if item.qualities?.length}
      <dt>Qualities</dt>
      <dd>
        <ul class="no-bullets">
          {#each item.qualities as [quality, level]}
            <li>
              Has level <strong
                >{level ?? 1}
                <ThingLink type="tool_quality" id={quality} /></strong> quality.
            </li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.comfort}
      <dt>Comfort</dt>
      <dd>{item.comfort}</dd>
    {/if}
    {#if item.floor_bedding_warmth}
      <dt>Bedding Warmth</dt>
      <dd>{item.floor_bedding_warmth}</dd>
    {/if}
    <dt>Damage</dt>
    <dd>{item.damage_modifier ?? 100}%</dd>
    {#if item.epower}
      <dt>Electric Power</dt>
      <dd>{item.epower}</dd>
    {/if}
    {#if item.energy_consumption}
      <dt>Drain</dt>
      <dd>{-item.energy_consumption}</dd>
    {/if}
    {#if item.power}
      <dt>Power</dt>
      <dd>
        {item.power}
        {#if item.muscle_power_factor}
          + (str &minus; 8) &times; {item.muscle_power_factor}
        {/if}
      </dd>
    {/if}
    {#if item.bonus && bonusLabel(item)}
      <dt>{bonusLabel(item)}</dt>
      <dd>{item.bonus}</dd>
    {/if}
    {#if breaksIntoGroupFlattened?.length}
      <dt>Breaks Into</dt>
      <dd>
        <ul class="comma-separated">
          {#each breaksIntoGroupFlattened as { id, count, prob }}
            <!-- prettier-ignore -->
            <li><ThingLink {id} {count} type="item" />{#if prob !== 1} ({showProbability(prob)}){/if}</li>
          {/each}
        </ul>
      </dd>
    {/if}
    <dt>Flags</dt>
    <dd>
      <ul class="comma-separated">
        {#each item.flags ?? [] as flag}
          <li><ThingLink type="json_flag" id={flag} /></li>
        {:else}
          <em>none</em>
        {/each}
      </ul>
    </dd>
  </dl>

  <p style="color: var(--cata-color-gray)">
    {singular(item.description ?? data.byId("item", item.item).description)}
  </p>
</section>

<div class="side-by-side">
  <section>
    <h1>Install</h1>
    <dl>
      <dt>Skills Required</dt>
      <dd>
        {#each item.requirements?.install?.skills ?? [] as [skill, level], i}
          <ThingLink type="skill" id={skill} /> ({level}){#if i === item.requirements.install.skills.length - 2}{" and "}{:else if i !== item.requirements.install.skills.length - 1}{", "}{/if}
        {:else}
          none
        {/each}
      </dd>
      <dt title="Time required goes down with better skills">Time</dt>
      <dd>{item.requirements?.install?.time ?? "1 hour"}</dd>
      <RequirementData
        requirement={{
          ...(item.requirements?.install ?? {}),
          components: (item.requirements?.install?.components ?? []).concat([
            [[item.item, 1]],
          ]),
        }} />
    </dl>
  </section>

  <section>
    <h1>Remove</h1>
    <dl>
      <dt>Skills Required</dt>
      <dd>
        {#each item.requirements?.removal?.skills ?? [] as [skill, level], i}
          <ThingLink type="skill" id={skill} /> ({level}){#if i === item.requirements.removal.skills.length - 2}{" and "}{:else if i !== item.requirements.removal.skills.length - 1}{", "}{/if}
        {:else}
          none
        {/each}
      </dd>
      <dt title="Time required goes down with better skills">Time</dt>
      <dd>
        {item.requirements?.removal?.time ??
          asMinutes(
            `${
              parseDuration(item.requirements?.install?.time ?? "1 hour") / 2
            } s`
          )}
      </dd>
      {#if item.requirements?.removal}
        <RequirementData requirement={item.requirements.removal} />
      {/if}
    </dl>
  </section>
</div>

{#if item.requirements?.repair}
  <section>
    <h1>Repair</h1>
    <dl>
      <dt>Skills Required</dt>
      <dd>
        {#each item.requirements.repair?.skills ?? [] as [skill, level], i}
          <ThingLink type="skill" id={skill} /> ({level}){#if i === item.requirements.repair.skills.length - 2}{" and "}{:else if i !== item.requirements.repair.skills.length - 1}{", "}{/if}
        {:else}
          none
        {/each}
      </dd>
      <dt title="Time required goes down with better skills">Time</dt>
      <dd>{item.requirements?.repair?.time ?? "1 hour"}</dd>
      <RequirementData requirement={item.requirements.repair} />
    </dl>
    <p style="color: var(--cata-color-gray); font-style: italic">
      Repair time and requirements are lower for parts that are less damaged.
    </p>
  </section>
{/if}
