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
<p>
  Material: <span><ul class="comma-separated">{#each materials as m}<li><a href="#/material/{m.id}">{m.name}</a></li>{/each}</ul></span><br/>
  Volume: {item.volume} Weight: {item.weight} Length: {length(item)}<br/>
  Flags: <span><ul class="comma-separated">{#each flags as f}<li><a href="#/json_flag/{f.id}">{f.id}</a></li>{/each}</ul></span><br/>
</p>
{#if item.bashing || item.cutting}
<p>
Bash: {item.bashing} Cut: {item.cutting} To hit: {item.to_hit ?? 0}<br/>
Moves per attack: {attackTime(item)}
</p>
{/if}
{#if techniques.length}
<p>
  Techniques: <span><ul class="comma-separated">{#each techniques as technique}
  <li><strong><a href="#/technique/{technique.id}">{technique.name}</a></strong>: {technique.description}</li>
  {/each}
  </ul></span>
{/if}
{#if qualities.length}
<ul class="no-bullets">
{#each qualities as {quality, level}}
  <li>Has level <strong>{level} <a href="#/tool_quality/{quality.id}">{singularName(quality)}</a></strong> quality.</li>
{/each}
</ul>
{/if}
{#if ammo}
<p>Ammo: <a href="#/ammunition_type/{ammo}">{singularName($data.byId('ammunition_type', ammo))}</a></p>
{/if}
<p>
  {item.description}
</p>
{#if recipes.length}
<section>
<h1>Recipes</h1>
{#each recipes as recipe (recipe)}
<Recipe recipe={recipe} />
{/each}
</section>
{/if}