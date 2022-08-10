<script lang="ts">
import LimitedList from "../../LimitedList.svelte";
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import type { ItemBasicInfo } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";
import { t } from "@transifex/native";

export let item: ItemBasicInfo;
const data = getContext<CddaData>("data");

const compatibleItems = data
  .byType("item")
  .filter((x) => x.id)
  .filter((i) => {
    return i.pocket_data?.some(
      (p) =>
        (p.pocket_type === "MAGAZINE_WELL" || p.pocket_type === "MAGAZINE") &&
        (p.item_restriction?.includes(item.id) ||
          p.allowed_speedloaders?.includes(item.id) ||
          p.flag_restriction?.some((f) => item.flags?.includes(f)))
    );
  });

compatibleItems.sort((a, b) => singularName(a).localeCompare(singularName(b)));
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
