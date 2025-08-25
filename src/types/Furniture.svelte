<script lang="ts">
import { CddaData, i18n, singular, singularName } from "../data";
import type { Furniture } from "../types";
import ThingLink from "./ThingLink.svelte";
import { getContext } from "svelte";
import Construction from "./Construction.svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";
import { t } from "@transifex/native";
import TerFurnActivity from "./TerFurnActivity.svelte";
import FurnitureSpawnedIn from "./item/FurnitureSpawnedIn.svelte";
import LimitedList from "../LimitedList.svelte";
import ModTag from "./ModTag.svelte";

const data = getContext<CddaData>("data");
const _context = "Terrain / Furniture";

interface Props {
  item: Furniture;
}

let { item }: Props = $props();

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

const bashedFrom = data
  .byType("furniture")
  .filter((f) => f.id && f.bash?.furn_set === item.id);

const harvestBySeason: Map<string, string> = new Map();
for (const { seasons, id } of item.harvest_by_season ?? []) {
  for (const season of seasons) {
    harvestBySeason.set(season, id);
  }
}
const seasonOrder = ["winter", "spring", "summer", "autumn"];
const harvestBySeasonList = [...harvestBySeason.entries()];
harvestBySeasonList.sort(
  (a, b) => seasonOrder.indexOf(a[0]) - seasonOrder.indexOf(b[0]),
);
</script>

<h1><ItemSymbol {item} /> {singularName(item)} <ModTag {item} /></h1>

<section>
  <h1>{t("General", { _context })}</h1>
  <dl>
    <dt>{t("Move Cost Modifier", { _context })}</dt>
    <dd>
      {#if item.move_cost_mod < 0}<em>{t("impassable", { _context })}</em
        >{:else}+{item.move_cost_mod * 50}{/if}
    </dd>
    <dt>{t("Strength Required to Drag", { _context })}</dt>
    <dd>{item.required_str >= 0 ? item.required_str : "not movable"}</dd>
    <dt>{t("Coverage", { _context })}</dt>
    <dd>{item.coverage ?? 0}%</dd>
    {#if item.comfort}
      <dt>{t("Comfort", { _context })}</dt>
      <dd>{item.comfort}</dd>
    {/if}
    {#if item.max_volume}
      <dt>{t("Max Volume", { _context })}</dt>
      <dd>{item.max_volume}</dd>
    {/if}
    {#if item.crafting_pseudo_item}
      <dt>{t("Provides", { _context })}</dt>
      <dd><ThingLink type="item" id={item.crafting_pseudo_item} /></dd>
    {/if}
    {#if item.boltcut}
      <dt><ThingLink type="item_action" id="BOLTCUTTERS" /></dt>
      <dd>
        <TerFurnActivity act={item.boltcut} resultType="furniture" />
      </dd>
    {/if}
    {#if item.hacksaw}
      <dt><ThingLink type="item_action" id="HACKSAW" /></dt>
      <dd>
        <TerFurnActivity act={item.hacksaw} resultType="furniture" />
      </dd>
    {/if}
    {#if item.oxytorch}
      <dt><ThingLink type="item_action" id="OXYTORCH" /></dt>
      <dd>
        <TerFurnActivity act={item.oxytorch} resultType="furniture" />
      </dd>
    {/if}
    {#if item.prying}
      <dt><ThingLink type="item_action" id="CROWBAR" /></dt>
      <dd>
        <TerFurnActivity act={item.prying} resultType="furniture" />
      </dd>
    {/if}
    {#if deconstruct.length}
      <dt>{t("Deconstruct", { _context })}</dt>
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
            <dt>{t("Becomes", { _context })}</dt>
            <dd>
              <ItemSymbol item={data.byId("furniture", becomes)} />
              <ThingLink type="furniture" id={becomes} />
            </dd>
          </dl>
        {/if}
      </dd>
    {/if}
    {#if bash.length}
      <dt>{t("Bash", { _context })}</dt>
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
          <dt>{t("Strength Required", { _context })}</dt>
          <dd>{item.bash?.str_min ?? 0}</dd>
          {#if item.bash?.furn_set}
            {@const becomes = item.bash.furn_set}
            <dt>{t("Becomes", { _context })}</dt>
            <dd>
              <ItemSymbol item={data.byId("furniture", becomes)} />
              <ThingLink type="furniture" id={becomes} />
            </dd>
          {/if}
        </dl>
      </dd>
    {/if}
    {#if harvestBySeasonList.length}
      <dt>{t("Harvest", { _context })}</dt>
      <dd>
        <dl>
          {#each harvestBySeasonList as [season, harvestId]}
            <dt>{i18n.__(season.replace(/^(.)/, (x) => x.toUpperCase()))}</dt>
            <dd>
              {#each [data.byId("harvest", harvestId)] as harvest}
                <ul>
                  {#each harvest.entries as harvest_entry}
                    {#if harvest_entry.type === "bionic_group"}
                      {#each data.flattenTopLevelItemGroup(data.byId("item_group", harvest_entry.drop)) as { id, prob }}
                        <li>
                          <ItemSymbol item={data.byId("item", id)} />
                          <ThingLink type="item" {id} /> ({(prob * 100).toFixed(
                            2,
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
  <p style="color: var(--cata-color-gray)">{singular(item.description)}</p>
</section>

{#if constructions.length}
  <h2>{t("Construction", { _context })}</h2>
  {#each constructions as construction}
    <Construction {construction} includeTitle />
  {/each}
{/if}

{#if bashedFrom.length}
  <section>
    <h1>{t("Bashed From", { _context })}</h1>
    <LimitedList items={bashedFrom}>
      {#snippet children({ item })}
        <ItemSymbol {item} />
        <ThingLink type="furniture" id={item.id} />
      {/snippet}
    </LimitedList>
  </section>
{/if}

<FurnitureSpawnedIn item_id={item.id} />
