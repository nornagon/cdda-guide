<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../data";
import type { ConstructionGroup } from "../types";
import Construction from "./Construction.svelte";

export let item: ConstructionGroup;

const data = getContext<CddaData>("data");

const constructions = data
  .byType("construction")
  .filter((x) => x.group === item.id);
</script>

<h1>{singularName(item)}</h1>

{#each constructions as construction}
  <Construction {construction} />
{/each}
