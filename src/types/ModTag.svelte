<script lang="ts">
import { getContext } from "svelte";
import { CddaData, getAllObjectSources } from "../data";

export let item: any;
export let clickable: boolean = false;

let data: CddaData = getContext("data");

let display: { id: string; name: string }[] =
  data.enabledMods.length > 0
    ? getAllObjectSources(item).map((o) => ({ id: o.__mod, name: o.__modName }))
    : [];
</script>

<span class="mod-tag">
  {#each display as d}
    <span>
      {#if clickable && d.id !== "dda"}
        <a href={`/mod/${d.id}`}>{d.name}</a>
      {:else}
        {d.name}
      {/if}
    </span>
  {/each}
</span>

<style>
.mod-tag {
  font-size: 0.6em;
  font-weight: normal;
  color: var(--cata-color-dark_gray);
}
.mod-tag > span + span::before {
  content: " > ";
}
</style>
