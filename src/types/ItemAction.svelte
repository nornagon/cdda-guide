<script lang="ts">
import type { ItemAction } from "../types";
import {
  normalizeUseAction,
  type CddaData,
  singularName,
  byName,
} from "../data";
import { getContext } from "svelte";
import ThingLink from "./ThingLink.svelte";
import { t } from "@transifex/native";
import LimitedList from "../LimitedList.svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";

interface Props {
  item: ItemAction;
}

let { item }: Props = $props();

const data = getContext<CddaData>("data");

const providers = data
  .byType("item")
  .filter(
    (i) =>
      i.id &&
      normalizeUseAction(i.use_action).some((i) =>
        i.type === "__item_action__"
          ? i.id === item.id
          : (i.type === "repair_item" && i.item_action_type === item.id) ||
            i.type === item.id,
      ),
  );
providers.sort(byName);

const providerQualities = data
  .byType("tool_quality")
  .filter((i) => i.id && i.usages?.some((u) => u[1].includes(item.id)));
</script>

<h1>{singularName(item)}</h1>

{#if providers.length}
  <section>
    <h1>{t("Provided By", { _context: "Use action" })}</h1>
    <LimitedList items={providers}>
      {#snippet children({ item })}
        <ItemSymbol {item} />
        <ThingLink type="item" id={item.id} />
      {/snippet}
    </LimitedList>
  </section>
{/if}

{#if providerQualities.length}
  <section>
    <h1>{t("Provided By Quality", { _context: "Use action" })}</h1>
    <LimitedList items={providerQualities}>
      {#snippet children({ item })}
        <ItemSymbol {item} />
        <ThingLink type={item.type} id={item.id} />
      {/snippet}
    </LimitedList>
  </section>
{/if}
