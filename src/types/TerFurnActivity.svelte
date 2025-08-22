<script lang="ts">
import { t } from "@transifex/native";
import type { CddaData } from "src/data";
import type { ActivityDataCommon } from "src/types";
import { getContext } from "svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

interface Props {
  act: ActivityDataCommon & { result?: string };
  resultType: "terrain" | "furniture";
}

let { act, resultType }: Props = $props();

const data = getContext<CddaData>("data");

const _context = "Terrain / Furniture";
const _comment = "activity (prying, hacksawing, etc.)";
</script>

<ul class="comma-separated">
  {#each act.byproducts ?? [] as { item: i, count }}
    <li>
      <ThingLink
        id={i}
        type="item" />{#if typeof count === "number"}&nbsp;({count}){:else if Array.isArray(count)}&nbsp;({count[0]}–{count[1]}){/if}
    </li>
  {/each}
</ul>
<dl>
  <dt>{t("Duration", { _context, _comment })}</dt>
  <dd>{act.duration ?? "1 s"}</dd>
  {#if act.prying_data}
    <dt>{t("Difficulty", { _context, _comment })}</dt>
    <dd>{act.prying_data.difficulty ?? 0}</dd>
    <dt>{t("Requires", { _context, _comment })}</dt>
    <dd>
      <ThingLink id="PRY" type="tool_quality" />
      {act.prying_data.prying_level ?? 0}{#if act.prying_data.prying_nails}, <ThingLink
          id="PRYING_NAIL"
          type="tool_quality" />&nbsp;1{/if}
    </dd>
    <dt>{t("Noisy", { _context, _comment })}</dt>
    <dd>{act.prying_data.noisy ? t("Yes") : t("No")}</dd>
    <dt>{t("Alarm", { _context, _comment })}</dt>
    <dd>{act.prying_data.alarm ? t("Yes") : t("No")}</dd>
    <dt>{t("Breakable", { _context, _comment })}</dt>
    <dd>{act.prying_data.breakable ? t("Yes") : t("No")}</dd>
  {/if}
  {#if act.result}
    <dt>{t("Result", { _context, _comment })}</dt>
    <dd>
      <ItemSymbol item={data.byId(resultType, act.result)} />
      <ThingLink id={act.result} type={resultType} />
    </dd>
  {/if}
</dl>
