<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";

import type { Recipe, RequirementData } from "../../types";
import ThingLink from "../ThingLink.svelte";
import RequirementDataTools from "./RequirementDataTools.svelte";

export let requirement: RequirementData & { using?: Recipe["using"] };

const data = getContext<CddaData>("data");

let { tools, qualities, components } = data.normalizeRequirements(requirement);
</script>

{#if qualities?.length || tools?.length}
  <RequirementDataTools {requirement} />
{/if}
{#if components.length}
  <dt>Components</dt>
  <dd>
    <ul>
      {#each components as componentChoices}
        <li>
          {#each componentChoices
            .map((c) => ({ ...c, item: data.byId("item", c.id) }))
            .filter((c) => c.item) as { id, count }, i}
            {#if i !== 0}{" OR "}{/if}
            <ThingLink type="item" {id} {count} />
          {/each}
        </li>
      {/each}
    </ul>
  </dd>
{/if}
