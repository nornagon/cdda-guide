<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { byName, CddaData } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { MonsterFlag } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";
import ColorText from "./ColorText.svelte";

export let item: MonsterFlag;

let data = getContext<CddaData>("data");

const monstersWithFlag = data
  .byType("monster")
  .filter((f) => f.id && f.flags?.includes(item.id));
</script>

<h1>{t("Flag", { _comment: "Section heading" })}: {item.id}</h1>
{#if item["//"]}
  <section>
    <p><ColorText text={item["//"]} /></p>
  </section>
{/if}
{#if monstersWithFlag.length}
  <section>
    <h1>{t("Monsters")}</h1>
    <LimitedList items={monstersWithFlag.sort(byName)} let:item>
      <ItemSymbol {item} />
      <ThingLink type="monster" id={item.id} />
    </LimitedList>
  </section>
{/if}
