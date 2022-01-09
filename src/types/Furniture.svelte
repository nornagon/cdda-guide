<script lang="ts">
import { CddaData, singularName } from "../data";
import type { Furniture } from "../types";
import ThingLink from "./ThingLink.svelte";
import { getContext } from "svelte";
import Construction from "./Construction.svelte";
import FurnitureSymbol from "./item/FurnitureSymbol.svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";

const data = getContext<CddaData>("data");

export let item: Furniture;

const deconstruct = item.deconstruct?.items
  ? data.flattenItemGroup({
      subtype: "collection",
      entries:
        typeof item.deconstruct.items === "string"
          ? [{ group: item.deconstruct.items }]
          : item.deconstruct.items,
    })
  : [];

const bash = item.bash?.items
  ? data.flattenItemGroup({
      subtype: "collection",
      entries:
        typeof item.bash.items === "string"
          ? [{ group: item.bash.items }]
          : item.bash.items,
    })
  : [];

function showProbability(prob: number) {
  const ret = (prob * 100).toFixed(2);
  if (ret === "0.00") return "< 0.01%";
  return ret + "%";
}

const constructions = data
  .byType("construction")
  .filter((c) => c.post_terrain === item.id);

const bits = [
  ["Deconstruct", deconstruct],
  ["Bash", bash],
] as const;

const harvestBySeason: Map<string, string> = new Map();
for (const { seasons, id } of item.harvest_by_season ?? []) {
  for (const season of seasons) {
    harvestBySeason.set(season, id);
  }
}
</script>

<h1><FurnitureSymbol {item} /> {singularName(item)}</h1>

<section>
  <h1>General</h1>
  <dl>
    <dt>Move Cost Modifier</dt>
    <dd>
      {#if item.move_cost_mod < 0}<em>impassable</em
        >{:else}+{item.move_cost_mod * 50}{/if}
    </dd>
    <dt>Strength Required to Drag</dt>
    <dd>{item.required_str >= 0 ? item.required_str : "not movable"}</dd>
    <dt>Coverage</dt>
    <dd>{item.coverage ?? 0}%</dd>
    <dt>Comfort</dt>
    <dd>{item.comfort ?? 0}</dd>
    {#each bits as [title, arr]}
      {#if arr.length}
        <dt>{title}</dt>
        <dd>
          <ul class="comma-separated">
            <!-- prettier-ignore -->
            {#each arr as {id, prob, count}}
            <li><span style="white-space: nowrap"><ThingLink type="item" {id} />{
              ''}{#if count[0] === count[1]}{#if count[0] !== 1}&nbsp;({count[0]}){/if}{:else}&nbsp;({count[0]}–{count[1]}){/if}{
              ''}{#if prob !== 1}&nbsp;({showProbability(prob)}){/if}</span></li>
            {/each}
          </ul>
        </dd>
      {/if}
    {/each}
    {#if harvestBySeason.size}
      <dt>Harvest</dt>
      <dd>
        <dl>
          {#each ["winter", "spring", "summer", "autumn"].filter( (season) => harvestBySeason.has(season) ) as season}
            <dt style="text-transform: capitalize;">{season}</dt>
            <dd>
              {#each [data.byId("harvest", harvestBySeason.get(season))] as harvest}
                <ul>
                  {#each harvest.entries as harvest_entry}
                    {#if harvest_entry.type === "bionic_group"}
                      {#each data.flattenItemGroup(data.byId("item_group", harvest_entry.drop)) as { id, prob }}
                        <li>
                          <ItemSymbol item={data.byId("item", id)} />
                          <ThingLink type="item" {id} /> ({(prob * 100).toFixed(
                            2
                          )}%)
                        </li>
                      {/each}
                    {:else}
                      <li>
                        <ItemSymbol
                          item={data.byId("item", harvest_entry.drop)} />
                        <ThingLink type="item" id={harvest_entry.drop} />
                      </li>
                    {/if}
                  {/each}
                </ul>
              {/each}
            </dd>
          {/each}
        </dl>
      </dd>
    {/if}
    <dt>Flags</dt>
    <dd>
      <ul class="comma-separated">
        {#each item.flags ?? [] as flag}
          <li>{flag}</li>
        {:else}
          <li><em>none</em></li>
        {/each}
      </ul>
    </dd>
  </dl>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>

{#if constructions.length}
  <h2>Construction</h2>
  {#each constructions as construction}
    <Construction {construction} includeTitle />
  {/each}
{/if}
