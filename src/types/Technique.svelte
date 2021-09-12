<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { Technique } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: Technique;

const data = getContext<CddaData>("data");

const weapons = data
  .byType("item")
  .filter((it) => {
    return it.id && (it.techniques ?? []).includes(item.id);
  })
  .sort((a, b) => a.id.localeCompare(b.id));
</script>

<h1>Technique: {item.name}</h1>
<section>
  <dl>
    <dt>Required Skills</dt>
    <dd>
      {#each item.skill_requirements ?? [] as { name, level }, i}
        <ThingLink type="skill" id={name} /> ({level}){#if i === item.skill_requirements.length - 2}{" and "}{:else if i !== item.skill_requirements.length - 1}{", "}{/if}
      {:else}
        <em>none</em>
      {/each}
    </dd>
    {#if item.stun_dur}
      <dt>Stun Duration</dt>
      <dd>{item.stun_dur}</dd>
    {/if}
    {#if item.down_dur}
      <dt>Down Duration</dt>
      <dd>{item.down_dur}</dd>
    {/if}
    {#if item.knockback_dist}
      <dt>Knockback Distance</dt>
      <dd>{item.knockback_dist}</dd>
    {/if}
    {#if item.weighting}
      <dt>Weighting</dt>
      <dd>{item.weighting}</dd>
    {/if}
    {#if item.aoe}
      <dt>AoE Shape</dt>
      <dd>{item.aoe}</dd>
    {/if}
  </dl>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>

{#if weapons.length}
  <section>
    <h1>Weapons</h1>
    <LimitedList items={weapons} let:item limit={20}>
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  </section>
{/if}
