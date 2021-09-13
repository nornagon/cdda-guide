<script lang="ts">
import ThingLink from "./ThingLink.svelte";

export let item: any;
</script>

<h1>Material: {item.name}</h1>
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
    <dd>{item.latent_heat ?? 333}</dd>
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
