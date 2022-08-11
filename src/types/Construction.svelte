<script lang="ts">
import { t } from "@transifex/native";

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
</script>

<section>
  {#if includeTitle}
    <h1>{singularName(data.byId("construction_group", construction.group))}</h1>
  {/if}
  <dl>
    <dt>{t("Required Skills")}</dt>
    <dd>
      {#each construction.required_skills ?? [] as [id, level], i}
        <ThingLink type="skill" {id} /> ({level}){#if i === construction.required_skills.length - 2}{" and "}{:else if i !== construction.required_skills.length - 1}{", "}{/if}
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
  </dl>
  {#if construction.pre_note}
    <p style="color: var(--cata-color-gray)">
      {singular(construction.pre_note)}
    </p>
  {/if}
  <details>
    <summary>{t("Construction JSON", { _context })}</summary>
    <pre>{JSON.stringify(construction, null, 2)}</pre>
  </details>
</section>
