<script lang="ts">
import type { MapDataCommon } from "../../types";

export let item: MapDataCommon;
function colorFromBgcolor(
  color: string | [string] | [string, string, string, string]
) {
  return typeof color === "string" ? `i_${color}` : colorFromBgcolor(color[0]);
}

const color = item.color
  ? item.color
  : item.bgcolor
  ? colorFromBgcolor(item.bgcolor)
  : null;

const sym =
  typeof item.symbol === "string" ? item.symbol : (item.symbol ?? [])[0];
const symbol = /^LINE_/.test(sym) ? "|" : sym;
</script>

<span style="font-family: monospace;" class="c_{color}">{symbol}</span>
