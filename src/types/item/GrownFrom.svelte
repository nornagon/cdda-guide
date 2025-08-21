<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import type { CddaData } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

  interface Props {
    item_id: string;
  }

  let { item_id }: Props = $props();

let data = getContext<CddaData>("data");

const sources = data.grownFrom(item_id);
</script>

{#if sources.length}
  <section>
    <h1>{t("Grown From", { _context: "Obtaining" })}</h1>
    <LimitedList items={sources} >
      {#snippet children({ item })}
            <ItemSymbol {item} />
        <ThingLink id={item.id} type="item" /> ({item.seed_data.grow ?? "1 day"})
                {/snippet}
        </LimitedList>
  </section>
{/if}
