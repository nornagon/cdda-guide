<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { Item, VehiclePart, ToolQuality, Recipe } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: ToolQuality;

let data = getContext<CddaData>("data");

let toolsWithQualityByLevel = new Map<number, Item[]>();
for (const it of data.byType("item")) {
  if (!it.id) continue;
  const q = (it.qualities ?? []).find(([id, _level]) => id === item.id);
  if (q) {
    const [, level] = q;
    if (!toolsWithQualityByLevel.has(level))
      toolsWithQualityByLevel.set(level, []);
    toolsWithQualityByLevel.get(level).push(it);
  }
}

const vpartsWithQualityByLevel = new Map<number, VehiclePart[]>();
for (const it of data.byType<VehiclePart>("vehicle_part")) {
  if (!it.id) continue;
  const q = (it.qualities ?? []).find(([id, _level]) => id === item.id);
  if (q) {
    const [, level] = q;
    if (!vpartsWithQualityByLevel.has(level))
      vpartsWithQualityByLevel.set(level, []);
    vpartsWithQualityByLevel.get(level).push(it);
  }
}

const recipesUsingQualitySet = new Map<number, Set<string>>();
for (const it of data.byType<Recipe>("recipe")) {
  if (it.construction_blueprint || it.type === 'uncraft') continue;
  const { qualities } = data.normalizeRequirements(it);
  for (const qs of qualities) {
    for (const { id, level } of qs) {
      if (id === item.id) {
        if (!recipesUsingQualitySet.has(level))
          recipesUsingQualitySet.set(level, new Set());
        recipesUsingQualitySet.get(level).add(it.result);
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
</script>

<h1>Quality: {singularName(item)}</h1>
{#if item.usages}
  <section>
    <h1>Usages</h1>
    <dl>
      {#each item.usages as [level, usages]}
        <dt style="font-variant: tabular-nums">At Level {level}</dt>
        <dd>
          <ul class="comma-separated">
            {#each usages as usage}
              <li>{usage}</li>
            {/each}
          </ul>
        </dd>
      {/each}
    </dl>
  </section>
{/if}
<section>
  <h1>Tools</h1>
  <dl>
    {#each [...toolsWithQualityByLevel.keys()].sort((a, b) => a - b) as level}
      <dt style="font-variant: tabular-nums">Level {level}</dt>
      <dd>
        <LimitedList
          items={toolsWithQualityByLevel
            .get(level)
            .sort((a, b) => singularName(a).localeCompare(singularName(b)))}
          limit={20}
          let:item>
          <ThingLink type="item" id={item.id} />
        </LimitedList>
      </dd>
    {/each}
  </dl>
</section>
{#if vpartsWithQualityByLevel.size > 0}
  <section>
    <h1>Vehicle Parts</h1>
    <dl>
      {#each [...vpartsWithQualityByLevel.keys()].sort((a, b) => a - b) as level}
        <dt style="font-variant: tabular-nums">Level {level}</dt>
        <dd>
          <LimitedList
            items={vpartsWithQualityByLevel
              .get(level)
              .sort((a, b) => singularName(a).localeCompare(singularName(b)))}
            limit={20}
            let:item>
            <ThingLink type="vehicle_part" id={item.id} />
          </LimitedList>
        </dd>
      {/each}
    </dl>
  </section>
{/if}
{#if recipesUsingQuality.size > 0}
  <section>
    <h1>Recipes</h1>
    <dl>
      {#each [...recipesUsingQuality.keys()].sort((a, b) => a - b) as level}
        <dt style="font-variant: tabular-nums">Level {level}</dt>
        <dd>
          <LimitedList
            items={recipesUsingQuality.get(level)}
            let:item
            limit={20}>
            <ThingLink type="item" id={item} />
          </LimitedList>
        </dd>
      {/each}
    </dl>
  </section>
{/if}
