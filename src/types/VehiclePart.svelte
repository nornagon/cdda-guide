<script lang="ts">
import { t } from "@transifex/native";
import { getContext } from "svelte";

import {
  asKilograms,
  asLiters,
  asMinutes,
  CddaData,
  getVehiclePartIdAndVariant,
  parseDuration,
  showProbability,
  singular,
  singularName,
} from "../data";
import LimitedList from "../LimitedList.svelte";

import type { ItemGroupData, VehiclePart } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import RequirementData from "./item/RequirementData.svelte";
import ThingLink from "./ThingLink.svelte";
import ModTag from "./ModTag.svelte";

const _context = "Vehicle Part";

interface Props {
  item: VehiclePart;
}

let { item }: Props = $props();

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
  if (flags.includes("SEATBELT")) return t("Strength", { _context });
  else if (flags.includes("HORN")) return t("Noise", { _context });
  else if (flags.includes("MUFFLER")) return t("Noise Reduction", { _context });
  else if (flags.includes("VISION")) return t("Range", { _context });
  else if (light_flags.some((lf) => flags.includes(lf)))
    return t("Light", { _context });
  else if (flags.includes("REAPER")) return t("Plant Harvested", { _context });
}

const data = getContext<CddaData>("data");

const breaksIntoGroup: ItemGroupData | null =
  typeof item.breaks_into === "string"
    ? data.convertTopLevelItemGroup(data.byId("item_group", item.breaks_into))
    : Array.isArray(item.breaks_into)
      ? { subtype: "collection", entries: item.breaks_into }
      : item.breaks_into
        ? item.breaks_into
        : null;
const breaksIntoGroupFlattened =
  breaksIntoGroup && data.flattenItemGroup(breaksIntoGroup);

const vehiclesContainingPart = data.byType("vehicle").filter(
  (v) =>
    v.id &&
    v.parts.some((part) => {
      const parts = part.part
        ? [{ part: part.part, fuel: part.fuel }]
        : (part.parts?.map((part) =>
            typeof part === "string" ? { part } : part,
          ) ?? []);
      return parts.some(
        (p) => getVehiclePartIdAndVariant(data, p.part)[0] === item.id,
      );
    }),
);
vehiclesContainingPart.sort((a, b) =>
  singularName(a).localeCompare(singularName(b)),
);
</script>

<h1>
  <ItemSymbol {item} />
  {item.name
    ? singularName(item)
    : item.item
      ? singularName(data.byId("item", item.item))
      : item.id}
  <ModTag {item} clickable />
</h1>

<section>
  <h1>{t("Vehicle Part")}</h1>
  <dl>
    <dt>{t("Item")}</dt>
    <dd><ThingLink id={item.item} type="item" /></dd>
    <dt>{t("Location")}</dt>
    <dd>
      {item.flags?.includes("APPLIANCE")
        ? "structure"
        : (item.location ?? "none")}
    </dd>
    <dt>{t("Weight")}</dt>
    <dd>{asKilograms(data.byId("item", item.item).weight ?? 0)}</dd>
    {#if item.fuel_options?.length}
      <dt>{t("Charge", { _context })}</dt>
      <dd>
        <ul class="comma-separated or">
          {#each item.fuel_options as fuel_id}
            <li><ThingLink type="item" id={fuel_id} /></li>
          {/each}
        </ul>
      </dd>
    {:else if item.fuel_type}
      <dt>{t("Charge", { _context })}</dt>
      <dd><ThingLink type="item" id={item.fuel_type} /></dd>
    {/if}
    <dt title="Maximum damage part can sustain before being destroyed">
      {t("Durability", { _context })}
    </dt>
    <dd>{item.durability ?? 0}</dd>
    {#if item.flags?.includes("WHEEL")}
      {#if item.wheel_type}
        <dt>Wheel Type</dt>
        <dd>{item.wheel_type}</dd>
      {/if}
      <dt>Contact Area</dt>
      <dd>{item.contact_area ?? 1} cm²</dd>
      <dt>Rolling Resistance</dt>
      <dd>{item.rolling_resistance ?? 1}</dd>
    {/if}
    {#if item.size}
      <dt>{t("Capacity", { _context })}</dt>
      <dd>{asLiters(item.size)}</dd>
    {/if}
    {#if item.folded_volume}
      <dt>{t("Folded Volume", { _context })}</dt>
      <dd>{asLiters(item.folded_volume)}</dd>
    {/if}
    {#if item.qualities?.length}
      <dt>{t("Qualities", { _context })}</dt>
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
      <dt>{t("Comfort", { _context })}</dt>
      <dd>{item.comfort}</dd>
    {/if}
    {#if item.floor_bedding_warmth}
      <dt>{t("Bedding Warmth", { _context })}</dt>
      <dd>{item.floor_bedding_warmth}</dd>
    {/if}
    <dt>{t("Damage", { _context })}</dt>
    <dd>{item.damage_modifier ?? 100}%</dd>
    {#if item.epower}
      <dt>{t("Electric Power", { _context })}</dt>
      <dd>{item.epower}</dd>
    {/if}
    {#if item.energy_consumption}
      <dt>{t("Energy Consumption", { _context })}</dt>
      <dd>{item.energy_consumption} / sec</dd>
    {/if}
    {#if item.power}
      <dt>{t("Power", { _context })}</dt>
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
    {#if item.pseudo_tools?.length}
      <dt>
        {t("Provides", {
          _context,
          _comment: "List of tools that the vehicle part acts as",
        })}
      </dt>
      <dd>
        <ul class="comma-separated">
          {#each item.pseudo_tools as { id }}
            <li><ThingLink type="item" {id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if breaksIntoGroupFlattened?.length}
      <dt>
        {t("Breaks Into", {
          _context,
          _comment:
            "List of possible parts obtained by bashing the vehicle part",
        })}
      </dt>
      <dd>
        <ul class="comma-separated">
          {#each breaksIntoGroupFlattened as { id, count, prob }}
            <!-- prettier-ignore -->
            <li><ThingLink {id} {count} type="item" />{#if prob !== 1} ({showProbability(prob)}){/if}</li>
          {/each}
        </ul>
      </dd>
    {/if}
    <dt>{t("Flags")}</dt>
    <dd>
      <ul class="comma-separated">
        {#each item.flags ?? [] as flag}
          <li><ThingLink type="json_flag" id={flag} /></li>
        {:else}
          <em>{t("none")}</em>
        {/each}
      </ul>
    </dd>
  </dl>

  <p style="color: var(--cata-color-gray)">
    {singular(
      item.description ?? data.byId("item", item.item).description ?? "",
    )}
  </p>
</section>

<div class="side-by-side">
  <section>
    <h1>{t("Install", { _context })}</h1>
    <dl>
      <dt>{t("Skills Required")}</dt>
      <dd>
        {#each item.requirements?.install?.skills ?? [] as [skill, level], i}
          <ThingLink type="skill" id={skill} /> ({level}){#if i + 2 === item.requirements?.install?.skills?.length}{" and "}{:else if i + 1 !== item.requirements?.install?.skills?.length}{", "}{/if}
        {:else}
          {t("none")}
        {/each}
      </dd>
      <dt title="Time required goes down with better skills">
        {t("Time", { _context, _comment: "Time taken to perform the action" })}
      </dt>
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
    <h1>{t("Remove", { _context })}</h1>
    <dl>
      <dt>{t("Skills Required")}</dt>
      <dd>
        {#each item.requirements?.removal?.skills ?? [] as [skill, level], i}
          <ThingLink type="skill" id={skill} /> ({level}){#if i + 2 === item.requirements?.removal?.skills?.length}{" and "}{:else if i + 1 !== item.requirements?.removal?.skills?.length}{", "}{/if}
        {:else}
          none
        {/each}
      </dd>
      <dt title="Time required goes down with better skills">
        {t("Time", { _context, _comment: "Time taken to perform the action" })}
      </dt>
      <dd>
        {item.requirements?.removal?.time ??
          asMinutes(
            `${
              parseDuration(item.requirements?.install?.time ?? "1 hour") / 2
            } s`,
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
    <h1>{t("Repair", { _context })}</h1>
    <dl>
      <dt>{t("Skills Required")}</dt>
      <dd>
        {#each item.requirements.repair?.skills ?? [] as [skill, level], i}
          <ThingLink type="skill" id={skill} /> ({level}){#if i + 2 === item.requirements?.repair?.skills?.length}{" and "}{:else if i + 1 !== item.requirements?.repair?.skills?.length}{", "}{/if}
        {:else}
          {t("none")}
        {/each}
      </dd>
      <dt title="Time required goes down with better skills">
        {t("Time", { _context, _comment: "Time taken to perform the action" })}
      </dt>
      <dd>{item.requirements?.repair?.time ?? "1 hour"}</dd>
      <RequirementData requirement={item.requirements.repair} />
    </dl>
    <p style="color: var(--cata-color-gray); font-style: italic">
      {t(
        "Repair time and requirements are lower for parts that are less damaged.",
      )}
    </p>
  </section>
{/if}

{#if vehiclesContainingPart.length}
  <section>
    <h1>
      {t("Vehicles", {
        _context,
        _comment:
          "Heading for list of vehicles which contain this vehicle part",
      })}
    </h1>
    <LimitedList items={vehiclesContainingPart}>
      {#snippet children({ item })}
        <ThingLink type="vehicle" id={item.id} />
      {/snippet}
    </LimitedList>
  </section>
{/if}
