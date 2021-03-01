<script lang="ts">
  export let item
</script>

<h1><span style="font-family: monospace;" class="c_{item.color}">{item.symbol}</span> {item.name.str}</h1>
<p>{item.description}</p>
<p>HP: {item.hp}</p>
<p>Body type: {item.bodytype}</p>
<p>Volume: {item.volume}</p>
<p>Weight: {item.weight}</p>
<p>Speed: {item.speed}</p>
<p>Material: {item.material.join(', ')}</p>
<p>Aggression: {item.aggression}</p>
<p>Morale: {item.morale}</p>
<p>Species: {item.species.join(', ')}</p>
<p>Default faction: {item.default_faction}</p>