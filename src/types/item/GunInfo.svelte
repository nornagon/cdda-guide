<script lang="ts">
import { t } from "@transifex/native";

import type { DamageUnit, GunSlot, ItemBasicInfo } from "../../types";
import ThingLink from "../ThingLink.svelte";
import { CddaData, singularName } from "../../data";
import { getContext } from "svelte";

export let item: GunSlot & ItemBasicInfo;
export const _context = "Item Gun Info";

const data = getContext<CddaData>("data");

// TODO: handle multiple ranged_damage type
const ranged_damage = Array.isArray(item.ranged_damage)
  ? item.ranged_damage[0]
  : typeof item.ranged_damage === "number"
  ? item.ranged_damage
  : item.ranged_damage && "values" in item.ranged_damage
  ? item.ranged_damage.values[0]
  : (item.ranged_damage as DamageUnit) ?? {
      amount: 0,
      damage_type: "bullet",
      armor_penetration: 0,
    };
</script>

<section>
  <h1>{t("Ranged", { _context, _comment: "Section heading" })}</h1>
  <dl>
    <dt>{t("Skill", { _context })}</dt>
    <dd><ThingLink type="skill" id={item.skill} /></dd>
    {#if item.min_strength}
      <dt>{t("Min Strength", { _context })}</dt>
      <dd>{item.min_strength}</dd>
    {/if}
    <dt>{t("Base Damage", { _context })}</dt>
    <dd>
      {ranged_damage.amount ?? 0} ({singularName(
        data.byIdMaybe("damage_type", ranged_damage.damage_type) ?? {
          id: ranged_damage.damage_type,
        }
      )})
    </dd>
    <dt>{t("Armor Penetration", { _context })}</dt>
    <dd>{ranged_damage.armor_penetration ?? 0}</dd>
    <!-- TODO: Critical multiplier -->
    <dt title="Added to ammo range">{t("Range Bonus", { _context })}</dt>
    <dd>{item.range ?? 0}</dd>
    <dt title="Added to ammo dispersion">
      {t("Base Dispersion", { _context })}
    </dt>
    <dd>{item.dispersion ?? 0}</dd>
    <dt>{t("Sight Dispersion", { _context })}</dt>
    <dd>
      {(item.flags ?? []).includes("DISABLE_SIGHTS")
        ? 90
        : item.sight_dispersion ?? 30}
    </dd>
    <dt>{t("Base Recoil", { _context })}</dt>
    <dd>{item.recoil ?? 0}</dd>
    <dt title="Modifies base loudness as provided by the currently loaded ammo">
      {t("Loudness Modifier", { _context })}
    </dt>
    <dd>{(item.loudness ?? 0).toFixed(0)}</dd>
    <dt>{t("Reload Time", { _context })}</dt>
    <dd>{item.reload ?? 100} moves</dd>
    <dt title="Volume of the noise made when reloading this weapon">
      {t("Reload Noise Volume", { _context })}
    </dt>
    <dd>{item.reload_noise_volume ?? 0}</dd>
    {#if item.valid_mod_locations?.length}
      <dt>{t("Mod Slots", { _context })}</dt>
      <dd>
        {item.valid_mod_locations
          .map(([loc, num]) => `${loc} (${num})`)
          .join(", ")}
      </dd>
    {/if}
    <dt>{t("Durability", { _context })}</dt>
    <dd>{item.durability ?? 0}</dd>
  </dl>
</section>
