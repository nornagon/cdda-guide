<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { byName, CddaData, singular } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { JsonFlag } from "../types";
import ColorText from "./ColorText.svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

  interface Props {
    item: JsonFlag;
  }

  let { item }: Props = $props();

let data = getContext<CddaData>("data");

const itemsWithFlag = data
  .byType("item")
  .filter((f) => f.id && f.flags?.includes(item.id));
const vpartsWithFlag = data
  .byType("vehicle_part")
  .filter((f) => f.id && f.flags?.includes(item.id));
const furnitureWithFlag = data
  .byType("furniture")
  .filter((f) => f.id && f.flags?.includes(item.id));
const terrainWithFlag = data
  .byType("terrain")
  .filter((f) => f.id && f.flags?.includes(item.id));
const bionicWithFlag = data
  .byType("bionic")
  .filter(
    (f) =>
      f.id &&
      (f.flags?.includes(item.id) ||
        f.active_flags?.includes(item.id) ||
        f.inactive_flags?.includes(item.id))
  );
</script>

<h1>{t("Flag", { _comment: "Section heading" })}: {item.id}</h1>
{#if item.info}
  <section>
    <p><ColorText text={singular(item.info)} /></p>
  </section>
{/if}
{#if itemsWithFlag.length}
  <section>
    <h1>{t("Items", { _comment: "Section heading" })}</h1>
    <LimitedList items={itemsWithFlag.sort(byName)} >
      {#snippet children({ item })}
            <ItemSymbol {item} />
        <ThingLink type="item" id={item.id} />
                {/snippet}
        </LimitedList>
  </section>
{/if}
{#if vpartsWithFlag.length}
  <section>
    <h1>{t("Vehicle Parts")}</h1>
    <LimitedList items={vpartsWithFlag.sort(byName)} >
      {#snippet children({ item })}
            <ItemSymbol {item} />
        <ThingLink type="vehicle_part" id={item.id} />
                {/snippet}
        </LimitedList>
  </section>
{/if}
{#if terrainWithFlag.length}
  <section>
    <h1>{t("Terrain")}</h1>
    <LimitedList items={terrainWithFlag.sort(byName)} >
      {#snippet children({ item })}
            <ItemSymbol {item} />
        <ThingLink type="terrain" id={item.id} />
                {/snippet}
        </LimitedList>
  </section>
{/if}
{#if furnitureWithFlag.length}
  <section>
    <h1>{t("Furniture")}</h1>
    <LimitedList items={furnitureWithFlag.sort(byName)} >
      {#snippet children({ item })}
            <ItemSymbol {item} />
        <ThingLink type="furniture" id={item.id} />
                {/snippet}
        </LimitedList>
  </section>
{/if}
{#if bionicWithFlag.length}
  <section>
    <h1>{t("Bionics")}</h1>
    <LimitedList items={bionicWithFlag.sort(byName)} >
      {#snippet children({ item })}
            <ItemSymbol {item} />
        <ThingLink type="bionic" id={item.id} />
                {/snippet}
        </LimitedList>
  </section>
{/if}
