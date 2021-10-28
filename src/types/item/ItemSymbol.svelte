<script lang="ts">
export let item: { color?: string | string[]; symbol?: string };

const sym = item.symbol ?? " ";
const symbol = /^LINE_/.test(sym) ? "|" : sym;
const color = item.color
  ? typeof item.color === "string"
    ? item.color
    : item.color[0]
  : "";
</script>

<span style="font-family: monospace;" class="c_{color}">{symbol}</span>
