<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";

export let item: {
  id: string
  type: 'ARMOR' | 'TOOL_ARMOR'
  covers?: string[]
  armor_portion_data?: ArmorPortionData[]
  sided?: boolean
  flags?: string[]
  warmth?: number
  encumbrance?: number
  max_encumbrance?: number
  coverage?: number
  environmental_protection?: number
  material_thickness?: number
  material?: string | string[]
}
let data = getContext<CddaData>('data')

let materials: any[] = (typeof item.material === 'string' ? [item.material] : item.material ?? []).map(id => data.byId('material', id));

function covers(body_part_id: string): boolean {
  return (item.covers ?? []).includes(body_part_id) || (item.armor_portion_data ?? []).some(apd => (apd.covers ?? []).includes(body_part_id))
}
let covers_anything = (item.covers ?? []).length || (item.armor_portion_data ?? []).length

type ArmorPortionData = {
  encumbrance?: number | [number, number]
  coverage?: number
  covers?: string[] // bp_id
  sided?: boolean
}
function coverageLabel(apd: ArmorPortionData): string[] {
  const covered = new Set
  const labels = []
  for (const bp_id of apd.covers ?? []) {
    if (covered.has(bp_id)) continue
    const bp = data.byId('body_part', bp_id)
    if (bp.opposite_part && apd.covers.includes(bp.opposite_part)) {
      labels.push(bp.heading_multiple)
      covered.add(bp.opposite_part)
    } else {
      labels.push(bp.heading)
    }
    covered.add(bp_id)
  }
  return labels
}
</script>

<section>
  <h1>Armor</h1>
  <dl>
    <dt>Covers</dt>
    <dd>
      {#if covers("head")}The <strong>head</strong>.{/if}
      {#if covers("eyes")}The <strong>eyes</strong>.{/if}
      {#if covers("mouth")}The <strong>mouth</strong>.{/if}
      {#if covers("torso")}The <strong>torso</strong>.{/if}

      {#each [["arm", "arms"], ["hand", "hands"], ["leg", "legs"], ["foot", "feet"]] as [sg, pl]}
      {#if item.sided && (covers(`${sg}_l`) || covers(`${sg}_r`))}
      Either <strong>{sg}</strong>.
      {:else if covers(`${sg}_l`) && covers(`${sg}_r`)}
      The <strong>{pl}</strong>.
      {:else if covers(`${sg}_l`)}
      The <strong>left {sg}</strong>.
      {:else if covers(`${sg}_r`)}
      The <strong>right {sg}</strong>.
      {/if}
      {' '}
      {/each}

      {#if !covers_anything}Nothing.{/if}
    </dd>
    <dt>Layer</dt>
    <dd>
      {#if (item.flags ?? []).includes('PERSONAL')}Personal aura
      {:else if (item.flags ?? []).includes('SKINTIGHT')}Close to skin
      {:else if (item.flags ?? []).includes('BELTED')}Strapped
      {:else if (item.flags ?? []).includes('OUTER')}Outer
      {:else if (item.flags ?? []).includes('WAIST')}Waist
      {:else if (item.flags ?? []).includes('AURA')}Outer aura
      {:else}Normal
      {/if}
    </dd>
    <dt>Warmth</dt>
    <dd>{item.warmth ?? 0}</dd>
    <dt>Encumbrance</dt>
    <dd>
      {#if item.armor_portion_data}
      <dl>
        {#each item.armor_portion_data as apd}
        <dt>{#each coverageLabel(apd) as label, i}{#if i !== 0}{', '}{/if}{label}{/each}</dt>
        <dd>
          {#if Array.isArray(apd.encumbrance)}
          {apd.encumbrance[0]}
          {#if apd.encumbrance[1] !== apd.encumbrance[0]}
          ({apd.encumbrance[1]} when full)
          {/if}
          {:else}
          {apd.encumbrance ?? 0}
          {/if}
        </dd>
        {/each}
      </dl>
      {:else}
      {item.encumbrance ?? 0}{#if item.max_encumbrance}{' '}({item.max_encumbrance} when full){/if}
      {/if}
    </dd>
    <dt title="This determines how likely it is that an attack hits the item instead of the player.">Coverage</dt>
    <dd>
      {#if item.armor_portion_data}
      <dl>
        {#each item.armor_portion_data as apd}
        <dt>{#each coverageLabel(apd) as label, i}{#if i !== 0}{', '}{/if}{label}{/each}</dt>
        <dd>{apd.coverage ?? 0}%</dd>
        {/each}
      </dl>
      {:else}
      {item.coverage ?? 0}%
      {/if}
    </dd>
    {#if materials.length || item.environmental_protection}
    <dt>Protection</dt>
    <dd>
      <dl>
        {#if materials.length}
        <dt>Bash</dt>
        <dd>{(materials.reduce((m, o) => m + o.bash_resist ?? 0, 0) * (item.material_thickness ?? 0) / materials.length).toFixed(2)}</dd>
        <dt>Cut</dt>
        <dd>{(materials.reduce((m, o) => m + o.cut_resist ?? 0, 0) * (item.material_thickness ?? 0) / materials.length).toFixed(2)}</dd>
        <dt>Ballistic</dt>
        <dd>{(materials.reduce((m, o) => m + o.bullet_resist ?? 0, 0) * (item.material_thickness ?? 0) / materials.length).toFixed(2)}</dd>
        <dt>Acid</dt>
        <dd>{(() => {
          let resist = (materials.reduce((m, o) => m + o.acid_resist ?? 0, 0) / materials.length)
          const env = item.environmental_protection ?? 0
          if (env < 10) resist *= env / 10;
          return resist
        })().toFixed(2)}</dd>
        <dt>Fire</dt>
        <dd>{(() => {
          let resist = (materials.reduce((m, o) => m + o.fire_resist ?? 0, 0) / materials.length)
          const env = item.environmental_protection ?? 0
          if (env < 10) resist *= env / 10;
          return resist
        })().toFixed(2)}</dd>
        {/if}
        <dt title="Environmental">Environ.</dt>
        <dd>{item.environmental_protection ?? 0}</dd>
      </dl>
    </dd>
    {/if}
  </dl>
</section>