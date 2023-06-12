<script lang="ts">
import { mapType, singular, singularName, loadProgress } from "./data";
import type { CddaData } from "./data";
import * as fuzzysort from "fuzzysort";
import ItemSymbol from "./types/item/ItemSymbol.svelte";
import type {
  Item,
  SupportedTypeMapped,
  SupportedTypesWithMapped,
} from "./types";
import { setContext } from "svelte";
import { t } from "@transifex/native";
import ThingLink from "./types/ThingLink.svelte";
import LimitedList from "./LimitedList.svelte";

const SEARCHABLE_TYPES = new Set<keyof SupportedTypesWithMapped>([
  "item",
  "monster",
  "furniture",
  "vehicle_part",
  "tool_quality",
  "martial_art",
  "mutation",
  "mutation_category",
  "vehicle",
  "terrain",
  "skill",
]);

type SearchableType = SupportedTypeMapped & {
  id: string;
  type: keyof SupportedTypesWithMapped;
} & { __filename?: string };

export let data: CddaData;
$: setContext("data", data);

type SearchTarget = {
  id: string;
  variant_id?: string;
  name: string;
  type: keyof SupportedTypesWithMapped;
};
let targets: SearchTarget[];
function searchableName(data: CddaData, item: any) {
  if (item?.type === "vehicle_part" && !item.name && item.item)
    item = data.byId("item", item.item);
  return singularName(item);
}

function isItem(item: SupportedTypeMapped): item is Item {
  return mapType(item.type) === "item";
}

function itemVariants(item: SupportedTypeMapped) {
  if (isItem(item) && "variants" in item && item.variants) return item.variants;
  else return [];
}

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
        name: searchableName(data, x),
        type: mapType(x.type),
      },
    ].concat(
      itemVariants(x).map((v) => ({
        id: (x as any).id,
        variant_id: v.id,
        name: singular(v.name),
        type: mapType(x.type),
      }))
    )
  );

export let search: string;

function filter(
  text: string
): Map<
  string,
  { item: SearchableType; variant?: { name: string; id: string } }[]
> {
  const results = fuzzysort.go(text, targets, {
    keys: ["id", "name", "variant_id"],
    threshold: -10000,
  });
  const byType = new Map<
    string,
    { item: SearchableType; variant?: { name: string; id: string } }[]
  >();
  for (const { obj: item } of results) {
    const mappedType = item.type;
    if (!SEARCHABLE_TYPES.has(mappedType)) continue;
    if (!byType.has(mappedType)) byType.set(mappedType, []);
    if (byType.get(mappedType)!.some((x) => x.item.id === item.id)) continue;
    const obj = data.byId(mappedType, item.id) as SearchableType;
    const variant = item.variant_id
      ? {
          id: item.variant_id,
          name: item.name,
        }
      : undefined;
    byType.get(mappedType)!.push({ item: obj, variant });
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
$: matchingObjectsList = matchingObjects
  ? [...matchingObjects.entries()]
  : null;
</script>

{#if matchingObjectsList}
  {#each matchingObjectsList as [type, results]}
    <h1>{type.replace(/_/g, " ")}</h1>
    <LimitedList items={results} let:item={result} limit={50}>
      {@const item = data._flatten(result.item)}
      <ItemSymbol {item} />
      <ThingLink
        type={mapType(result.item.type)}
        id={result.item.id}
        variantId={result.variant?.id} />
      {#if /obsolet/.test(result.item.__filename ?? "")}
        <em style="color: var(--cata-color-gray)"
          >({t("obsolete", { _context: "Search Results" })})</em>
      {/if}
    </LimitedList>
  {:else}
    <em>{t("No results.", { _context: "Search Results" })}</em>
  {/each}
{:else if data || !$loadProgress}
  <pre>...</pre>
{:else}
  <pre>{($loadProgress[0] / 1024 / 1024).toFixed(1)}/{(
      $loadProgress[1] /
      1024 /
      1024
    ).toFixed(1)} MB</pre>
{/if}
