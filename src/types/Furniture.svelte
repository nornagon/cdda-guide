<script lang="ts">
import { CddaData, flattenItemGroup, singularName } from "../data";
import type { Construction as ConstructionT, Furniture } from "../types";
import ThingLink from "./ThingLink.svelte";
import { getContext } from "svelte";
import Construction from "./Construction.svelte";

const data = getContext<CddaData>('data')

export let item: Furniture

function colorFromBgcolor(color: string | [string] | [string, string, string, string]) {
  return typeof color === 'string' ? `i_${color}` : colorFromBgcolor(color[0])
}

const color = item.color
  ? item.color
  : item.bgcolor
    ? colorFromBgcolor(item.bgcolor)
    : null
    
const symbol = typeof item.symbol === 'string' ? item.symbol : item.symbol[0]

const deconstruct = item.deconstruct?.items
  ? flattenItemGroup(data, { subtype: "collection", entries: item.deconstruct.items })
  : []
  
const bash = item.bash?.items
  ? flattenItemGroup(data, { subtype: "collection", entries: item.bash.items })
  : []

function showProbability(prob: number) {
  const ret = (prob * 100).toFixed(2)
  if (ret === '0.00')
    return '< 0.01%'
  return ret + '%'
}

const constructions = data.byType<ConstructionT>('construction').filter(c => c.post_terrain === item.id)

</script>

<h1><span style="font-family: monospace;" class="c_{color}">{symbol}</span> {singularName(item)}</h1>

<section>
  <h1>General</h1>
  <dl>
    <dt>Move Cost Modifier</dt><dd>{#if item.move_cost_mod < 0}<em>impassable</em>{:else}+{item.move_cost_mod * 50}{/if}</dd>
    <dt>Strength Required to Drag</dt><dd>{item.required_str >= 0 ? item.required_str : 'not movable'}</dd>
    <dt>Coverage</dt><dd>{item.coverage ?? 0}%</dd>
    <dt>Comfort</dt><dd>{item.comfort ?? 0}</dd>
    {#each [['Deconstruct', deconstruct], ['Bash', bash]] as [title, arr]}
    {#if arr.length}
    <dt>{title}</dt>
    <dd>
      <ul class="comma-separated">
        {#each arr as {id, prob, count}}
        <li><ThingLink type="item" {id} />{
          ''}{#if count[0] === count[1]}{#if count[0] !== 1}{' '}({count[0]}){/if}{:else}{' '}({count[0]}–{count[1]}){/if}{
          ''}{#if prob !== 1}{' '}({showProbability(prob)}){/if}</li>
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