<script lang="ts">
  import { data, singularName } from '../data'
  import Recipe from './Recipe.svelte';
  export let item: any
  
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
  
  let techniques = (item.techniques ?? []).map(t => $data.byId('technique', t));
  let qualities = (item.qualities ?? []).map(([id, level]) => ({ quality: $data.byId('tool_quality', id), level }));
  let materials = (item.material ?? []).map(id => $data.byId('material', id));
  let flags = (item.flags ?? []).map(id => $data.byId('json_flag', id) ?? {id});
  let ammo = Array.isArray(item.ammo) ? item.ammo[0] : item.ammo
  
  let recipes = $data.byType('recipe').filter(x => x.result === item.id && !x.obsolete)
</script>

<h1><span style="font-family: monospace;" class="c_{item.color}">{item.symbol}</span> {singularName(item)}</h1>
<section>
<h1>General</h1>
<dl>
  <dt>Material</dt>
  <dd>
    <ul class="comma-separated">{#each materials as m}<li><a href="#/material/{m.id}">{m.name}</a></li>{/each}</ul>
  </dd>
  <dt>Volume</dt><dd>{item.volume}</dd>
  <dt>Weight</dt><dd>{item.weight}</dd>
  <dt>Length</dt><dd>{length(item)}</dd>
  {#if ammo}
  <dt>Ammo</dt><dd><a href="#/ammunition_type/{ammo}">{singularName($data.byId('ammunition_type', ammo))}</a></dd>
  {/if}
  <dt>Flags</dt>
  <dd>
    <ul class="comma-separated">{#each flags as f}<li><a href="#/json_flag/{f.id}">{f.id}</a></li>{:else}<li><em>none</em></li>{/each}</ul>
  </dd>

  {#if qualities.length}
  <dt>Qualities</dt>
  <dd>
  <ul class="no-bullets">
  {#each qualities as {quality, level}}
    <li>Has level <strong>{level} <a href="#/tool_quality/{quality.id}">{singularName(quality)}</a></strong> quality.</li>
  {/each}
  </ul>
  </dd>
  {/if}
</dl>
<p style="color: var(--cata-color-gray)">{item.description}</p>
</section>
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
  <li><strong><a href="#/technique/{technique.id}">{technique.name}</a></strong>: {technique.description}</li>
  {/each}
  </ul></dd>
{/if}
</dl>
</section>
{/if}
{#if recipes.length}
<h2>Recipes</h2>
{#each recipes as recipe (recipe)}
<Recipe recipe={recipe} />
{/each}
{/if}