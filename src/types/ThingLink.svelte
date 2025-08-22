<script lang="ts">
import ThingLink from "./ThingLink.svelte";
import { getContext } from "svelte";
import {
  CddaData,
  countsByCharges,
  pluralName,
  singularName,
  mapType,
  singular,
} from "../data";
import type {
  Item,
  SupportedTypeMapped,
  SupportedTypesWithMapped,
} from "../types";
import MutationColor from "./MutationColor.svelte";

interface Props {
  type: keyof SupportedTypesWithMapped;
  id: string;
  plural?: boolean;
  count?: number | [number, number] | undefined;
  variantId?: string | undefined;
  overrideText?: string | undefined;
}

let {
  type,
  id,
  plural = false,
  count = undefined,
  variantId = undefined,
  overrideText = undefined,
}: Props = $props();

function countToString(count: number | [number, number]): string {
  if (typeof count === "number") return count.toString();
  if (count[0] === count[1]) return count[0].toString();
  return `${count[0]}–${count[1]}`;
}

function countIsPlural(count: number | [number, number]): boolean {
  if (typeof count === "number") return count !== 1;
  if (count[0] === count[1]) return count[0] !== 1;
  return true;
}

const data = getContext<CddaData>("data");

let item = $state(data.byIdMaybe(type, id));
// svelte-ignore state_referenced_locally
if (item?.type === "vehicle_part" && !item.name && item.item)
  item = data.byId("item", item.item);

function isItem(item: SupportedTypeMapped): item is Item {
  return mapType(item.type) === "item";
}
</script>

{#if count != null}
  <span style="white-space: nowrap">
    {#if !countsByCharges(item)}{countToString(count)}{/if}
    <ThingLink
      {type}
      {id}
      plural={countIsPlural(count) &&
        !countsByCharges(
          item,
        )} />{#if countsByCharges(item)}{" "}({countToString(
        count,
      )}){/if}</span>
{:else}
  {@const nameSource =
    item && variantId && isItem(item) && "variants" in item && item.variants
      ? (item.variants.find((v) => v.id === variantId) ?? item)
      : item}
  <a href="{import.meta.env.BASE_URL}{type}/{id}{location.search}"
    >{overrideText
      ? overrideText
      : item
        ? item.type === "addiction_type"
          ? singular(item.type_name)
          : (plural ? pluralName : singularName)(nameSource)
        : id}</a
  >{#if item?.type === "mutation"}&nbsp;<MutationColor mutation={item} />{/if}
{/if}
