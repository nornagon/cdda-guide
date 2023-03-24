<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import type { CddaData } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

let deconstructibleFrom = data.deconstructFrom(item_id);
</script>

{#if deconstructibleFrom.length}
  <section>
    <h1>{t("Deconstruct", { _context: "Obtaining" })}</h1>
    <LimitedList items={deconstructibleFrom} let:item={f}>
      <ItemSymbol item={data.byId(f.type, f.id)} />
      <ThingLink id={f.id} type={f.type} />
    </LimitedList>
  </section>
{/if}
