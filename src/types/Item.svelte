<script lang="ts">
  import { getContext } from 'svelte';

  import { asKilograms, asLiters, CddaData, countsByCharges, flattenRequirement, parseMass, parseVolume, singularName } from '../data'
  import type { RequirementData, Recipe as RecipeT } from '../data'
  import Recipe from './Recipe.svelte';
  import ThingLink from './ThingLink.svelte';
  
  type BookProficiencyBonus = {
    id: string // proficiency_id
    fail_factor?: number // default: 0.5
    time_factor?: number // default: 0.5
    include_prereqs?: number // default: true
  }
  type BookSlot = {
    max_level?: number // default: 0
    required_level?: number // default: 0
    fun?: number // default: 0
    intelligence?: number // default: 0

    time?: number /* mins */ | string /* duration */

    skill?: string // skill_id
    martial_art?: string // matype_id
    chapters?: number // default: 0
    proficiencies?: BookProficiencyBonus[]
  }

  export let item: any
  let data: CddaData = getContext('data')
  
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
  
  let recipes = data.byType<RecipeT>('recipe')
    .filter(x => x.type === 'recipe' && x.result === item.id && !x.obsolete)
  
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
    return (item.covers ?? []).includes(body_part_id)
  }
  let covers_anything = (item.covers ?? []).length
  
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

  const mons = data.byType('monster').flatMap(mon => {
    if (!mon.id) return []
    const deathDrops = data.flatDeathDrops(mon.id)
    const dd = deathDrops.find(dd => dd.id === item.id)
    if (dd) return [{id: mon.id, prob: dd.prob}]
    return []
  })
  mons.sort((a, b) => b.prob - a.prob)

  function showProbability(prob: number) {
    const ret = (prob * 100).toFixed(2)
    if (ret === '0.00')
      return '< 0.01%'
    return ret + '%'
  }

  let droppedByLimit = 10
  
  const uncraftableFromSet = new Set<string>()
  for (const recipe of data.byType<RecipeT>('recipe')) {
    if (recipe.result && (recipe.reversible || recipe.type === 'uncraft')) {
      const normalizedUsing = recipe.using ? Array.isArray(recipe.using) ? recipe.using : [[recipe.using, 1] as [string, number]] : []
      const requirements = (normalizedUsing
        .map(([id, count]) => [data.byId<RequirementData>('requirement', id), count] as const)).concat([[recipe, 1]])
      const components = requirements.flatMap(([req, count]) => {
        return flattenRequirement(data, req.components ?? [], x => x.components).map(x => x.map(x => ({...x, count: x.count * count})))
      })
      const defaultComponents = components.map(c => c[0])
      if (defaultComponents.some(c => c.id === item.id))
        uncraftableFromSet.add(recipe.result)
    }
  }
  const uncraftableFrom = [...uncraftableFromSet].sort((a, b) => singularName(data.byId('item', a)).localeCompare(singularName(data.byId('item', b))))
  
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

  let uncraftLimit = 10
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
        {max_charges} {item.type === 'GUN' ? 'rounds' : 'charges'} of
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
      <li>
        <span style="white-space: nowrap">
        {#if !countsByCharges(data.byId('item', id))}{count}{/if}
        <ThingLink type="item" {id} plural={count !== 1 && !countsByCharges(data.byId('item', id))} />{#if countsByCharges(data.byId('item', id))}{' '}({count}){/if}</span></li>
      {/each}
    </ul>
  </dd>
  {/if}
</dl>
<p style="color: var(--cata-color-gray)">{item.description}</p>
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
{#if item.bashing || item.cutting}
<section>
<h1>Melee</h1>
<dl>
  <dt>Bash</dt><dd>{item.bashing ?? 0}</dd>
  <dt>Cut</dt><dd>{item.cutting ?? 0}</dd>
  <dt>To Hit</dt><dd>{item.to_hit ?? 0}</dd>
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
      <li>{count} rounds of <ThingLink {id} type="ammunition_type" /></li>
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
{#if faults.length}
<section>
  <h1>Possible Faults</h1>
  <dl>
    {#each faults as fault}
    <dt><ThingLink type="fault" id={fault.id} /></dt>
    <dd>{fault.description}</dd>
    {/each}
  </dl>
</section>
{/if}
{#if mons.length || uncraftableFrom.length || recipes.length}
<h2>Obtaining</h2>
{#if recipes.length}
{#each recipes as recipe (recipe)}
<Recipe recipe={recipe} />
{/each}
{/if}

{#if mons.length}
<section>
  <h1>Dropped By</h1>
  <ul>
    {#each mons.slice(0, droppedByLimit) as {id, prob}}
    <li><ThingLink {id} type="monster" /> ({showProbability(prob)})</li>
    {/each}
  </ul>
  {#if mons.length > droppedByLimit}
  <a href="" on:click={(e) => { e.preventDefault(); droppedByLimit = Infinity }}>See all...</a>
  {/if}
</section>
{/if}

{#if uncraftableFrom.length}
<section>
  <h1>Disassemble</h1>
  <ul>
    {#each uncraftableFrom.slice(0, uncraftLimit) as id}
    <li><ThingLink {id} type="item" /></li>
    {/each}
  </ul>
  {#if uncraftableFrom.length > uncraftLimit}
  <a href="" on:click={(e) => { e.preventDefault(); uncraftLimit = Infinity }}>See all...</a>
  {/if}
</section>
{/if}
{/if}