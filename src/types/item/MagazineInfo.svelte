<script lang="ts">
import LimitedList from "../../LimitedList.svelte";
import { getContext } from "svelte";
import { byName, CddaData } from "../../data";
import type { ItemBasicInfo } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";
import { t } from "@transifex/native";

interface Props {
  item: ItemBasicInfo;
}

let { item }: Props = $props();
const data = getContext<CddaData>("data");

const compatibleItems = data.compatibleItems(item);

compatibleItems.sort(byName);
</script>

{#if compatibleItems.length}
  <section>
    <h1>{t("Compatible Items", { _context: "Item Magazine Info" })}</h1>
    <LimitedList items={compatibleItems}>
      {#snippet children({ item })}
        <ItemSymbol {item} />
        <ThingLink type="item" id={item.id} />
      {/snippet}
    </LimitedList>
  </section>
{/if}
