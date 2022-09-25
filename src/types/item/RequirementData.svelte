<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import type { CddaData } from "../../data";

import type { Recipe, RequirementData } from "../../types";
import ThingLink from "../ThingLink.svelte";
import RequirementDataTools from "./RequirementDataTools.svelte";

const _context = "Requirement";
export let requirement: RequirementData & { using?: Recipe["using"] };

const data = getContext<CddaData>("data");

let { tools, qualities, components } = data.normalizeRequirements(requirement);
</script>

{#if qualities?.length || tools?.length}
  <RequirementDataTools {requirement} />
{/if}
{#if components.length}
  <dt>{t("Components", { _context })}</dt>
  <dd>
    <ul>
      {#each components as componentChoices}
        <li>
          {#each componentChoices
            .map(([id, count]) => ({ id, count, item: data.byId("item", id) }))
            .filter((c) => c.item) as { id, count }, i}
            {#if i !== 0}{" OR "}{/if}
            <ThingLink type="item" {id} {count} />
          {/each}
        </li>
      {/each}
    </ul>
  </dd>
{/if}
