<script lang="ts">
import { t } from "@transifex/native";

import { i18n } from "../data";

import type { BonusContainer } from "../types";

function stringFromAffectedStat(stat: string): string {
  switch (stat) {
    case "hit":
      return "Accuracy";
    case "crit_chance":
      return "Critical Hit Chance";
    case "dodge":
      return "Dodge";
    case "block":
      return "Block";
    case "block_effectiveness":
      return "Block effectiveness";
    case "speed":
      return "Speed";
    case "movecost":
      return "Move cost";
    case "damage":
      return "damage";
    case "armor":
      return "Armor";
    case "arpen":
      return "Armor penetration";
    case "target_armor_multiplier":
      return "Target armor multiplier";
    default:
      return "";
  }
}

function stringFromScalingStat(stat: string): string {
  switch (stat) {
    case "str":
      return "strength";
    case "dex":
      return "dexterity";
    case "int":
      return "intelligence";
    case "per":
      return "perception";
    default:
      return "";
  }
}

function needsDamageType(stat: string) {
  return stat === "damage" || stat === "armor" || stat === "arpen";
}

interface Props {
  item: BonusContainer;
}

let { item }: Props = $props();
</script>

{#if item.mult_bonuses || item.flat_bonuses}
  <dt>{t("Bonus")}</dt>
  <dd>
    <ul>
      {#each item.mult_bonuses ?? [] as bon}
        <li>
          {#if needsDamageType(bon.stat)}{bon.type}{/if}
          {i18n.__(stringFromAffectedStat(bon.stat))}: {(
            bon.scale * 100
          ).toFixed(0)}% {#if bon["scaling-stat"]}
            of {i18n.__(stringFromScalingStat(bon["scaling-stat"]))}{/if}
        </li>
      {/each}
      {#each item.flat_bonuses ?? [] as bon}
        <li>
          {#if needsDamageType(bon.stat)}{bon.type}{/if}
          {i18n.__(stringFromAffectedStat(bon.stat))}:
          {#if bon["scaling-stat"]}
            {bon.scale < 0 ? "" : "+"}{(bon.scale * 100).toFixed(0)}% of {i18n.__(
              stringFromScalingStat(bon["scaling-stat"]),
            )}
          {:else}
            {bon.scale < 0 ? "" : "+"}{bon.scale}
          {/if}
        </li>
      {/each}
    </ul>
  </dd>
{/if}
