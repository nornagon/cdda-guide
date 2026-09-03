<script lang="ts">
import { t } from "@transifex/native";
import { CddaData, i18n, singular } from "./data";
import { isHiddenMod } from "./mods";

export let data: CddaData;

const modCategoryNames = new Map<string, string>([
  ["total_conversion", "TOTAL CONVERSIONS"],
  ["content", "CORE CONTENT PACKS"],
  ["items", "ITEM ADDITION MODS"],
  ["creatures", "CREATURE MODS"],
  ["misc_additions", "MISC ADDITIONS"],
  ["buildings", "BUILDINGS MODS"],
  ["vehicles", "VEHICLE MODS"],
  ["rebalance", "REBALANCING MODS"],
  ["magical", "MAGICAL MODS"],
  ["item_exclude", "ITEM EXCLUSION MODS"],
  ["monster_exclude", "MONSTER EXCLUSION MODS"],
  ["graphical", "GRAPHICAL MODS"],
  ["accessibility", "ACCESSIBILITY MODS"],
  ["", "NO CATEGORY"],
]);

function groupModsByCategory(mods: typeof data.availableMods) {
  const groups = new Map<string, typeof mods>();
  for (const mod of mods) {
    const category = mod.category ?? "";
    groups.set(category, [...(groups.get(category) ?? []), mod]);
  }
  return [...groups.entries()].sort(([categoryA], [categoryB]) => {
    const orderA = [...modCategoryNames.keys()].indexOf(categoryA);
    const orderB = [...modCategoryNames.keys()].indexOf(categoryB);
    if (orderA === -1 && orderB === -1)
      return categoryA.localeCompare(categoryB);
    if (orderA === -1) return 1;
    if (orderB === -1) return -1;
    return orderA - orderB;
  });
}

function modCategoryName(category: string) {
  return i18n.__(modCategoryNames.get(category) ?? category);
}

$: displayedMods = data.availableMods
  .filter((mod) => !isHiddenMod(mod.id))
  .map((mod) => ({ ...mod, label: singular(mod.label) }))
  .sort((a, b) => a.label.localeCompare(b.label));
$: displayedModGroups = groupModsByCategory(displayedMods);
</script>

<h1>{t("Mods")}</h1>
{#if displayedMods.length}
  {#each displayedModGroups as [category, mods]}
    <section>
      <h1>{modCategoryName(category)}</h1>
      <ul>
        {#each mods as mod}
          <li>
            <a
              href="{import.meta.env.BASE_URL}mod/{encodeURIComponent(
                mod.id,
              )}{location.search}">{mod.label}</a>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
{:else}
  <p>{t("No mods found.")}</p>
{/if}
