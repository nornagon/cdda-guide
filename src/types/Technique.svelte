<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { MartialArtBuff, Technique } from "../types";
import BonusContainer from "./BonusContainer.svelte";
import MartialArtRequirements from "./MartialArtRequirements.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: Technique;
export let buffMap: Map<string, MartialArtBuff> = new Map();

const data = getContext<CddaData>("data");

const weapons = data
  .byType("item")
  .filter((it) => {
    return it.id && (it.techniques ?? []).includes(item.id);
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const type = item.block_counter
  ? "Block Counter"
  : item.dodge_counter
  ? "Dodge Counter"
  : item.miss_recovery
  ? "Miss Recovery"
  : item.grab_break
  ? "Grab Break"
  : item.defensive
  ? "Defensive"
  : "Offensive";

const targetRequirements = [];
if (item.human_target) targetRequirements.push("humanoid");
if (item.downed_target) targetRequirements.push("downed");
if (item.stunned_target) targetRequirements.push("stunned");
</script>

<section>
  <h1>Technique: {item.name}</h1>
  <dl>
    <dt>Type</dt>
    <dd>{type}</dd>
    <MartialArtRequirements {item} {buffMap} />
    <dt>Activate on Crit?</dt>
    <dd>{item.crit_ok ? "Yes" : item.crit_tec ? "Only" : "No"}</dd>
    {#if item.weighting && item.weighting !== 1}
      <dt>Chance to Activate</dt>
      <dd>
        {#if item.weighting > 1}
          +{((item.weighting - 1) * 100).toFixed(0)}%
        {:else if item.weighting < -1}
          1/{Math.abs(item.weighting)}
        {/if}
      </dd>
    {/if}
    {#if targetRequirements.length}
      <dt>Target Requirements</dt>
      <dd>
        {targetRequirements.join(", ")}
      </dd>
    {/if}
    {#if item.aoe}
      <dt>AoE Shape</dt>
      <dd>{item.aoe}</dd>
    {/if}
    <BonusContainer {item} />
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
  </dl>
  {#if item.description}
    <p style="color: var(--cata-color-gray)">{item.description}</p>
  {/if}
  <details>
    <summary>Technique JSON</summary>
    <pre>{JSON.stringify(item, null, 2)}</pre>
  </details>
</section>

{#if weapons.length}
  <section>
    <h1>Weapons</h1>
    <LimitedList items={weapons} let:item limit={20}>
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  </section>
{/if}
