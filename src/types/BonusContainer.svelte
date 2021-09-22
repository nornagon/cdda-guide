<script lang="ts">
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

export let item: BonusContainer;
</script>

{#if item.mult_bonuses || item.flat_bonuses}
  <dt>Bonus</dt>
  <dd>
    <ul>
      {#each item.mult_bonuses ?? [] as bon}
        <li>
          {#if needsDamageType(bon.stat)}{bon.type}{/if}
          {stringFromAffectedStat(bon.stat)}: {(bon.scale * 100).toFixed(0)}% {#if bon["scaling-stat"]}
            of {stringFromScalingStat(bon["scaling-stat"])}{/if}
        </li>
      {/each}
      {#each item.flat_bonuses ?? [] as bon}
        <li>
          {#if needsDamageType(bon.stat)}{bon.type}{/if}
          {stringFromAffectedStat(bon.stat)}:
          {#if bon["scaling-stat"]}
            {bon.scale < 0 ? "" : "+"}{(bon.scale * 100).toFixed(0)}% of {stringFromScalingStat(
              bon["scaling-stat"]
            )}
          {:else}
            {bon.scale < 0 ? "" : "+"}{bon.scale}
          {/if}
        </li>
      {/each}
    </ul>
  </dd>
{/if}
