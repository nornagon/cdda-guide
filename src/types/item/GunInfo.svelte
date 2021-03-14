<script lang="ts">
import type { DamageUnit, GunSlot } from "../../types";

import ThingLink from "../ThingLink.svelte";


export let item: GunSlot & {
  id: string
  type: 'GUN'
  // from load_basic_info
  min_strength?: number
  flags?: string[]
}

// TODO: handle multiple ranged_damage type
const ranged_damage = Array.isArray(item.ranged_damage)
  ? item.ranged_damage[0]
  : item.ranged_damage && 'values' in item.ranged_damage
    ? item.ranged_damage.values[0]
    : item.ranged_damage as DamageUnit ?? {amount: 0, damage_type: 'bullet', armor_penetration: 0}
</script>

<section>
  <h1>Ranged</h1>
  <dl>
    <dt>Skill</dt>
    <dd><ThingLink type="skill" id={item.skill} /></dd>
    {#if item.min_strength}
    <dt>Min Strength</dt>
    <dd>{item.min_strength}</dd>
    {/if}
    <dt>Base Damage</dt>
    <dd>{ranged_damage.amount ?? 0} ({ranged_damage.damage_type ?? 'bullet'})</dd>
    <dt>Armor Penetration</dt>
    <dd>{ranged_damage.armor_penetration ?? 0}</dd>
    <!-- TODO: Critical multiplier -->
    <dt title="Added to ammo range">Range Bonus</dt>
    <dd>{item.range ?? 0}</dd>
    <dt title="Added to ammo dispersion">Base Dispersion</dt>
    <dd>{item.dispersion ?? 0}</dd>
    <dt>Sight Dispersion</dt>
    <dd>{(item.flags ?? []).includes('DISABLE_SIGHTS') ? 90 : item.sight_dispersion ?? 30}
    <dt>Base Recoil</dt>
    <dd>{item.recoil ?? 0}</dd>
    <dt>Reload Time</dt>
    <dd>{item.reload ?? 100} moves</dd>
    {#if item.valid_mod_locations?.length}
    <dt>Mod Slots</dt>
    <dd>{item.valid_mod_locations.map(([loc, num]) => `${loc} (${num})`).join(', ')}</dd>
    {/if}
    <dt>Durability</dt>
    <dd>{item.durability ?? 0}</dd>
  </dl>
</section>