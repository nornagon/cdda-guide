<script lang="ts">
import { t } from "@transifex/native";
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;
const _context = "Item Basic Info";

const data = getContext<CddaData>("data");

const { byTool, byComponent } = data.getItemComponents();

const recipes: Set<string> = byComponent.get(item_id) ?? new Set();
const toolRecipes: Set<string> = byTool.get(item_id) ?? new Set();

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
