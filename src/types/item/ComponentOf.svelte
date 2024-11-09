<script lang="ts">
import { t } from "@transifex/native";
import { getContext } from "svelte";
import { CddaData, i18n, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;
const _context = "Item Basic Info";

const data = getContext<CddaData>("data");

const itemComponents = data.getItemComponents();

const recipes: Set<string> =
  itemComponents.byComponent.get(item_id) ?? new Set();
const toolRecipes: Set<string> =
  itemComponents.byTool.get(item_id) ?? new Set();

const constructionComponents = data.getConstructionComponents();
const constructions = [
  ...(constructionComponents.byComponent.get(item_id) ?? new Set()),
]
  .map((id) => data.byId("construction", id))
  .sort((a, b) =>
    singularName(data.byId("construction_group", a.group)).localeCompare(
      singularName(data.byId("construction_group", b.group))
    )
  );
const toolConstructions = [
  ...(constructionComponents.byTool.get(item_id) ?? new Set()),
]
  .map((id) => data.byId("construction", id))
  .sort((a, b) =>
    singularName(data.byId("construction_group", a.group)).localeCompare(
      singularName(data.byId("construction_group", b.group))
    )
  );

const providedByVparts = data
  .byType("vehicle_part")
  .filter((vp) => vp.id && vp.pseudo_tools?.some((t) => t.id === item_id));
const providedByFurniture = data
  .byType("furniture")
  .filter((f) => f.id && f.crafting_pseudo_item === item_id);
const results = [...recipes].sort((a, b) =>
  singularName(data.byId("item", a)).localeCompare(
    singularName(data.byId("item", b))
  )
);
const toolResults = [...toolRecipes].sort((a, b) =>
  singularName(data.byId("item", a)).localeCompare(
    singularName(data.byId("item", b))
  )
);
</script>

{#if providedByVparts.length}
  <section>
    <h1>
      {t("Provided By Vehicle Parts", {
        _context,
        _comment: "Section heading",
      })}
    </h1>
    <LimitedList items={providedByVparts} let:item>
      <ItemSymbol {item} />
      <ThingLink type={item.type} id={item.id} />
    </LimitedList>
  </section>
{/if}

{#if providedByFurniture.length}
  <section>
    <h1>
      {t("Provided By Furniture", { _context, _comment: "Section heading" })}
    </h1>
    <LimitedList items={providedByFurniture} let:item>
      <ItemSymbol {item} />
      <ThingLink type={item.type} id={item.id} />
    </LimitedList>
  </section>
{/if}

{#if results.length || toolResults.length}
  <div class="side-by-side">
    {#if results.length}
      <section>
        <h1>{t("Component Of", { _context, _comment: "Section heading" })}</h1>
        <LimitedList items={results} let:item>
          <ItemSymbol item={data.byId("item", item)} />
          <ThingLink type="item" id={item} />
        </LimitedList>
      </section>
    {/if}

    {#if toolResults.length}
      <section>
        <h1>
          {t("Tool For Crafting", { _context, _comment: "Section heading" })}
        </h1>
        <LimitedList items={toolResults} let:item>
          <ItemSymbol item={data.byId("item", item)} />
          <ThingLink type="item" id={item} />
        </LimitedList>
      </section>
    {/if}
  </div>
{/if}

{#if constructions.length || toolConstructions.length}
  <div class="side-by-side">
    {#if constructions.length}
      <section>
        <h1>
          {t("Used In Construction", { _context, _comment: "Section heading" })}
        </h1>
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
      </section>
    {/if}
    {#if toolConstructions.length}
      <section>
        <h1>
          {t("Tool For Construction", {
            _context,
            _comment: "Section heading",
          })}
        </h1>
        <LimitedList items={toolConstructions} let:item={f}>
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
      </section>
    {/if}
  </div>
{/if}
