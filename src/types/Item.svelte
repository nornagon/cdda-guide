<script lang="ts">
  import { data } from '../data'
  export let item: any
  
  function parseVolume(string: string | number): number {
    if (typeof string === 'number')
      return string * 250
    if (string.endsWith('ml'))
      return parseInt(string)
    else if (string.endsWith('L'))
      return parseInt(string) * 1000
  }
  
  function parseMass(string: string | number): number {
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
  
  let techniques = (item.techniques ?? []).map(t => $data.byId(t));
  let qualities = (item.qualities ?? []).map(([id, level]) => ({ quality: $data.byId(id), level }));
  let materials = (item.material ?? []).map(id => $data.byId(id));
  let flags = (item.flags ?? []).map(id => $data.byId(id));
  let ammo = Array.isArray(item.ammo) ? item.ammo[0] : item.ammo
</script>

<h1><span style="font-family: monospace;" class="c_{item.color}">{item.symbol}</span> {item.name.str}</h1>
<p>
  Material: <span><ul class="comma-separated">{#each materials as m}<li><a href="#/view/{m.id}">{m.name}</a></li>{/each}</ul></span><br/>
  Volume: {item.volume} Weight: {item.weight} Length: {length(item)}<br/>
  Flags: <span><ul class="comma-separated">{#each flags as f}<li><a href="#/view/{f.id}">{f.id}</a></li>{/each}</ul></span><br/>
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
  <li><strong><a href="#/view/{technique.id}">{technique.name}</a></strong>: {technique.description}</li>
  {/each}
  </ul></span>
{/if}
{#if qualities.length}
<ul class="no-bullets">
{#each qualities as {quality, level}}
  <li>Has level <strong>{level} <a href="#/view/{quality.id}">{quality.name.str}</a></strong> quality.</li>
{/each}
</ul>
{/if}
{#if ammo}
<p>Ammo: <a href="#/view/{ammo}">{$data.byId(ammo).name}</a></p>
{/if}
<p>
  {item.description}
</p>