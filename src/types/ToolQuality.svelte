<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { byName, CddaData, singularName, i18n } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { Item, VehiclePart, ToolQuality, Construction } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: ToolQuality;

let data = getContext<CddaData>("data");
const _context = "Tool Quality";

let toolsWithQualityByLevel = new Map<number, Item[]>();
for (const it of data.byType("item")) {
  if (!it.id) continue;
  const q = (it.qualities ?? [])
    .concat(it.charged_qualities ?? [])
    .find(([id, _level]) => id === item.id);
  if (q) {
    const [, level] = q;
    if (!toolsWithQualityByLevel.has(level))
      toolsWithQualityByLevel.set(level, []);
    toolsWithQualityByLevel.get(level)!.push(it);
  } else {
    if (it.type === "GUN" && !it.flags?.includes("PRIMITIVE_RANGED_WEAPON")) {
      if (it.skill.toUpperCase() === item.id) {
        if (!toolsWithQualityByLevel.has(1)) toolsWithQualityByLevel.set(1, []);
        toolsWithQualityByLevel.get(1)!.push(it);
      }
    }
  }
}
const toolsWithQualityByLevelList = [...toolsWithQualityByLevel.entries()].sort(
  (a, b) => a[0] - b[0]
);
toolsWithQualityByLevelList.forEach(([, tools]) => {
  tools.sort(byName);
});

const vpartsWithQualityByLevel = new Map<number, VehiclePart[]>();
for (const it of data.byType("vehicle_part")) {
  if (!it.id) continue;
  const q = (it.qualities ?? []).find(([id, _level]) => id === item.id);
  if (q) {
    const [, level] = q;
    if (!vpartsWithQualityByLevel.has(level))
      vpartsWithQualityByLevel.set(level, []);
    vpartsWithQualityByLevel.get(level)!.push(it);
  }
}
const vpartsWithQualityByLevelList = [
  ...vpartsWithQualityByLevel.entries(),
].sort((a, b) => a[0] - b[0]);
vpartsWithQualityByLevelList.forEach(([, vparts]) => {
  vparts.sort(byName);
});

const recipesUsingQualitySet = new Map<number, Set<string>>();
for (const it of data.byType("recipe")) {
  if (
    !it.result ||
    it.construction_blueprint ||
    !data.byIdMaybe("item", it.result)
  )
    continue;
  const { qualities } = data.normalizeRequirements(it);
  for (const qs of qualities) {
    for (const { id, level = 1 } of qs) {
      if (id === item.id) {
        if (!recipesUsingQualitySet.has(level))
          recipesUsingQualitySet.set(level, new Set());
        recipesUsingQualitySet.get(level)!.add(it.result);
      }
    }
  }
}
const recipesUsingQuality = new Map<number, string[]>();
for (const [level, set] of recipesUsingQualitySet)
  recipesUsingQuality.set(
    level,
    [...set].sort((a, b) =>
      singularName(data.byId("item", a)).localeCompare(
        singularName(data.byId("item", b))
      )
    )
  );

const recipesUsingQualityList = [...recipesUsingQuality.entries()].sort(
  (a, b) => a[0] - b[0]
);

const constructionsUsingQualityByLevel = new Map<number, Construction[]>();
for (const construction of data.byType("construction")) {
  const { qualities } = data.normalizeRequirements(construction);
  for (const qs of qualities) {
    for (const { id, level = 1 } of qs) {
      if (id === item.id) {
        if (!constructionsUsingQualityByLevel.has(level))
          constructionsUsingQualityByLevel.set(level, []);
        constructionsUsingQualityByLevel.get(level)!.push(construction);
      }
    }
  }
}
const constructionsUsingQualityByLevelList = [
  ...constructionsUsingQualityByLevel.entries(),
].sort((a, b) => a[0] - b[0]);
constructionsUsingQualityByLevelList.forEach(([, constructions]) => {
  constructions.sort((a, b) =>
    singularName(data.byId("construction_group", a.group)).localeCompare(
      singularName(data.byId("construction_group", b.group))
    )
  );
});
</script>

<h1>{t("Quality", { _comment: "Tool Quality" })}: {singularName(item)}</h1>
{#if item.usages}
  <section>
    <h1>{t("Usages", { _context })}</h1>
    <dl>
      {#each item.usages as [level, usages]}
        <dt style="font-variant: tabular-nums">
          {t("Level {level}", { level, _context })}
        </dt>
        <dd>
          <ul class="comma-separated">
            <!-- prettier-ignore -->
            {#each usages as usage}<li><ThingLink type="item_action" id={usage} /></li>{/each}
          </ul>
        </dd>
      {/each}
    </dl>
  </section>
{/if}
{#if toolsWithQualityByLevelList.length}
  <section>
    <h1>{t("Tools", { _context })}</h1>
    <dl>
      {#each toolsWithQualityByLevelList as [level, tools]}
        <dt style="font-variant: tabular-nums">
          {t("Level {level}", { level, _context })}
        </dt>
        <dd>
          <LimitedList items={tools} limit={20} let:item>
            <ItemSymbol {item} />
            <ThingLink type="item" id={item.id} />
          </LimitedList>
        </dd>
      {/each}
    </dl>
  </section>
{/if}
{#if vpartsWithQualityByLevelList.length}
  <section>
    <h1>{t("Vehicle Parts")}</h1>
    <dl>
      {#each vpartsWithQualityByLevelList as [level, vparts]}
        <dt style="font-variant: tabular-nums">
          {t("Level {level}", { level, _context })}
        </dt>
        <dd>
          <LimitedList items={vparts.sort(byName)} limit={20} let:item>
            <ItemSymbol {item} />
            <ThingLink type="vehicle_part" id={item.id} />
          </LimitedList>
        </dd>
      {/each}
    </dl>
  </section>
{/if}
{#if recipesUsingQualityList.length}
  <section>
    <h1>{t("Recipes")}</h1>
    <dl>
      {#each recipesUsingQualityList as [level, recipes]}
        <dt style="font-variant: tabular-nums">
          {t("Level {level}", { level, _context })}
        </dt>
        <dd>
          <LimitedList items={recipes} let:item limit={20}>
            <ItemSymbol item={data.byId("item", item)} />
            <ThingLink type="item" id={item} />
          </LimitedList>
        </dd>
      {/each}
    </dl>
  </section>
{/if}
{#if constructionsUsingQualityByLevelList.length}
  <section>
    <h1>{t("Constructions")}</h1>
    <dl>
      {#each constructionsUsingQualityByLevelList as [level, constructions]}
        <dt style="font-variant: tabular-nums">
          {t("Level {level}", { level, _context })}
        </dt>
        <dd>
          <LimitedList items={constructions} let:item={f}>
            <ThingLink id={f.group} type="construction_group" />
            {#if f.pre_terrain}
              on {#each [f.pre_terrain].flat() as preTerrain, i}
                {@const itemType = preTerrain.startsWith("f_")
                  ? "furniture"
                  : "terrain"}
                {#if i !== 0}{i18n.__(" OR ")}{/if}
                <ItemSymbol item={data.byId(itemType, preTerrain)} />
                <ThingLink type={itemType} id={preTerrain} />
              {/each}
            {/if}
          </LimitedList>
        </dd>
      {/each}
    </dl>
  </section>
{/if}
