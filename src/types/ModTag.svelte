<script lang="ts">
import { getContext } from "svelte";
import { CddaData, getAllObjectSources } from "../data";

let { item }: { item: any } = $props();
let data: CddaData = getContext("data");

let display: string = data.modEnabled()
  ? getAllObjectSources(item)
      .map((o) => o.__mod)
      .join(" > ")
  : "";
</script>

<span class="mod-tag">{display}</span>

<style>
.mod-tag {
  font-size: 0.6em;
  font-weight: normal;
  color: var(--cata-color-dark_gray);
}
</style>
