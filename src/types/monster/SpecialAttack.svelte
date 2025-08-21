<script lang="ts">
import { normalizeDamageInstance } from "../../data";
import type { SpecialAttack } from "../../types";
import GunAttack from "./special_attacks/GunAttack.svelte";

  interface Props {
    special_attack: SpecialAttack;
  }

  let { special_attack }: Props = $props();
</script>

{#if Array.isArray(special_attack)}
  {special_attack[0]}{#if special_attack.length > 1}{" "}(cooldown: {special_attack[1]}){/if}
{:else if "type" in special_attack}
  {#if special_attack.type === "gun"}
    <GunAttack attack={special_attack} />
  {:else}
    {special_attack.type}{#if special_attack.cooldown}{" "}(cooldown: {special_attack.cooldown}){/if}
  {/if}
{:else if "id" in special_attack}
  {special_attack.id}{#if "damage_max_instance" in special_attack && special_attack.damage_max_instance}:
    {normalizeDamageInstance(special_attack.damage_max_instance)
      .map((inst) => {
        return `(${inst.damage_type} for ${inst.amount} damage)`;
      })
      .join(" ")}{/if}{#if special_attack.cooldown}{" "}(cooldown: {special_attack.cooldown}){/if}
{/if}
