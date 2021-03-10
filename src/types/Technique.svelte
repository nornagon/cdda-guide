<script lang="ts">
import { getContext } from "svelte";
import type { CddaData, Name } from "../data";
import ThingLink from "./ThingLink.svelte";

type MartialArtRequirements = {
  unarmed_allowed?: boolean
  melee_allowed?: boolean
  unarmed_weapons_allowed?: boolean // default: true
  strictly_unarmed?: boolean
  wall_adjacent?: boolean
  req_bufs?: string[] // mabuff_id[]
  req_flags?: string[] // flag_id[] (json_flag)
  skill_requirements?: {name: string, level: number}[]
  weapon_damage_requirements?: {type: string, min: number}[]
}

type BonusContainer = {
  flat_bonuses?: {stat: string, type?: string, "scaling-stat"?: string, scale?: number}[]
  mult_bonuses?: {stat: string, type?: string, "scaling-stat"?: string, scale?: number}[]
}

type Technique = {
  id: string
  name: Name
  description?: string
  
  messages?: [string, string]
  
  crit_tec?: boolean
  crit_ok?: boolean
  downed_target?: boolean
  stunned_target?: boolean
  wall_adjacent?: boolean
  human_target?: boolean
  
  defensive?: boolean
  disarms?: boolean
  take_weapon?: boolean
  side_switch?: boolean
  dummy?: boolean
  dodge_counter?: boolean
  block_counter?: boolean
  miss_recovery?: boolean
  grab_break?: boolean

  weighting?: number // default: 1
  
  down_dur?: number // default: 0
  stun_dur?: number // default: 0
  knockback_dist?: number // default: 0
  knockback_spread?: number // default: 0
  powerful_knockback?: boolean
  knockback_follow?: boolean
  
  aoe?: string
  
  flags?: string[]
} & MartialArtRequirements & BonusContainer

export let item: Technique

const data = getContext<CddaData>('data')

const weapons = data.byType('item').filter(it => {
  return it.id && (it.techniques ?? []).includes(item.id)
}).sort((a, b) => a.id.localeCompare(b.id))

</script>

<h1>Technique: {item.name}</h1>
<section>
  <dl>
    <dt>Required Skills</dt>
    <dd>
      {#each item.skill_requirements ?? [] as {name, level}, i}
      <ThingLink type="skill" id={name} /> ({level}){#if i === item.skill_requirements.length - 2}{' and '}{:else if i !== item.skill_requirements.length - 1}{', '}{/if}
      {:else}
      <em>none</em>
      {/each}
    </dd>
    {#if item.stun_dur}
    <dt>Stun Duration</dt><dd>{item.stun_dur}</dd>
    {/if}
    {#if item.down_dur}
    <dt>Down Duration</dt><dd>{item.down_dur}</dd>
    {/if}
    {#if item.knockback_dist}
    <dt>Knockback Distance</dt><dd>{item.knockback_dist}</dd>
    {/if}
    {#if item.weighting}
    <dt>Weighting</dt><dd>{item.weighting}</dd>
    {/if}
    {#if item.aoe}
    <dt>AoE Shape</dt><dd>{item.aoe}</dd>
    {/if}
  </dl>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>

{#if weapons.length}
<section>
<h1>Weapons</h1>
<ul>
{#each weapons as weapon}
<li><ThingLink type="item" id={weapon.id} /></li>
{/each}
</ul>
</section>
{/if}
