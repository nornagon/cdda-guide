<script lang="ts">
import { t } from "@transifex/native";
import JsonView from "../JsonView.svelte";

import { getContext } from "svelte";
import { CddaData, i18n, singular } from "../data";
import { singularName } from "../data";
import type { Construction, RequirementData } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import RequirementDataTools from "./item/RequirementDataTools.svelte";
import ThingLink from "./ThingLink.svelte";

const data = getContext<CddaData>("data");
const _context = "Construction";

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

const components = requirements.flatMap(([req, count]) => {
  return data
    .flattenRequirement(req.components ?? [], (x) => x.components)
    .map((x) => x.map((x) => ({ ...x, count: x.count * count })));
});

const byproducts = data.flattenItemGroup(
  data.normalizeItemGroup(construction.byproducts, "collection")
);

const preFlags: { flag: string; force_terrain?: boolean }[] = [];
if (construction.pre_flags)
  for (const flag of [construction.pre_flags].flat()) {
    if (typeof flag === "string") {
      preFlags.push({ flag });
    } else preFlags.push(flag);
  }

function terrainOrFurniture(id: string) {
  return data.byId(id.startsWith("f_") ? "furniture" : "terrain", id);
}
</script>

<section>
  {#if includeTitle}
    <h1>{singularName(data.byId("construction_group", construction.group))}</h1>
  {/if}
  <dl>
    <dt>{t("Required Skills")}</dt>
    <dd>
      {#each construction.required_skills ?? [] as [id, level], i}
        <ThingLink type="skill" {id} /> ({level}){#if i + 2 === construction.required_skills?.length}{" and "}{:else if i + 1 !== construction.required_skills?.length}{", "}{/if}
      {:else}
        {#if construction.skill}
          <ThingLink type="skill" id={construction.skill} /> ({construction.difficulty ??
            0})
        {:else}
          <em>{t("none")}</em>
        {/if}
      {/each}
    </dd>
    <dt>{t("Time", { _context })}</dt>
    <dd>
      {typeof construction.time === "number"
        ? `${construction.time} m`
        : construction.time ?? "0 m"}
    </dd>
    {#if construction.pre_terrain}
      <dt>{t("Requires", { _context })}</dt>
      <dd>
        {#each [construction.pre_terrain].flat() as preTerrain, i}
          {#if i !== 0}{i18n.__(" OR ")}{/if}
          <ItemSymbol item={terrainOrFurniture(preTerrain)} />
          <ThingLink
            type={preTerrain.startsWith("f_") ? "furniture" : "terrain"}
            id={preTerrain} />
        {/each}
      </dd>
    {/if}
    {#if preFlags.length}
      <dt>{t("Requires Flags", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          {#each preFlags as { flag }}
            <li><ThingLink type="json_flag" id={flag} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    <RequirementDataTools requirement={construction} />
    {#if components.length}
      <dt>{t("Components", { _context: "Requirement" })}</dt>
      <dd>
        <ul>
          {#each components as componentChoices}
            <li>
              {#each componentChoices.map( (c) => ({ ...c, item: data.byId("item", c.id) }) ) as { id, count }, i}
                {#if i !== 0}{i18n.__(" OR ")}{/if}
                <ThingLink {id} {count} type="item" />
              {/each}
            </li>{/each}
        </ul>
      </dd>
    {/if}
    {#if byproducts.length}
      <dt>{t("Byproducts", { _context })}</dt>
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
    {#if !includeTitle && construction.post_terrain}
      <dt>{t("Creates", { _context })}</dt>
      <dd>
        {#if construction.post_terrain === "f_null"}
          <em
            >{t("nothing", {
              _context,
              _comment:
                'The furniture/terrain "created" by a deconstruction is...',
            })}</em>
        {:else}
          <ItemSymbol item={terrainOrFurniture(construction.post_terrain)} />
          <ThingLink
            type={construction.post_terrain.startsWith("f_")
              ? "furniture"
              : "terrain"}
            id={construction.post_terrain} />
        {/if}
      </dd>
    {/if}
  </dl>
  {#if construction.pre_note}
    <p style="color: var(--cata-color-gray)">
      {singular(construction.pre_note)}
    </p>
  {/if}
  <details>
    <summary>{t("Construction JSON", { _context })}</summary>
    <JsonView obj={construction} buildNumber={data.build_number} />
  </details>
</section>
