<script lang="ts">
  import { getContext } from 'svelte';

  import { CddaData, singularName } from '../data'
  import Recipe from './Recipe.svelte';
import ThingLink from './ThingLink.svelte';
  export let item: any
  let data: CddaData = getContext('data')
  
  function parseVolume(string: string | number): number {
    if (typeof string === 'undefined') return 0
    if (typeof string === 'number')
      return string * 250
    if (string.endsWith('ml'))
      return parseInt(string)
    else if (string.endsWith('L'))
      return parseInt(string) * 1000
  }
  
  function parseMass(string: string | number): number {
    if (typeof string === 'undefined') return 0
    if (typeof string === 'number')
      return string
    if (string.endsWith('g'))
      return parseInt(string)
    if (string.endsWith('mg'))
      return parseInt(string) / 1000
    if (string.endsWith('kg'))
      return parseInt(string) * 1000
  }
  
  function length(item) {
    if (item.longest_side) return item.longest_side
    return `${Math.round(Math.cbrt(parseVolume(item.volume)))} cm`
  }
  
  function attackTime(item) {
    return Math.floor(65 + ( parseVolume(item.volume) / 62.5 + parseMass(item.weight) / 60 ));
  }
  
  let techniques: any[] = (item.techniques ?? []).map(t => data.byId('technique', t));
  let qualities: any[] = (item.qualities ?? []).map(([id, level]) => ({ quality: data.byId('tool_quality', id), level }));
  let materials: any[] = (typeof item.material === 'string' ? [item.material] : item.material ?? []).map(id => data.byId('material', id));
  let flags: any[] = (item.flags ?? []).map(id => data.byId('json_flag', id) ?? {id});
  let faults: any[] = (item.faults ?? []).map(f => data.byId('fault', f));
  
  type PocketData = {
    pocket_type?: string
    ammo_restriction?: Record<string, number>
    item_restriction?: Array<string>
    min_item_volume?: string
    max_item_volume?: string
    max_contains_volume: string
    max_contains_weight: string
    max_item_length?: string
    spoil_multiplier?: number // float
    weight_multiplier?: number // float
    volume_multiplier?: number // float
    magazine_well?: string // volume
    moves?: number
    fire_protection?: boolean
    watertight?: boolean
    airtight?: boolean
    open_container?: boolean
    flag_restriction?: Array<string>
    rigid?: boolean
    holster?: boolean
    sealed_data?: { spoil_multiplier?: number }
  }
  const defaultPocketData = {
    pocket_type: 'CONTAINER',
    min_item_volume: '0 ml',
    moves: 100,
    fire_protection: false,
    watertight: false,
    airtight: false,
    open_container: false,
    rigid: false,
    holster: false,
  }
  let pockets = ((item.pocket_data ?? []) as PocketData[]).map((pocket) => {
    return {...defaultPocketData, ...pocket}
  })
  let magazine_compatible = pockets.filter(p => p.pocket_type === 'MAGAZINE_WELL').flatMap(p => p.item_restriction)
  
  let recipes = data.byType('recipe').filter(x => x.result === item.id && !x.obsolete).map(r => data._flatten(r))
  
  function maxCharges(ammo_id: string) {
    let ret = 0
    for (const p of pockets)
      if (p.pocket_type === 'MAGAZINE' && p.ammo_restriction)
        ret += p.ammo_restriction[ammo_id] ?? 0
    return ret
  }

  let ammo = pockets.flatMap(pocket => Object.keys(pocket.ammo_restriction ?? {}))
  
  function covers(body_part_id: string): boolean {
    // TODO: armor_portion_data
    return (item.covers ?? []).includes(body_part_id)
  }
  let covers_anything = (item.covers ?? []).length
</script>

<h1><span style="font-family: monospace;" class="c_{item.color}">{item.symbol}</span> {singularName(item)}</h1>
<section>
<h1>General</h1>
<dl>
  {#if materials.length}
  <dt>Material</dt>
  <dd>
    <ul class="comma-separated">{#each materials as m}<li><ThingLink type="material" id={m.id} /></li>{/each}</ul>
  </dd>
  {/if}
  <dt>Volume</dt><dd>{item.volume}</dd>
  <dt>Weight</dt><dd>{item.weight}</dd>
  <dt>Length</dt><dd>{length(item)}</dd>
  {#if ammo.length}
  <dt>Ammo</dt>
  <dd>
    <ul class="no-bullets">
      {#each ammo.map(id => ({id, max_charges: maxCharges(id)})) as {id: ammo_id, max_charges}}
      <li>
        {max_charges} {item.type === 'GUN' ? 'rounds' : 'charges'} of
        <ThingLink type="ammunition_type" id={ammo_id} />
      </li>
      {/each}
    </ul>
  </dd>
  {/if}
  {#if magazine_compatible.length}
  <dt>Compatible magazines</dt>
  <dd>
    <ul class="comma-separated">
      {#each magazine_compatible as item_id}
      <li><ThingLink type="item" id={item_id} /></li>
      {/each}
    </ul>
  </dd>
  {/if}
  <dt>Flags</dt>
  <dd>
    <ul class="comma-separated">{#each flags as f}<li><ThingLink type="json_flag" id={f.id} /></li>{:else}<li><em>none</em></li>{/each}</ul>
  </dd>

  {#if qualities.length}
  <dt>Qualities</dt>
  <dd>
  <ul class="no-bullets">
  {#each qualities as {quality, level}}
    <li>Has level <strong>{level} <ThingLink type="tool_quality" id={quality.id} /></strong> quality.</li>
  {/each}
  </ul>
  </dd>
  {/if}
</dl>
<p style="color: var(--cata-color-gray)">{item.description}</p>
</section>
{#if item.type === 'ARMOR' || item.type === 'TOOL_ARMOR'}
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
    <dt>Encumbrance</dt>
    <dd>{item.encumbrance ?? 0}{#if item.max_encumbrance}{' '}({item.max_encumbrance} when full){/if}</dd>
    <dt>Warmth</dt>
    <dd>{item.warmth ?? 0}</dd>
    <dt title="This determines how likely it is that an attack hits the item instead of the player.">Coverage</dt>
    <dd>{item.coverage ?? 0}%</dd>
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
    <dt>Protection</dt>
    <dd>
      <dl>
        <dt>Bash</dt>
        <dd>{(materials.reduce((m, o) => m + o.bash_resist ?? 0, 0) * item.material_thickness / materials.length).toFixed(2)}</dd>
        <dt>Cut</dt>
        <dd>{(materials.reduce((m, o) => m + o.cut_resist ?? 0, 0) * item.material_thickness / materials.length).toFixed(2)}</dd>
        <dt>Ballistic</dt>
        <dd>{(materials.reduce((m, o) => m + o.bullet_resist ?? 0, 0) * item.material_thickness / materials.length).toFixed(2)}</dd>
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
        <dt title="Environmental">Environ.</dt>
        <dd>{item.environmental_protection ?? 0}</dd>
      </dl>
    </dd>
  </dl>
</section>
{/if}
{#if item.bashing || item.cutting}
<section>
<h1>Melee</h1>
<dl>
  <dt>Bash</dt><dd>{item.bashing ?? 0}</dd>
  <dt>Cut</dt><dd>{item.cutting ?? 0}</dd>
  <dt>To hit</dt><dd>{item.to_hit ?? 0}</dd>
  <dt>Moves per attack</dt><dd>{attackTime(item)}</dd>
{#if techniques.length}
  <dt>Techniques</dt><dd><ul class="no-bullets">{#each techniques as technique}
  <li><strong><ThingLink type="technique" id={technique.id} /></strong>: {technique.description}</li>
  {/each}
  </ul></dd>
{/if}
</dl>
</section>
{/if}
{#if pockets.filter(p => p.pocket_type === 'CONTAINER').length}
<section>
  <h1>Pockets</h1>
  {#each pockets.filter(p => p.pocket_type === 'CONTAINER') as pocket}
  <dl>
    <dt>Volume Capacity</dt><dd>{pocket.max_contains_volume}</dd>
    <dt>Weight Capacity</dt><dd>{pocket.max_contains_weight}</dd>
    {#if pocket.max_item_length}
    <dt>Max Item Length</dt><dd>{pocket.max_item_length}</dd>
    {/if}
    {#if pocket.min_item_volume !== '0 ml'}
    <dt>Min Item Volume</dt><dd>{pocket.min_item_volume}</dd>
    {/if}
    <dt>Moves To Remove Item</dt><dd>{pocket.moves}</dd>
    {#if pocket.flag_restriction}
    <dt>Flag Restriction</dt>
    <dd>
      <ul class="comma-separated">
        {#each pocket.flag_restriction as flag}
        <li>{flag}</li>
        {/each}
      </ul>
    </dd>
    {/if}
    {#if pocket.item_restriction}
    <dt>Item Restriction</dt>
    <dd>
      <ul class="comma-separated">
        {#each pocket.item_restriction as item}
        <li><ThingLink type="item" id={item} /></li>
        {/each}
      </ul>
    </dd>
    {/if}
  </dl>
  {/each}
</section>
{/if}
{#if faults.length}
<section>
  <h1>Possible faults</h1>
  <dl>
    {#each faults as fault}
    <dt><ThingLink type="fault" id={fault.id} /></dt>
    <dd>{fault.description}</dd>
    {/each}
  </dl>
</section>
{/if}
{#if recipes.length}
<h2>Recipes</h2>
{#each recipes as recipe (recipe)}
<Recipe recipe={recipe} />
{/each}
{/if}