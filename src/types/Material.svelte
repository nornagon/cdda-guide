<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";

import {
  breathabilityFromRating,
  byName,
  CddaData,
  singularName,
} from "../data";
import LimitedList from "../LimitedList.svelte";
import type { Material } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";

import ThingLink from "./ThingLink.svelte";

const data = getContext<CddaData>("data");

export let item: Material;
const _context = "Material";

function isStrings<T>(array: string[] | T[]): array is string[] {
  return typeof array[0] === "string";
}

let itemsWithMaterial = data
  .byType("item")
  .filter((i) => {
    const normalizedMaterial =
      i.material == null
        ? []
        : typeof i.material === "string"
        ? [i.material]
        : isStrings(i.material)
        ? i.material
        : i.material.map((m) => m.type);
    return i.id && normalizedMaterial.some((m) => m === item.id);
  })
  .sort(byName);
</script>

<h1>{t("Material")}: {singularName(item)}</h1>
<section>
  <h1>{t("Properties", { _context })}</h1>
  <dl>
    <dt>{t("Density", { _context })}</dt>
    <dd>{item.density} kg / L</dd>
    <dt>{t("Specific Heat", { _context })}</dt>
    <dd>
      {#if (item.specific_heat_liquid ?? 4.186) !== (item.specific_heat_solid ?? 2.108)}
        <dl>
          <dt>{t("Liquid", { _context })}</dt>
          <dd>{item.specific_heat_liquid ?? 4.186} J / g / °K</dd>
          <dt>{t("Solid", { _context })}</dt>
          <dd>{item.specific_heat_solid ?? 2.108} J / g / °K</dd>
        </dl>
      {:else}
        {item.specific_heat_liquid ?? 4.186} J / g / °K
      {/if}
    </dd>
    <dt>{t("Latent Heat", { _context })}</dt>
    <dd>{item.latent_heat ?? 334} J / g</dd>
    <dt>{t("Breathability", { _context })}</dt>
    <dd>{breathabilityFromRating(item.breathability ?? "IMPERMEABLE")}%</dd>
    <dt>{t("Resistance", { _context })}</dt>
    <dd>
      <dl>
        <dt>{t("Bash", { _context: "Damage Type" })}</dt>
        <dd>{item.bash_resist ?? item.resist?.bash ?? 0}</dd>
        <dt>{t("Cut", { _context: "Damage Type" })}</dt>
        <dd>{item.cut_resist ?? item.resist?.cut ?? 0}</dd>
        <dt>{t("Ballistic", { _context: "Damage Type" })}</dt>
        <dd>{item.bullet_resist ?? item.resist?.bullet ?? 0}</dd>
        <dt>{t("Acid", { _context: "Damage Type" })}</dt>
        <dd>{item.acid_resist ?? item.resist?.acid ?? 0}</dd>
        <dt>{t("Heat", { _context: "Damage Type" })}</dt>
        <dd>{item.fire_resist ?? item.resist?.heat ?? 0}</dd>

        <dt>{t("Conductive", { _context })}</dt>
        <dd>
          {item.elec_resist === 0 ||
          item.elec_resist === 1 ||
          item.resist?.electric != null ||
          item.conductive
            ? t("Yes")
            : t("No")}
        </dd>
      </dl>
    </dd>
    <dt title="Resistance to physical damage of the item itself">
      {t("Durability", { _context })}
    </dt>
    <dd>{item.chip_resist ?? 0}</dd>

    {#if item.repaired_with}
      <dt>{t("Repaired With", { _context })}</dt>
      <dd><ThingLink type="item" id={item.repaired_with} /></dd>
    {/if}
    {#if item.salvaged_into}
      <dt>{t("Salvaged Into", { _context })}</dt>
      <dd><ThingLink type="item" id={item.salvaged_into} /></dd>
    {/if}
    <dt>{t("Edible", { _context })}</dt>
    <dd>{item.edible ? t("Yes") : t("No")}</dd>
    <dt title="Corpses made of this material will go bad">
      {t("Rots", { _context })}
    </dt>
    <dd>{item.rotting ? t("Yes") : t("No")}</dd>
  </dl>
</section>

{#if itemsWithMaterial.length}
  <section>
    <h1>{t("Items Made From {material}", { material: singularName(item) })}</h1>
    <LimitedList items={itemsWithMaterial} let:item>
      <ItemSymbol {item} />
      <ThingLink id={item.id} type="item" />
    </LimitedList>
  </section>
{/if}
