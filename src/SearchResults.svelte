<script lang="ts">
import { mapType, singularName } from "./data";
import type { CddaData } from "./data";
import * as fuzzysort from "fuzzysort";
import FurnitureSymbol from "./types/item/FurnitureSymbol.svelte";
import ItemSymbol from "./types/item/ItemSymbol.svelte";
import type { SupportedTypesWithMapped } from "./types";

const SEARCHABLE_TYPES = new Set<keyof SupportedTypesWithMapped>([
  "item",
  "monster",
  "furniture",
  "vehicle_part",
  "tool_quality",
  "martial_art",
  "mutation",
  "vehicle",
]);

export let data: CddaData;

let targets: {
  id: string;
  name: string;
  type: keyof SupportedTypesWithMapped;
}[];
$: targets = [...(data?.all() ?? [])]
  .filter(
    (x) =>
      "id" in x &&
      typeof x.id === "string" &&
      SEARCHABLE_TYPES.has(mapType(x.type))
  )
  .filter((x) => {
    if (x.type === "mutation") {
      return !/Fake\d$/.test(x.id);
    }
    return true;
  })
  .map((x) => ({
    id: (x as any).id,
    name: singularName(x),
    type: mapType(x.type),
  }));

export let search: string;

function filter(text: string): Map<string, any[]> {
  const results = fuzzysort.go(text, targets, {
    limit: 100,
    keys: ["id", "name"],
    threshold: -10000,
  });
  const byType = new Map<string, any[]>();
  for (const { obj: item } of results) {
    const mappedType = item.type;
    if (!SEARCHABLE_TYPES.has(mappedType)) continue;
    if (!byType.has(mappedType)) byType.set(mappedType, []);
    const obj = data.byId(mappedType, item.id);
    if (!obj) debugger;
    byType.get(mappedType).push(obj);
  }
  return byType;
}

$: matchingObjects = search && search.length > 1 && data && filter(search);

$: history.replaceState({ search }, "");
</script>

{#if matchingObjects}
  {#each [...matchingObjects.keys()] as type}
    <h1>{type.replace(/_/g, " ")}</h1>
    <ul>
      {#each matchingObjects.get(type) as obj}
        <li>
          {#if type === "furniture"}
            <FurnitureSymbol item={data._flatten(obj)} />
          {:else if type === "item" || type === "monster"}
            <ItemSymbol item={data._flatten(obj)} />
          {/if}
          <a href="#/{mapType(obj.type)}/{obj.id}"
            >{singularName(data._flatten(obj))}</a>
        </li>
      {/each}
    </ul>
  {:else}
    <em>No results.</em>
  {/each}
{:else}
  <pre>...</pre>
{/if}
