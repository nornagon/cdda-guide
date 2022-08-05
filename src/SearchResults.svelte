<script lang="ts">
import { mapType, singular, singularName } from "./data";
import type { CddaData } from "./data";
import * as fuzzysort from "fuzzysort";
import ItemSymbol from "./types/item/ItemSymbol.svelte";
import type { SupportedTypesWithMapped } from "./types";
import { setContext } from "svelte";

const SEARCHABLE_TYPES = new Set<keyof SupportedTypesWithMapped>([
  "item",
  "monster",
  "furniture",
  "vehicle_part",
  "tool_quality",
  "martial_art",
  "mutation",
  "vehicle",
  "terrain",
]);

export let data: CddaData;
$: setContext("data", data);

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
  .flatMap((x) =>
    [
      {
        id: (x as any).id,
        name: singularName(x),
        type: mapType(x.type),
      },
    ].concat(
      "variants" in x
        ? x.variants.map((v) => ({
            id: (x as any).id,
            variant_id: v.id,
            name: singular(v.name),
            type: mapType(x.type),
          }))
        : []
    )
  );

export let search: string;

function filter(text: string): Map<string, any[]> {
  const results = fuzzysort.go(text, targets, {
    limit: 100,
    keys: ["id", "name", "variant_id"],
    threshold: -10000,
  });
  const byType = new Map<string, any[]>();
  for (const { obj: item } of results) {
    const mappedType = item.type;
    if (!SEARCHABLE_TYPES.has(mappedType)) continue;
    if (!byType.has(mappedType)) byType.set(mappedType, []);
    if (byType.get(mappedType).some((x) => x.id === item.id)) continue;
    const obj = data.byId(mappedType, item.id);
    byType.get(mappedType).push(obj);
  }
  return byType;
}

const cjkRegex =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\u3131-\ud79d]/;
$: matchingObjects =
  search &&
  (search.length >= 2 || cjkRegex.test(search)) &&
  data &&
  filter(search);

$: history.replaceState({ search }, "");
</script>

{#if matchingObjects}
  {#each [...matchingObjects.keys()] as type}
    <h1>{type.replace(/_/g, " ")}</h1>
    <ul>
      {#each matchingObjects.get(type) as obj}
        <li>
          <ItemSymbol item={data._flatten(obj)} />
          <a href="#/{mapType(obj.type)}/{obj.id}"
            >{singularName(data._flatten(obj))}</a>
          {#if /obsolet/.test(obj.__filename)}
            <em style="color: var(--cata-color-gray)">(obsolete)</em>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <em>No results.</em>
  {/each}
{:else}
  <pre>...</pre>
{/if}
