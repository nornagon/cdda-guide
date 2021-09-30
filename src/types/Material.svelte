<script lang="ts">
import { getContext } from "svelte";

import { CddaData, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { Material } from "../types";

import ThingLink from "./ThingLink.svelte";

const data = getContext<CddaData>("data");

export let item: Material;

let itemsWithMaterial = data
  .byType("item")
  .filter((i) => {
    const material =
      typeof i.material === "string" ? [i.material] : i.material ?? [];
    return i.id && material.some((m) => m === item.id);
  })
  .sort((a, b) => singularName(a).localeCompare(singularName(b)));
</script>

<h1>Material: {singularName(item)}</h1>
<section>
  <h1>Properties</h1>
  <dl>
    <dt title="Relative to 'powder', which is 1">Density</dt>
    <dd>{item.density}</dd>
    <dt>Specific Heat</dt>
    <dd>
      {item.specific_heat_liquid ?? 4.186} (liquid) / {item.specific_heat_solid ??
        2.108} (solid)
    </dd>
    <dt>Latent Heat</dt>
    <dd>{item.latent_heat ?? 334}</dd>
    <dt>Resistance</dt>
    <dd>
      <dl>
        <dt>Bash</dt>
        <dd>{item.bash_resist ?? 0}</dd>
        <dt>Cut</dt>
        <dd>{item.cut_resist ?? 0}</dd>
        <dt>Ballistic</dt>
        <dd>{item.bullet_resist ?? 0}</dd>
        <dt>Acid</dt>
        <dd>{item.acid_resist ?? 0}</dd>
        <dt>Electricity</dt>
        <dd>{item.elec_resist ?? 0}</dd>
        <dt title="Resistance to physical damage of the item itself">Chip</dt>
        <dd>{item.chip_resist ?? 0}</dd>
      </dl>
    </dd>
    {#if item.repaired_with}
      <dt>Repaired With</dt>
      <dd><ThingLink type="item" id={item.repaired_with} /></dd>
    {/if}
    {#if item.salvaged_into}
      <dt>Salvaged Into</dt>
      <dd><ThingLink type="item" id={item.salvaged_into} /></dd>
    {/if}
    <dt>Edible</dt>
    <dd>{item.edible ? "yes" : "no"}</dd>
    <dt title="Corpses made of this material will go bad">Rots</dt>
    <dd>{item.rotting ? "yes" : "no"}</dd>
  </dl>
</section>

{#if itemsWithMaterial.length}
  <section>
    <h1>Items Made From {singularName(item)}</h1>
    <LimitedList items={itemsWithMaterial} let:item>
      <ThingLink id={item.id} type="item" />
    </LimitedList>
  </section>
{/if}
