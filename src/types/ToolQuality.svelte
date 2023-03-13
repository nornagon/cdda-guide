<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { byName, CddaData, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { Item, VehiclePart, ToolQuality } from "../types";
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
  if (!it.result || it.construction_blueprint || !data.byId("item", it.result))
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
            {#each usages as usage}
              <li>{singularName(data.byId("item_action", usage))}</li>
            {/each}
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
