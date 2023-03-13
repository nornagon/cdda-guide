<script lang="ts">
import { t } from "@transifex/native";

import { singularName } from "../data";
import type { MartialArtBuff, MartialArtRequirements } from "../types";
import ThingLink from "./ThingLink.svelte";

const _context = "Martial Art";

export let item: MartialArtRequirements;
export let buffMap: Map<string, MartialArtBuff> = new Map();

const requiredBuffs =
  typeof item.req_buffs === "string" ? [item.req_buffs] : item.req_buffs ?? [];
</script>

<dt>{t("Required Skills")}</dt>
<dd>
  {#each item.skill_requirements ?? [] as { name, level }, i}
    <ThingLink type="skill" id={name} /> ({level}){#if i + 2 === item.skill_requirements?.length}{" and "}{:else if i + 1 !== item.skill_requirements?.length}{", "}{/if}
  {:else}
    <em>{t("none")}</em>
  {/each}
</dd>
{#if requiredBuffs.length}
  <dt>{t("Required Buffs", { _context })}</dt>
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
  <dt>{t("Requires Adjacent Wall", { _context })}</dt>
  <dd>{t("Yes")}</dd>
{/if}
<dt>{t("Melee Weapon Allowed", { _context })}</dt>
<dd>{item.melee_allowed ? t("Yes") : t("No")}</dd>
<dt>{t("Unarmed Allowed", { _context })}</dt>
<dd>{item.unarmed_allowed ? t("Yes") : t("No")}</dd>
<dt>{t("Unarmed Weapon Allowed", { _context })}</dt>
<dd>{item.unarmed_weapons_allowed ?? true ? t("Yes") : t("No")}</dd>
