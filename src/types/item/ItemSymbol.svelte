<script lang="ts">
export let item: { color?: string; symbol?: string };
</script>

<span style="font-family: monospace;" class="c_{item.color}"
  >{item.symbol ?? " "}</span>
