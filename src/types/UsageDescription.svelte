<script lang="ts">
import { CddaData, singular, singularName } from "../data";
import { getContext } from "svelte";
import type { UseFunction } from "../types";
import ThingLink from "./ThingLink.svelte";

const data = getContext<CddaData>("data");

export let usage: UseFunction;

let action =
  usage.type === "__item_action__"
    ? data.byId("item_action", usage.id)
    : data.byId("item_action", usage.type);
let description =
  ("menu_text" in usage ? usage.menu_text : null) ??
  ("name" in usage && usage.name ? singular(usage.name) : null) ??
  singularName(action);
</script>

<ThingLink
  type="item_action"
  id={action.id}
  overrideText={description} />{#if usage.type === "transform" || usage.type === "delayed_transform"}
  {" "}(⟹
  <ThingLink
    type="item"
    id={usage.target} />){:else if usage.type === "consume_drug" && (usage.vitamins?.length || Object.keys(usage.tools_needed ?? {}).length)}
  {" "}({#if Object.keys(usage.tools_needed ?? {}).length}with
    {#each Object.entries(usage.tools_needed ?? {}) as [tool], i}{#if i !== 0},
      {/if}<ThingLink
        type="item"
        id={tool} />{/each}{#if usage.vitamins?.length}:
    {/if}{/if}{#each usage.vitamins ?? [] as [id, lo, hi], i}{@const v =
      data.byId("vitamin", id)}{#if i !== 0}, {/if}<ThingLink
      type={v.type}
      id={v.id} /> ({lo}{hi && hi !== lo ? `–${hi}` : ""}{v.vit_type ===
    "counter"
      ? " U"
      : "%"}){/each}){/if}
