<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";
import type { BionicSlot, ItemBasicInfo } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let item: ItemBasicInfo & BionicSlot;
const data = getContext<CddaData>("data");
</script>

<section>
  <h1>Bionic</h1>
  <dl>
    <dt>Installs as</dt>
    <dd><ThingLink type="bionic" id={item.bionic_id ?? item.id} /></dd>
    <dt>Difficulty</dt>
    <dd>{item.difficulty ?? 0}</dd>
    <dt>Is upgrade</dt>
    <dd>{item.is_upgrade ? "yes" : "no"}</dd>
    {#if item.installation_data}
      <dt>Installation data</dt>
      <dd><ThingLink type="item" id={item.installation_data} /></dd>
    {/if}
  </dl>
</section>
