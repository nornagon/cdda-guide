<script lang="ts">
import { singularName } from "../data";
import type { MartialArtBuff, MartialArtRequirements } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: MartialArtRequirements;
export let buffMap: Map<string, MartialArtBuff> = new Map();

const requiredBuffs =
  typeof item.req_buffs === "string" ? [item.req_buffs] : item.req_buffs ?? [];
</script>

<dt>Required Skills</dt>
<dd>
  {#each item.skill_requirements ?? [] as { name, level }, i}
    <ThingLink type="skill" id={name} /> ({level}){#if i === item.skill_requirements.length - 2}{" and "}{:else if i !== item.skill_requirements.length - 1}{", "}{/if}
  {:else}
    <em>none</em>
  {/each}
</dd>
{#if requiredBuffs.length}
  <dt>Required Buffs</dt>
  <dd>
    <ul class="comma-separated">
      {#each requiredBuffs as buf}
        {#if buffMap.has(buf)}
          <li>{singularName(buffMap.get(buf))}</li>
        {:else}
          <li>{buf}</li>
        {/if}
      {/each}
    </ul>
  </dd>
{/if}
{#if item.wall_adjacent}
  <dt>Requires Adjacent Wall</dt>
  <dd>Yes</dd>
{/if}
<dt>Melee Weapon Allowed</dt>
<dd>{item.melee_allowed ? "Yes" : "No"}</dd>
<dt>Unarmed Allowed</dt>
<dd>{item.unarmed_allowed ? "Yes" : "No"}</dd>
<dt>Unarmed Weapon Allowed</dt>
<dd>{item.unarmed_weapons_allowed ?? true ? "Yes" : "No"}</dd>
