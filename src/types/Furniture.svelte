<script lang="ts">
import { CddaData, flattenItemGroup, singularName } from "../data";
import type { Construction as ConstructionT, Furniture } from "../types";
import ThingLink from "./ThingLink.svelte";
import { getContext } from "svelte";
import Construction from "./Construction.svelte";
import FurnitureSymbol from "./item/FurnitureSymbol.svelte";

const data = getContext<CddaData>("data");

export let item: Furniture;

const deconstruct = item.deconstruct?.items
  ? flattenItemGroup(data, {
      subtype: "collection",
      entries: item.deconstruct.items,
    })
  : [];

const bash = item.bash?.items
  ? flattenItemGroup(data, {
      subtype: "collection",
      entries: item.bash.items,
    })
  : [];

function showProbability(prob: number) {
  const ret = (prob * 100).toFixed(2);
  if (ret === "0.00") return "< 0.01%";
  return ret + "%";
}

const constructions = data
  .byType<ConstructionT>("construction")
  .filter((c) => c.post_terrain === item.id);

const bits = [
  ["Deconstruct", deconstruct],
  ["Bash", bash],
] as const;
</script>

<h1><FurnitureSymbol {item} /> {singularName(item)}</h1>

<section>
  <h1>General</h1>
  <dl>
    <dt>Move Cost Modifier</dt>
    <dd>
      {#if item.move_cost_mod < 0}<em>impassable</em
        >{:else}+{item.move_cost_mod * 50}{/if}
    </dd>
    <dt>Strength Required to Drag</dt>
    <dd>{item.required_str >= 0 ? item.required_str : "not movable"}</dd>
    <dt>Coverage</dt>
    <dd>{item.coverage ?? 0}%</dd>
    <dt>Comfort</dt>
    <dd>{item.comfort ?? 0}</dd>
    {#each bits as [title, arr]}
      {#if arr.length}
        <dt>{title}</dt>
        <dd>
          <ul class="comma-separated">
            <!-- prettier-ignore -->
            {#each arr as {id, prob, count}}
            <li><span style="white-space: nowrap"><ThingLink type="item" {id} />{
              ''}{#if count[0] === count[1]}{#if count[0] !== 1}&nbsp;({count[0]}){/if}{:else}&nbsp;({count[0]}–{count[1]}){/if}{
              ''}{#if prob !== 1}&nbsp;({showProbability(prob)}){/if}</span></li>
            {/each}
          </ul>
        </dd>
      {/if}
    {/each}
    <dt>Flags</dt>
    <dd>
      <ul class="comma-separated">
        {#each item.flags ?? [] as flag}
          <li>{flag}</li>
        {:else}
          <li><em>none</em></li>
        {/each}
      </ul>
    </dd>
  </dl>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>

{#if constructions.length}
  <h2>Construction</h2>
  {#each constructions as construction}
    <Construction {construction} />
  {/each}
{/if}
