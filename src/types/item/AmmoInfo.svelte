<script lang="ts">
import type { AmmoSlot, DamageUnit } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let item: AmmoSlot

// TODO: handle multiple damage type
const damage = Array.isArray(item.damage)
  ? item.damage[0]
  : item.damage && 'values' in item.damage
    ? item.damage.values[0]
    : item.damage as DamageUnit ?? {amount: 0, damage_type: 'bullet', armor_penetration: 0}

function computeLoudness(item: AmmoSlot): number {
  // https://github.com/CleverRaven/Cataclysm-DDA/blob/5612551d1e4e4babfe4ae0dab81f8d8b49991783/src/item_factory.cpp#L264-L271
  if ((item.loudness ?? -1) >= 0)
    return item.loudness ?? 0
  return (item.range ?? 0) * 2 + (damage.amount ?? 0) * (damage.armor_penetration ?? 0)
}
</script>

{#if item.damage || item.show_stats}
<section>
  <h1>Ammunition</h1>
  <dl>
    <dt>Ammunition Type</dt>
    <dd><ThingLink type="ammunition_type" id={item.ammo_type} /></dd>
    <dt>Damage</dt>
    <dd>{damage.amount ?? 0} ({damage.damage_type ?? 'bullet'})</dd>
    <dt>Armor Penetration</dt>
    <dd>{damage.armor_penetration ?? 0}</dd>
    <dt>Range</dt>
    <dd>{item.range ?? 0}</dd>
    <dt>Dispersion</dt>
    <dd>{item.dispersion ?? 0}</dd>
    <dt>Recoil</dt>
    <dd>{item.recoil ?? 0}</dd>
    <dt title="Base loudness of ammo (possibly modified by gun/gunmods)">Loudness</dt>
    <dd>{computeLoudness(item)}</dd>
    <dt>Critical Multiplier</dt>
    <dd>{item.critical_multiplier ?? 2}</dd>
    {#if item.casing}
    <dt>Casing</dt>
    <dd><ThingLink id={item.casing} type="item" /></dd>
    {/if}
    {#if item.effects?.length}
    <dt>Effects</dt>
    <dd>{item.effects.join(', ')}</dd>
    {/if}
  </dl>
</section>
{/if}
