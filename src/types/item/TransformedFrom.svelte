<script lang="ts">
import { t } from "@transifex/native";
import type {
  DelayedTransformUseFunction,
  Item,
  TransformUseFunction,
} from "../../types";

import { getContext } from "svelte";
import {
  asHumanReadableDuration,
  CddaData,
  normalizeUseAction,
} from "../../data";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");
const transformedFrom = data
  .byType("item")
  .filter((i) =>
    normalizeUseAction(i.use_action).some(
      (a) => "target" in a && a.target === item_id
    )
  );
const getTransformAction = (item: Item) =>
  normalizeUseAction(item.use_action).find(
    (a) => "target" in a && a.target === item_id
  ) as TransformUseFunction | DelayedTransformUseFunction;
</script>

{#if transformedFrom.length}
  <section>
    <h1>{t("Transformed From", { _context: "Obtaining" })}</h1>
    <LimitedList items={transformedFrom} let:item>
      {@const ua = getTransformAction(item)}
      <ItemSymbol item={data.byId("item", item.id)} />
      <ThingLink
        type="item"
        id={item.id} />{#if ua.type === "delayed_transform" && ua.transform_age}{" "}({asHumanReadableDuration(
          ua.transform_age * 100
        )}){/if}
    </LimitedList>
  </section>
{/if}
