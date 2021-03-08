<script lang="ts">
import { CddaData, flattenItemGroup, singularName } from "../data";
import type { ItemGroupEntry, Name } from "../data";
import ThingLink from "./ThingLink.svelte";
import { getContext } from "svelte";

const data = getContext<CddaData>('data')

type MapBashInfo = {
  str_min?: number // default: 0
  str_max?: number // default: 0
  str_min_blocked?: number // default: -1
  str_max_blocked?: number // default: -1
  str_min_supported?: number // default: -1
  str_max_supported?: number // default: -1
  explosive?: number // default: -1
  sound_vol?: number // default: -1
  sound_fail_vol?: number // default: -1
  collapse_radius?: number // default: 1
  destroy_only?: boolean // default: false
  bash_below?: boolean // default: false
  
  // TODO:
  // sound
  // sound_fail
  // furn_set
  // ter_set
  // move_cost
  
  items: ItemGroupEntry[]
  
  // tent_centers
}

type MapDeconstructInfo = {
  furn_set?: string // default: f_null
  deconstruct_above?: boolean // default: false
  items?: ItemGroupEntry[]
}

type MapDataCommon = {
  description: string
  // examine_action
  // harvest_by_season
  // curtain_transform
}

type Furniture = MapDataCommon & {
  type: "furniture"
  id: string
  name: Name
  move_cost_mod: number
  required_str: number
  color?: string | [string] | [string, string, string, string]
  bgcolor?: string | [string] | [string, string, string, string]
  symbol: string | [string] | [string, string, string, string] // TODO: can be 1-char or LINE_XOXO
  flags?: string[]
  
  coverage?: number
  comfort?: number
  floor_bedding_warmth?: number
  
  emmissions?: string[]
  
  bonus_fire_warmth_feet?: number // default: 300
  
  keg_capacity?: number | string // volume, default: 0 ml
  max_volume?: number | string // volume, default: 1000 L
  
  crafting_pseudo_item?: string // item_id
  deployed_item?: string // item_id
  
  light_emitted?: number // default: 0
  
  bash?: MapBashInfo
  deconstruct?: MapDeconstructInfo

  // TODO:
  // open
  // close
  // connects_to
  // workbench
  // plant_data
  // surgery_skill_multiplier
}

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