<script lang="ts">
import { t } from "@transifex/native";
import InterpolatedTranslation from "../../InterpolatedTranslation.svelte";

import { getContext } from "svelte";
import { CddaData, i18n, singularName } from "../../data";

import type { Recipe, RequirementData } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let requirement: RequirementData & { using?: Recipe["using"] };
export let direction: "uncraft" | "craft" = "craft";

const _context = "Requirement";
const data = getContext<CddaData>("data");

let { tools, qualities } =
  direction === "craft"
    ? data.normalizeRequirements(requirement)
    : data.normalizeRequirementsForDisassembly(requirement);
</script>

<dt>{t("Tools Required", { _context })}</dt>
<dd>
  <ul>
    {#each qualities ?? [] as qualityChoices}
      <li>
        {#each qualityChoices as quality, i}
          {#if i !== 0}{" OR "}{/if}
          <InterpolatedTranslation
            str={i18n
              ._n(
                "%1$d tool with %2$s of %3$d or more.",
                "%1$d tools with %2$s of %3$d or more.",
                quality.amount ?? 1,
                quality.amount ?? 1,
                "{tool_quality}",
                quality.level
              )
              .replace(/\$./g, "")}
            slot0="tool_quality">
            <ThingLink type="tool_quality" id={quality.id} slot="0" />
          </InterpolatedTranslation>{/each}
      </li>
    {/each}
    {#each tools as toolChoices}
      <li>
        {#each toolChoices as tool, i}
          {#if i !== 0}{i18n.__(" OR ")}{/if}
          {#if tool.count <= 0}
            {#if data.craftingPseudoItem(tool.id)}
              <a href="#/furniture/{data.craftingPseudoItem(tool.id)}"
                >{singularName(data.byId("item", tool.id))}</a>
            {:else}
              <ThingLink type="item" id={tool.id} />
            {/if}
          {:else}
            <InterpolatedTranslation
              str={i18n
                .dcnpgettext(
                  null,
                  "requirement",
                  "%1$s (%2$d charge)",
                  "%1$s (%2$d charges)",
                  tool.count,
                  "{item}",
                  tool.count
                )
                .replace(/\$./g, "")}
              slot0="item">
              <svelte:fragment slot="0">
                {#if data.craftingPseudoItem(tool.id)}
                  <a href="#/furniture/{data.craftingPseudoItem(tool.id)}"
                    >{singularName(data.byId("item", tool.id))}</a>
                {:else}
                  <ThingLink type="item" id={tool.id} />
                {/if}
              </svelte:fragment>
            </InterpolatedTranslation>
          {/if}
        {/each}
      </li>
    {/each}
  </ul>
</dd>
