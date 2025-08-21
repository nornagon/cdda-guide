<script lang="ts">
import { getContext } from "svelte";
import { byName, CddaData } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";
import { t } from "@transifex/native";

  interface Props {
    item_id: string;
  }

  let { item_id }: Props = $props();

const data = getContext<CddaData>("data");

const milledFrom = data
  .byType("item")
  .filter((it) => it.id && it.milling?.into === item_id);

milledFrom.sort(byName);
</script>

{#if milledFrom.length}
  <section>
    <h1>{t("Mill", { _context: "Obtaining" })}</h1>
    <LimitedList items={milledFrom} >
      {#snippet children({ item })}
            <ItemSymbol {item} />
        <ThingLink type="item" id={item.id} />
                {/snippet}
        </LimitedList>
  </section>
{/if}
