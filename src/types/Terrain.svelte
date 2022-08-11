<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";

import {
  CddaData,
  i18n,
  showProbability,
  singular,
  singularName,
} from "../data";
import type { Terrain } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

const data = getContext<CddaData>("data");
const _context = "Terrain / Furniture";

export let item: Terrain;

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

const bits = [
  [t("Deconstruct", { _context }), deconstruct],
  [t("Bash", { _context }), bash],
] as const;

const harvestBySeason: Map<string, string> = new Map();
for (const { seasons, id } of item.harvest_by_season ?? []) {
  for (const season of seasons) {
    harvestBySeason.set(season, id);
  }
}
</script>

<h1>
  <ItemSymbol {item} />
  {singularName(item)}
</h1>

<section>
  <dl>
    <dt>{t("Move Cost", { _context })}</dt>
    <dd>{item.move_cost ?? 100}</dd>
    <dt>{t("Coverage", { _context })}</dt>
    <dd>{item.coverage ?? 0}%</dd>
    {#if item.transforms_into}
      <dt>{t("Transforms Into", { _context })}</dt>
      <dd>
        <ItemSymbol item={data.byId("terrain", item.transforms_into)} />
        <ThingLink id={item.transforms_into} type="terrain" />
      </dd>
    {/if}
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
      <dt>{t("Harvest", { _context })}</dt>
      <dd>
        <dl>
          {#each ["winter", "spring", "summer", "autumn"].filter( (season) => harvestBySeason.has(season) ) as season}
            <dt>{i18n.__(season.replace(/^(.)/, (x) => x.toUpperCase()))}</dt>
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
    <dt>{t("Flags")}</dt>
    <dd>
      <ul class="comma-separated">
        {#each item.flags ?? [] as flag}
          <li><ThingLink type="json_flag" id={flag} /></li>
        {:else}
          <li><em>{t("none")}</em></li>
        {/each}
      </ul>
    </dd>
  </dl>
  <p style="color: var(--cata-color-gray); margin-bottom: 0;">
    {singular(item.description)}
  </p>
</section>
