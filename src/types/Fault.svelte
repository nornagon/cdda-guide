<script lang="ts">
import { normalize, singularName } from "../data";
import type { CddaData } from "../data";
import ThingLink from "./ThingLink.svelte";
import { getContext } from "svelte";
import type { Fault } from "../types";

const data = getContext<CddaData>("data");

export let item: Fault;

const mendingMethods = (item.mending_methods ?? []).map((mm) => {
  const requirement =
    typeof mm.requirements === "string"
      ? data.byId("requirement", mm.requirements)
      : mm.requirements;
  const tools = data.flattenRequirement(
    requirement.tools ?? [],
    (r) => r.tools,
    { expandSubstitutes: true }
  );
  const components = data.flattenRequirement(
    requirement.components ?? [],
    (r) => r.components
  );
  const qualities = normalize(requirement.qualities ?? []); // TODO: flatten...?
  return { mending_method: mm, tools, components, qualities };
});

const fault_flag_descriptions = {
  NO_ALTERNATOR_CHARGE:
    "The alternator connected to this engine does not work.",
  BAD_COLD_START:
    "The engine starts as if the temperature was 20 F colder. Does not stack with multiples of itself.",
  IMMOBILIZER: "Prevents engine from starting and makes it beep.",
  BAD_FUEL_PUMP: "Prevents engine from starting and makes it stutter.",
  BAD_STARTER: "Prevents engine from starting and makes click noise.",
  DOUBLE_FUEL_CONSUMPTION:
    "Doubles fuel consumption of the engine. Does not stack with multiples of itself.",
  EXTRA_EXHAUST:
    "Makes the engine emit more exhaust smoke. Does not stack with multiples of itself.",
  REDUCE_ENG_POWER:
    "Multiplies engine power by 0.6. Does not stack with multiples of itself.",
  ENG_BACKFIRE: "Causes the engine to backfire as if it had zero hp.",
  BLACKPOWDER_FOULING_DAMAGE:
    "Causes the gun to take random acid damage over time.",
  NO_DIRTYING: "Prevents the gun from receiving `fault_gun_dirt` fault.",
  JAMMED_GUN: "Stops burst fire. Adds delay on next shot.",
  UNLUBRICATED:
    "Randomly causes screeching noise when firing and applies damage when that happens.",
  BAD_CYCLING:
    "One in 16 chance that the gun fails to cycle when fired resulting in `fault_gun_chamber_spent` fault.",
};
</script>

<h1>Fault: {singularName(item)}</h1>

<section>
  <dl>
    <dt>Flags</dt>
    <dd>
      <ul class="comma-separated">
        {#each item.flags ?? [] as flag}
          <li><abbr title={fault_flag_descriptions[flag]}>{flag}</abbr></li>
        {:else}
          <li><em>none</em></li>
        {/each}
      </ul>
    </dd>
  </dl>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>

{#if mendingMethods.length}
  <h2>Mending Methods</h2>
{/if}

{#each mendingMethods as { tools, components, qualities, mending_method }}
  <section>
    <h1>{singularName(mending_method)}</h1>
    <dl>
      <dt>Skills Used</dt>
      <dd>
        {#each mending_method.skills as { id, level }, i}
          <ThingLink type="skill" {id} /> ({level}){#if i === mending_method.skills.length - 2}{" and "}{:else if i !== mending_method.skills.length - 1}{", "}{/if}
        {:else}
          none
        {/each}
      </dd>
      <dt>Time to Complete</dt>
      <dd>{mending_method.time}</dd>
      {#if qualities.length || tools.length}
        <dt>Tools Required</dt>
        <dd>
          <ul>
            {#each qualities ?? [] as qualityChoices}
              <li>
                {#each qualityChoices as quality, i}
                  {#if i !== 0}{" OR "}{/if}
                  {quality.amount ?? 1} tool{(quality.amount ?? 1) === 1
                    ? ""
                    : "s"}
                  with <ThingLink type="tool_quality" id={quality.id} /> of {quality.level}
                  or more{""}{/each}.
              </li>
            {/each}
            {#each tools as toolChoices}
              <li>
                {#each toolChoices as tool, i}
                  {#if i !== 0}{" OR "}{/if}
                  {#if data.craftingPseudoItem(tool.id)}
                    <a href="#/furniture/{data.craftingPseudoItem(tool.id)}"
                      >{singularName(data.byId("item", tool.id))}</a>
                  {:else}
                    <ThingLink type="item" id={tool.id} />
                  {/if}
                  {#if tool.count > 0}({tool.count} charge{#if tool.count !== 1}s{/if}){/if}
                {/each}
              </li>
            {/each}
          </ul>
        </dd>
      {/if}
      {#if components.length}
        <dt>Components</dt>
        <dd>
          <ul>
            {#each components as componentChoices}
              <li>
                {#each componentChoices.map( (c) => ({ ...c, item: data.byId("item", c.id) }) ) as { id, count }, i}
                  {#if i !== 0}{" OR "}{/if}
                  <ThingLink {id} {count} type="item" />
                {/each}
              </li>
            {/each}
          </ul>
        </dd>
      {/if}
      {#if mending_method.turns_into}
        <dt>Turns Into</dt>
        <dd><ThingLink type="fault" id={mending_method.turns_into} /></dd>
      {/if}
    </dl>
  </section>
{/each}
