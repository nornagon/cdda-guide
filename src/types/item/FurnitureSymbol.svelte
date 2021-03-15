<script lang="ts">
import type { Furniture } from "../../types";


export let item: Furniture
function colorFromBgcolor(color: string | [string] | [string, string, string, string]) {
  return typeof color === 'string' ? `i_${color}` : colorFromBgcolor(color[0])
}

const color = item.color
  ? item.color
  : item.bgcolor
    ? colorFromBgcolor(item.bgcolor)
    : null
    
const symbol = typeof item.symbol === 'string' ? item.symbol : item.symbol[0]
</script>

<span style="font-family: monospace;" class="c_{color}">{symbol}</span>
