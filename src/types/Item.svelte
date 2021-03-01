<script lang="ts">
  export let item: any
  
  function parseVolume(string: string | number): number {
    if (typeof string === 'number')
      return string * 250
    if (string.endsWith('ml'))
      return parseInt(string)
    else if (string.endsWith('L'))
      return parseInt(string) * 1000
  }
  
  function length(item) {
    if (item.longest_side) return item.longest_side
    return `${Math.round(Math.cbrt(parseVolume(item.volume)))} cm`
  }
</script>

<h1><span style="font-family: monospace;" class="c_{item.color}">{item.symbol}</span> {item.name.str}</h1>
<p>
  Material: {item.material.join(', ')}<br/>
  Volume: {item.volume} Weight: {item.weight} Length: {length(item)}
</p>
<p>
  {item.description}
</p>