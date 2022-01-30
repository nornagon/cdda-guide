<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { Item, VehiclePart, JsonFlag } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: JsonFlag;

let data = getContext<CddaData>("data");

let itemsWithFlag = new Array<Item>();
for (const it of data.byType("item")) {
  if (!it.id) continue;
  const q = (it.flags ?? []).find((id) => id === item.id);
  if (q) {
    itemsWithFlag.push(it);
  }
}

let vpartsWithFlag = new Array<VehiclePart>();
for (const it of data.byType("vehicle_part")) {
  if (!it.id) continue;
  const q = (it.flags ?? []).find((id) => id === item.id);
  if (q) {
    vpartsWithFlag.push(it);
  }
}

function parseColorText(text: string): { string: string; color: string }[] {
  let color = ["gray"];
  const spans: { string: string; color: string }[] = [];
  let remaining = text;
  while (true) {
    const nextColorTag = remaining.match(
      /<\/?(info|good|bad|color|color_[^>]+)>/
    );
    if (nextColorTag) {
      if (nextColorTag.index > 0)
        spans.push({
          string: remaining.substring(0, nextColorTag.index),
          color: color[0],
        });
      if (nextColorTag[0][1] === "/" && color.length > 1) {
        color.shift();
      } else {
        color.unshift(nextColorTag[1]);
      }
      remaining = remaining.substring(
        nextColorTag.index + nextColorTag[0].length
      );
    } else break;
  }
  if (remaining.length) {
    spans.push({ string: remaining, color: color[0] });
  }

  return spans;
}

const spans = parseColorText(item.info ?? "");

const colorLookup = (color: string): string => {
  if (color === "info") return "cyan";
  else if (color === "good") return "green";
  else if (color === "bad") return "red";
  const m = /^color_(.+)$/.exec(color);
  if (m) return m[1];
  return "gray";
};
</script>

<h1>Flag: {item.id}</h1>
{#if item.info}
  <section>
    <p>
      {#each spans as { color, string }}
        <span style="color: var(--cata-color-{colorLookup(color)})"
          >{string}</span>
      {/each}
    </p>
  </section>
{/if}
{#if itemsWithFlag.length}
  <section>
    <h1>Items</h1>
    <LimitedList
      items={itemsWithFlag.sort((a, b) =>
        singularName(a).localeCompare(singularName(b))
      )}
      let:item>
      <ItemSymbol {item} />
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  </section>
{/if}
{#if vpartsWithFlag.length}
  <section>
    <h1>Vehicle Parts</h1>
    <LimitedList
      items={vpartsWithFlag.sort((a, b) =>
        singularName(a).localeCompare(singularName(b))
      )}
      let:item>
      <ThingLink type="vehicle_part" id={item.id} />
    </LimitedList>
  </section>
{/if}
