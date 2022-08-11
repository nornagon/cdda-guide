<script lang="ts">
import { CddaData, singular, singularName } from "../data";
import type { Furniture } from "../types";
import ThingLink from "./ThingLink.svelte";
import { getContext } from "svelte";
import Construction from "./Construction.svelte";
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

const harvestBySeason: Map<string, string> = new Map();
for (const { seasons, id } of item.harvest_by_season ?? []) {
  for (const season of seasons) {
    harvestBySeason.set(season, id);
  }
}
</script>

<h1><ItemSymbol {item} /> {singularName(item)}</h1>

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
    {#if item.comfort}
      <dt>Comfort</dt>
      <dd>{item.comfort}</dd>
    {/if}
    {#if item.max_volume}
      <dt>Max Volume</dt>
      <dd>{item.max_volume}</dd>
    {/if}
    {#if item.crafting_pseudo_item}
      <dt>Provides</dt>
      <dd><ThingLink type="item" id={item.crafting_pseudo_item} /></dd>
    {/if}
    {#if deconstruct.length}
      <dt>Deconstruct</dt>
      <dd>
        <ul class="comma-separated">
          <!-- prettier-ignore -->
          {#each deconstruct as {id, prob, count}}
            <li><span style="white-space: nowrap"><ThingLink type="item" {id} />{
              ''}{#if count[0] === count[1]}{#if count[0] !== 1}&nbsp;({count[0]}){/if}{:else}&nbsp;({count[0]}–{count[1]}){/if}{
              ''}{#if prob !== 1}&nbsp;({showProbability(prob)}){/if}</span></li>
            {/each}
        </ul>
        {#if item.deconstruct?.furn_set}
          {@const becomes = item.deconstruct.furn_set}
          <dl>
            <dt>Becomes</dt>
            <dd>
              <ItemSymbol item={data.byId("furniture", becomes)} />
              <ThingLink type="furniture" id={becomes} />
            </dd>
          </dl>
        {/if}
      </dd>
    {/if}
    {#if bash.length}
      <dt>Bash</dt>
      <dd>
        <ul class="comma-separated">
          <!-- prettier-ignore -->
          {#each bash as {id, prob, count}}
            <li><span style="white-space: nowrap"><ThingLink type="item" {id} />{
              ''}{#if count[0] === count[1]}{#if count[0] !== 1}&nbsp;({count[0]}){/if}{:else}&nbsp;({count[0]}–{count[1]}){/if}{
              ''}{#if prob !== 1}&nbsp;({showProbability(prob)}){/if}</span></li>
            {/each}
        </ul>
        <dl>
          <dt>Strength Required</dt>
          <dd>{item.bash?.str_min ?? 0}</dd>
          {#if item.bash?.furn_set}
            {@const becomes = item.bash.furn_set}
            <dt>Becomes</dt>
            <dd>
              <ItemSymbol item={data.byId("furniture", becomes)} />
              <ThingLink type="furniture" id={becomes} />
            </dd>
          {/if}
        </dl>
      </dd>
    {/if}
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
          <li><ThingLink type="json_flag" id={flag} /></li>
        {:else}
          <li><em>none</em></li>
        {/each}
      </ul>
    </dd>
  </dl>
  <p style="color: var(--cata-color-gray)">{singular(item.description)}</p>
</section>

{#if constructions.length}
  <h2>Construction</h2>
  {#each constructions as construction}
    <Construction {construction} includeTitle />
  {/each}
{/if}
