<script lang="ts">
  import { getContext } from 'svelte';

  import { asKilograms, asLiters, CddaData, flattenRequirement, parseMass, parseVolume, singular, singularName } from '../data'
  import type { RequirementData, PocketData, ComestibleSlot, Mapgen } from '../types'
  import Dissassembly from './item/Dissassembly.svelte';
  import DroppedBy from './item/DroppedBy.svelte';
  import Recipes from './item/Recipes.svelte';
  import SpawnedIn from './item/SpawnedIn.svelte';
  import ThingLink from './ThingLink.svelte';
  
  export let item: any
  const comestible = item.type === 'COMESTIBLE' ? item as ComestibleSlot : null
  let data: CddaData = getContext('data')
  
  function length(item) {
    if (item.longest_side) return item.longest_side
    return `${Math.round(Math.cbrt(parseVolume(item.volume)))} cm`
  }
  
  function attackTime(item) {
    return Math.floor(65 + ( Math.floor(parseVolume(item.volume) / 62.5) + Math.floor(parseMass(item.weight) / 60) ));
  }
  
  let techniques: any[] = (item.techniques ?? []).map(t => data.byId('technique', t));
  let qualities: any[] = (item.qualities ?? []).map(([id, level]) => ({ quality: data.byId('tool_quality', id), level }));
  let materials: any[] = (typeof item.material === 'string' ? [item.material] : item.material ?? []).map(id => data.byId('material', id));
  let flags: any[] = (item.flags ?? []).map(id => data.byId('json_flag', id) ?? {id});
  let faults: any[] = (item.faults ?? []).map(f => data.byId('fault', f));
  
  const gripVal = { bad: 0, none: 1, solid: 2, weapon: 3 }
  const lengthVal = { hand: 0, short: 1, long: 2 }
  const surfaceVal = { point: 0, line: 1, any: 2, every: 3 }
  const balanceVal = { clumsy: 0, uneven: 1, neutral: 2, good: 3 }
  
  const computeToHit = ({grip = 'weapon', length = 'hand', surface = 'any', balance = 'neutral'}: {grip?: string, length?: string, surface?: string, balance?: string}) => {
    const g = gripVal[grip]
    const l = lengthVal[length]
    const s = surfaceVal[surface]
    const b = balanceVal[balance]
    // all items have a basic accuracy of -2, per GAME_BALANCE.md
    const base_acc = -2;
    // grip val should go from -1 to 2 but enum_to_string wants to start at 0
    const grip_offset = -1;
    // surface val should from from -2 to 1 but enum_to_string wants to start at 0
    const surface_offset = -2;
    // balance val should from from -2 to 1 but enum_to_string wants to start at 0
    const balance_offset = -2;
    // all the constant offsets and the base accuracy together
    const acc_offset = base_acc + grip_offset + surface_offset + balance_offset;
    return acc_offset + g + l + s + b;
  }
  
  const to_hit: number =
    typeof item.to_hit === 'object' ? computeToHit(item.to_hit) : item.to_hit ?? 0
  
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
  
  function maxCharges(ammo_id: string) {
    let ret = 0
    for (const p of pockets)
      if (p.pocket_type === 'MAGAZINE' && p.ammo_restriction)
        ret += p.ammo_restriction[ammo_id] ?? 0
    return ret
  }

  let ammo = pockets.flatMap(pocket => pocket.pocket_type === 'MAGAZINE' ? Object.keys(pocket.ammo_restriction ?? {}) : [])
  
  function covers(body_part_id: string): boolean {
    // TODO: armor_portion_data
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
  
  const bookRecipes = new Map<string, number>()
  if (item.type === 'BOOK') {
    function add(recipe_id: string, level: number) {
      bookRecipes.set(recipe_id, Math.min(level, bookRecipes.get(recipe_id) ?? Infinity))
    }
    for (const recipe of data.byType('recipe')) {
      if (Array.isArray(recipe.book_learn))
        for (const [id, level = 0] of recipe.book_learn)
          if (id === item.id)
            add(recipe.result, level)
      else if (recipe.book_learn)
        for (const [id, obj] of Object.entries(recipe.book_learn as Record<string, any>))
          if (id === item.id)
            add(recipe.result, obj.skill_level ?? 0)
    }
  }

  const uncraft = (() => {
    const recipe = data.uncraftRecipe(item.id)
    if (!recipe) return undefined
    const normalizedUsing = recipe.using ? Array.isArray(recipe.using) ? recipe.using : [[recipe.using, 1] as [string, number]] : []
    const requirements = (normalizedUsing
      .map(([id, count]) => [data.byId<RequirementData>('requirement', id), count] as const)).concat([[recipe, 1]])
    const components = requirements.flatMap(([req, count]) => {
      return flattenRequirement(data, req.components ?? [], x => x.components).map(x => x.map(x => ({...x, count: x.count * count})))
    })
    const defaultComponents = components.map(c => c[0])
    return {components: defaultComponents}
  })()
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
  <dt>Volume</dt><dd>{asLiters(item.volume)}</dd>
  <dt>Weight</dt><dd>{asKilograms(item.weight)}</dd>
  <dt>Length</dt><dd>{length(item)}</dd>
  {#if ammo.length}
  <dt>Ammo</dt>
  <dd>
    <ul class="no-bullets">
      {#each ammo.map(id => ({id, max_charges: maxCharges(id)})) as {id: ammo_id, max_charges}}
      <li>
        {max_charges} {item.type === 'GUN' ? 'round' : 'charge'}{max_charges === 1 ? '' : 's'} of
        <ThingLink type="ammunition_type" id={ammo_id} />
      </li>
      {/each}
    </ul>
  </dd>
  {/if}
  {#if magazine_compatible.length}
  <dt>Compatible Magazines</dt>
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
  {#if faults.length}
  <dt>Possible Faults</dt>
  <dd>
    <ul class="comma-separated">
    {#each faults as fault}
    <li><ThingLink type="fault" id={fault.id} /></li>
    {/each}
    </ul>
  {/if}

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
  
  {#if uncraft}
  <dt>Dissasembles Into</dt>
  <dd>
    <ul class="comma-separated">
      {#each uncraft.components as {id, count}}
      <li><ThingLink {id} {count} type="item" /></li>
      {/each}
    </ul>
  </dd>
  {/if}
</dl>
<p style="color: var(--cata-color-gray)">{singular(item.description)}</p>
</section>
{#if item.type === 'BOOK'}
<section>
  <h1>Book</h1>
  <dl>
    {#if item.skill}
    <dt>Skill</dt><dd><ThingLink id={item.skill} type="skill" /></dd>
    <dt>Required Level</dt><dd>{item.required_level ?? 0}</dd>
    <dt>Maximum Level</dt><dd>{item.max_level ?? 0}</dd>
    {/if}
    <dt>Required Intelligence</dt><dd>{item.intelligence ?? 0}</dd>
    <dt>Read Time</dt><dd>{item.time ?? 0}</dd>
    <dt>Fun</dt><dd>{item.fun ?? 0}</dd>
    {#if item.chapters}
    <dt>Chapters</dt><dd>{item.chapters}</dd>
    {/if}
    {#if bookRecipes.size}
    <dt>Recipes</dt>
    <dd>
      <ul>
        {#each [...bookRecipes.entries()].sort((a, b) => {
          if (a[1] !== b[1]) return a[1] - b[1]
          return a[0].localeCompare(b[0])
        }) as [id, level]}
        <li><ThingLink {id} type="item" /> ({level})</li>
        {/each}
      </ul>
    </dd>
    {/if}
  </dl>
</section>
{/if}
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
{/if}
{#if item.type === 'ENGINE' && item.displacement}
<section>
  <h1>Engine</h1>
  <dl>
    <dt>Displacement</dt>
    <dd>{item.displacement} cc</dd>
  </dl>
</section>
{/if}
{#if comestible}
<section>
  <h1>Comestible</h1>
  <dl>
    <dt>Calories</dt>
    <dd>{comestible.calories ?? 0} kcal</dd>
    <dt>Quench</dt>
    <dd>{comestible.quench ?? 0}</dd>
    <dt>Enjoyability</dt>
    <dd>{comestible.fun ?? 0}</dd>
    <dt>Portions</dt>
    <dd>{comestible.charges ?? 1}</dd>
    <dt>Spoils In</dt>
    <dd>{comestible.spoils_in ?? 'never'}</dd>
    <dt>Health</dt>
    <dd>{comestible.healthy ?? 0}</dd>
    {#if comestible.vitamins}
    <dt>Vitamins (%RDA)</dt>
    <dd>
      {#each comestible.vitamins as [vitamin, rdapct], i}
      <ThingLink id={vitamin} type="vitamin" /> ({rdapct}%){#if i < comestible.vitamins.length - 2}{', '}{:else if i === comestible.vitamins.length - 2}{' and '}{/if}
      {/each}
    </dd>
    {/if}
  </dl>
</section>
{/if}
{#if item.bashing || item.cutting || item.type === 'GUN' || item.type === 'AMMO'}
<div class="side-by-side">
{#if item.bashing || item.cutting}
<section>
<h1>Melee</h1>
<dl>
  <dt>Bash</dt><dd>{item.bashing ?? 0}</dd>
  <dt>Cut</dt><dd>{item.cutting ?? 0}</dd>
  <dt>To Hit</dt><dd>{to_hit}</dd>
  <dt>Moves Per Attack</dt><dd>{attackTime(item)}</dd>
{#if techniques.length}
  <dt>Techniques</dt><dd><ul class="no-bullets">{#each techniques as technique}
  <li><strong><ThingLink type="technique" id={technique.id} /></strong>: {technique.description}</li>
  {/each}
  </ul></dd>
{/if}
</dl>
</section>
{/if}
{#if item.type === 'GUN'}
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
    <!-- TODO: handle multiple ranged_damage types-->
    <dd>{item.ranged_damage?.amount ?? 0} ({item.ranged_damage?.damage_type ?? 'bullet'})</dd>
    <dt>Armor Penetration</dt>
    <dd>{item.ranged_damage?.armor_penetration ?? 0}</dd>
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
{:else if item.type === 'AMMO'}
{#if item.damage || item.show_stats}
<section>
  <h1>Ammunition</h1>
  <dl>
    <dt>Ammunition Type</dt>
    <dd><ThingLink type="ammunition_type" id={item.ammo_type} /></dd>
    <dt>Damage</dt>
    <dd>{item.damage?.amount ?? 0} ({item.damage?.damage_type ?? 'bullet'})</dd>
    <dt>Armor Penetration</dt>
    <dd>{item.damage?.armor_penetration ?? 0}</dd>
    <dt>Range</dt>
    <dd>{item.range ?? 0}</dd>
    <dt>Dispersion</dt>
    <dd>{item.dispersion ?? 0}</dd>
    <dt>Recoil</dt>
    <dd>{item.recoil ?? 0}</dd>
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
{/if}
</div>
{/if}
{#if pockets.filter(p => p.pocket_type === 'CONTAINER').length}
<section>
  <h1>Pockets</h1>
  {#each pockets.filter(p => p.pocket_type === 'CONTAINER') as pocket}
  <dl>
    {#if pocket.max_contains_volume != null}
    <dt>Volume Capacity</dt><dd>{pocket.max_contains_volume}</dd>
    {/if}
    {#if pocket.max_contains_weight != null}
    <dt>Weight Capacity</dt><dd>{pocket.max_contains_weight}</dd>
    {/if}
    {#if pocket.ammo_restriction}
    <dt>Ammo Restriction</dt>
    <dd>
      <ul>
      {#each [...Object.entries(pocket.ammo_restriction)] as [id, count]}
      <li>{count} round{count === 1 ? '' : 's'} of <ThingLink {id} type="ammunition_type" /></li>
      {/each}
      </ul>
    </dd>
    {/if}
    {#if pocket.max_item_length}
    <dt>Max Item Length</dt><dd>{pocket.max_item_length}</dd>
    {/if}
    {#if pocket.min_item_volume !== '0 ml'}
    <dt>Min Item Volume</dt><dd>{pocket.min_item_volume}</dd>
    {/if}
    <dt>Moves to Remove Item</dt><dd>{pocket.moves}</dd>
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

<div class="hide-header-if-no-sections">
<h2>Obtaining</h2>
<Recipes item_id={item.id} />
<DroppedBy item_id={item.id} />
<Dissassembly item_id={item.id} />
<SpawnedIn item_id={item.id} />
</div>

<style>
.hide-header-if-no-sections > h2:last-child {
  display: none;
}
</style>