<script lang="ts">
import { t } from "@transifex/native";
import { CddaData, i18n, singularName } from "../../data";
import type { AmmoSlot, DamageUnit } from "../../types";
import ThingLink from "../ThingLink.svelte";
import { getContext } from "svelte";

export let item: AmmoSlot;
const _context = "Item Ammo Info";

const data = getContext<CddaData>("data");

// TODO: handle multiple damage type
const damage = Array.isArray(item.damage)
  ? item.damage[0]
  : item.damage && "values" in item.damage
  ? item.damage.values[0]
  : (item.damage as DamageUnit) ?? {
      amount: 0,
      damage_type: "bullet",
      armor_penetration: 0,
    };

function computeLoudness(item: AmmoSlot): number {
  // https://github.com/CleverRaven/Cataclysm-DDA/blob/5612551d1e4e4babfe4ae0dab81f8d8b49991783/src/item_factory.cpp#L264-L271
  if ((item.loudness ?? -1) >= 0) return item.loudness ?? 0;
  return (
    (item.range ?? 0) * 2 +
    ((damage.amount ?? 0) + (damage.armor_penetration ?? 0)) * 2
  );
}
</script>

{#if item.damage || item.show_stats}
  <section>
    <h1>{t("Ammunition", { _context })}</h1>
    <dl>
      <dt>{t("Ammunition Type", { _context })}</dt>
      <dd><ThingLink type="ammunition_type" id={item.ammo_type} /></dd>
      <dt>{t("Damage", { _context })}</dt>
      <dd>
        {damage.amount ?? 0} ({singularName(
          data.byIdMaybe("damage_type", damage.damage_type) ?? {
            id: damage.damage_type,
          }
        )})
      </dd>
      <dt>{t("Armor Penetration", { _context })}</dt>
      <dd>{damage.armor_penetration ?? 0}</dd>
      <dt>{t("Range", { _context })}</dt>
      <dd>{item.range ?? 0}</dd>
      <dt>{t("Dispersion", { _context })}</dt>
      <dd>{item.dispersion ?? 0}</dd>
      <dt>{t("Recoil", { _context })}</dt>
      <dd>{item.recoil ?? 0}</dd>
      <dt title="Base loudness of ammo (possibly modified by gun/gunmods)">
        {t("Loudness", { _context })}
      </dt>
      <dd>{computeLoudness(item).toFixed(0)}</dd>
      <dt>{t("Critical Multiplier", { _context })}</dt>
      <dd>{item.critical_multiplier ?? 2}</dd>
      {#if item.casing}
        <dt>{t("Casing", { _context })}</dt>
        <dd><ThingLink id={item.casing} type="item" /></dd>
      {/if}
      {#if item.effects?.length}
        <dt>{t("Effects", { _context })}</dt>
        <dd>{item.effects.join(", ")}</dd>
      {/if}
    </dl>
  </section>
{/if}
