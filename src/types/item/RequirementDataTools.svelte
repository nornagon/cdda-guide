<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";

import type { Recipe, RequirementData } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let requirement: RequirementData & { using?: Recipe["using"] };
export let direction: "uncraft" | "craft" = "craft";

const data = getContext<CddaData>("data");

let { tools, qualities } =
  direction === "craft"
    ? data.normalizeRequirements(requirement)
    : data.normalizeRequirementsForDisassembly(requirement);
</script>

<dt>Tools Required</dt>
<dd>
  <ul>
    {#each qualities ?? [] as qualityChoices}
      <li>
        {#each qualityChoices as quality, i}
          {#if i !== 0}{" OR "}{/if}
          {quality.amount ?? 1} tool{(quality.amount ?? 1) === 1 ? "" : "s"}
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
