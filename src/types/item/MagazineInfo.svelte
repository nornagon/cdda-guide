<script lang="ts">
import LimitedList from "../../LimitedList.svelte";
import { getContext } from "svelte";
import { byName, CddaData } from "../../data";
import type { ItemBasicInfo } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";
import { t } from "@transifex/native";

export let item: ItemBasicInfo;
const data = getContext<CddaData>("data");

const compatibleItems = data.compatibleItems(item);

compatibleItems.sort(byName);
</script>

{#if compatibleItems.length}
  <section>
    <h1>{t("Compatible Items", { _context: "Item Magazine Info" })}</h1>
    <LimitedList items={compatibleItems} let:item>
      <ItemSymbol {item} />
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  </section>
{/if}
