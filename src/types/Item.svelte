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
</script>

<h1><span style="font-family: monospace;" class="c_{item.color}">{item.symbol}</span> {item.name.str}</h1>
<p>
  Material: {materials.map(m => m.name).join(', ')}<br/>
  Volume: {item.volume} Weight: {item.weight} Length: {length(item)}<br/>
  Flags: {(item.flags ?? []).join(', ')}
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
  <li><strong>{technique.name}</strong>: {technique.description}</li>
  {/each}
  </ul></span>
{/if}
{#if qualities.length}
<ul class="no-bullets">
{#each qualities as {quality, level}}
  <li>Has level <strong>{level} {quality.name.str}</strong> quality.</li>
{/each}
</ul>
{/if}
<p>
  {item.description}
</p>