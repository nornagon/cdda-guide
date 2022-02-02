<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../data";
import { singularName } from "../data";
import type { Construction, RequirementData } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

const data = getContext<CddaData>("data");

export let construction: Construction;
export let includeTitle: boolean = false;

const using =
  typeof construction.using === "string"
    ? [[construction.using, 1] as [string, number]]
    : construction.using ?? [];

const requirements = using
  .map(
    ([id, count]) =>
      [data.byId("requirement", id) as RequirementData, count] as const
  )
  .concat([[construction, 1]]);

const tools = requirements.flatMap(([req, count]) => {
  return data
    .flattenRequirement(req.tools ?? [], (x) => x.tools, {
      expandSubstitutes: true,
    })
    .map((x) => x.map((x) => ({ ...x, count: x.count * count })));
});
const components = requirements.flatMap(([req, count]) => {
  return data
    .flattenRequirement(req.components ?? [], (x) => x.components)
    .map((x) => x.map((x) => ({ ...x, count: x.count * count })));
});
const qualities = requirements.flatMap(([req, _count]) => {
  return (req.qualities ?? []).map((x) => (Array.isArray(x) ? x : [x]));
});

const byproducts = data.flattenItemGroup(
  data.normalizeItemGroup(construction.byproducts, "collection")
);
</script>

<section>
  {#if includeTitle}
    <h1>{singularName(data.byId("construction_group", construction.group))}</h1>
  {/if}
  <dl>
    <dt>Required Skills</dt>
    <dd>
      {#each construction.required_skills ?? [] as [id, level], i}
        <ThingLink type="skill" {id} /> ({level}){#if i === construction.required_skills.length - 2}{" and "}{:else if i !== construction.required_skills.length - 1}{", "}{/if}
      {:else}
        {#if construction.skill}
          <ThingLink type="skill" id={construction.skill} /> ({construction.difficulty ??
            0})
        {:else}
          <em>none</em>
        {/if}
      {/each}
    </dd>
    <dt>Time</dt>
    <dd>
      {typeof construction.time === "number"
        ? `${construction.time} m`
        : construction.time ?? "0 m"}
    </dd>
    {#if construction.pre_terrain}
      <dt>Requires</dt>
      <dd>
        <ItemSymbol
          item={data.byId(
            construction.pre_terrain.startsWith("f_") ? "furniture" : "terrain",
            construction.pre_terrain
          )} />
        <ThingLink
          type={construction.pre_terrain.startsWith("f_")
            ? "furniture"
            : "terrain"}
          id={construction.pre_terrain} />
      </dd>
    {/if}
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
            </li>{/each}
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
            </li>{/each}
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
            </li>{/each}
        </ul>
      </dd>
    {/if}
    {#if byproducts.length}
      <dt>Byproducts</dt>
      <dd>
        <ul class="comma-separated">
          {#each byproducts as { id, count }}
            <li>
              <ItemSymbol item={data.byId("item", id)} />
              <ThingLink type="item" {id} {count} />
            </li>
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
  {#if construction.pre_note}
    <p style="color: var(--cata-color-gray)">{construction.pre_note}</p>
  {/if}
  <details>
    <summary>Construction JSON</summary>
    <pre>{JSON.stringify(construction, null, 2)}</pre>
  </details>
</section>
