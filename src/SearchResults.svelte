<script lang="ts">
import {
  mapType,
  singular,
  singularName,
  loadProgress,
  i18n,
  omsName,
} from "./data";
import type { CddaData } from "./data";
import * as fuzzysort from "fuzzysort";
import ItemSymbol from "./types/item/ItemSymbol.svelte";
import type {
  Item,
  OvermapSpecial,
  SupportedTypeMapped,
  SupportedTypesWithMapped,
} from "./types";
import { setContext } from "svelte";
import { t } from "@transifex/native";
import ThingLink from "./types/ThingLink.svelte";
import LimitedList from "./LimitedList.svelte";
import LimitedTableList from "./LimitedTableList.svelte";
import OvermapAppearance from "./types/item/OvermapAppearance.svelte";
import {
  getOMSByAppearance,
  overmapAppearance,
} from "./types/item/spawnLocations";

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
  "overmap_special",
  "proficiency",
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
function searchableName(data: CddaData, item: SupportedTypeMapped) {
  item = data._flatten(item);
  if (item?.type === "overmap_special" || item?.type === "city_building") {
    if (item.subtype === "mutable") return item.id;
    else
      return (
        item.overmaps
          ?.filter((omEntry) => omEntry.overmap)
          .map((omEntry) => {
            const normalizedId = omEntry.overmap!.replace(
              /_(north|south|east|west)$/,
              ""
            );
            const om = data.byIdMaybe("overmap_terrain", normalizedId);
            return om ? singularName(om) : normalizedId;
          })
          .join("\0") ?? item.id
      );
  }
  if (item?.type === "vehicle_part" && !item.name && item.item)
    item = data.byId("item", item.item);
  if (i18n.getLocale().startsWith("zh-"))
    return singularName(item) + " " + singularName(item, "pinyin");
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
  .filter((x) => (x.type === "mutation" ? !/Fake\d$/.test(x.id) : true))
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

type SearchResult = {
  item: SearchableType;
  variant?: { name: string; id: string };
};
function filter(text: string): Map<string, SearchResult[]> {
  const results = fuzzysort.go(text, targets, {
    keys: ["id", "name", "variant_id"],
    threshold: -10000,
  });
  const byType = new Map<string, SearchResult[]>();
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

function groupByAppearance(results: SearchResult[]): OvermapSpecial[][] {
  const seenAppearances = new Set<string>();
  const ret: OvermapSpecial[][] = [];
  for (const r of results) {
    const oms = r.item as OvermapSpecial;
    const appearance = overmapAppearance(data, oms);
    if (!appearance) ret.push([oms]);
    else if (!seenAppearances.has(appearance)) {
      ret.push(
        getOMSByAppearance(data)
          .get(appearance)!
          .map((id) => data.byId("overmap_special", id))
      );
      seenAppearances.add(appearance);
    }
  }
  return ret;
}
</script>

{#if matchingObjectsList}
  {#each matchingObjectsList as [type, results]}
    {#if type === "overmap_special"}
      {@const grouped = groupByAppearance(results)}
      <h1>location</h1>
      <LimitedTableList items={grouped} limit={50}>
        <tr slot="item" let:item={result}>
          <td style="text-align: center; padding-left: 2.5em;">
            <OvermapAppearance overmapSpecial={result[0]} />
          </td>
          <td style="vertical-align: middle; padding-left: 5px;">
            <a href="/overmap_special/{result[0].id}{location.search}"
              >{omsName(data, result[0])}</a
            >{#if result.length > 1}{" "}({result.length} variants){/if}
          </td>
        </tr>
      </LimitedTableList>
    {:else}
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
    {/if}
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
