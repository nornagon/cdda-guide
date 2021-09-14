<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../data";
import type { Item, VehiclePart, JsonFlag } from "../types";
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

let color = ["gray"];
const spans: { string: string; color: string }[] = [];
let remaining = item.info ?? "";
while (true) {
  const nextColorTag = remaining.match(/<\/?(info|good|bad)>/);
  if (nextColorTag) {
    if (nextColorTag.index > 0)
      spans.push({
        string: remaining.substr(0, nextColorTag.index),
        color: color[0],
      });
    if (nextColorTag[0][1] === "/" && color.length > 1) {
      color.shift();
    } else {
      color.unshift(nextColorTag[1]);
    }
    remaining = remaining.substr(nextColorTag.index + nextColorTag[0].length);
  } else break;
}
if (remaining.length) {
  spans.push({ string: remaining, color: color[0] });
}

const colorLookup = (color: string): string => {
  if (color === "info") return "cyan";
  else if (color === "good") return "green";
  else if (color === "bad") return "red";
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
    <ul>
      {#each itemsWithFlag.sort( (a, b) => singularName(a).localeCompare(singularName(b)) ) as { id }}
        <li><ThingLink type="item" {id} /></li>
      {/each}
    </ul>
  </section>
{/if}
{#if vpartsWithFlag.length}
  <section>
    <h1>Vehicle Parts</h1>
    <ul>
      {#each vpartsWithFlag.sort( (a, b) => singularName(a).localeCompare(singularName(b)) ) as { id }}
        <li><ThingLink type="vehicle_part" {id} /></li>
      {/each}
    </ul>
  </section>
{/if}
