<script lang="ts">
import { getContext } from "svelte";
import { byName, CddaData } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";
import { t } from "@transifex/native";

export let item_id: string;

const data = getContext<CddaData>("data");

const sources = data
  .byType("item")
  .filter(
    (it) => it.id && "smoking_result" in it && it.smoking_result === item_id
  );

sources.sort(byName);
</script>

{#if sources.length}
  <section>
    <h1>{t("Smoke", { _context: "Obtaining" })}</h1>
    <LimitedList items={sources} let:item>
      <ItemSymbol {item} />
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  </section>
{/if}
