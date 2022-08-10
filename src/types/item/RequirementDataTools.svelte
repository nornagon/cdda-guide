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
                "\x000",
                quality.level
              )
              .replace(/\$./g, "")}>
            <ThingLink type="tool_quality" id={quality.id} slot="0" />
          </InterpolatedTranslation>{/each}
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
