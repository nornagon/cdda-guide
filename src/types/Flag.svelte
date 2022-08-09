<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { JsonFlag } from "../types";
import ColorText from "./ColorText.svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: JsonFlag;

let data = getContext<CddaData>("data");

const itemsWithFlag = data
  .byType("item")
  .filter((f) => f.id && f.flags?.includes(item.id));
const vpartsWithFlag = data
  .byType("vehicle_part")
  .filter((f) => f.id && f.flags?.includes(item.id));
const furnitureWithFlag = data
  .byType("furniture")
  .filter((f) => f.id && f.flags?.includes(item.id));
const terrainWithFlag = data
  .byType("terrain")
  .filter((f) => f.id && f.flags?.includes(item.id));
const bionicWithFlag = data
  .byType("bionic")
  .filter(
    (f) =>
      f.id &&
      (f.flags?.includes(item.id) ||
        f.active_flags?.includes(item.id) ||
        f.inactive_flags?.includes(item.id))
  );
</script>

<h1>Flag: {item.id}</h1>
{#if item.info}
  <section>
    <p><ColorText text={item.info} /></p>
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
      <ItemSymbol {item} />
      <ThingLink type="vehicle_part" id={item.id} />
    </LimitedList>
  </section>
{/if}
{#if terrainWithFlag.length}
  <section>
    <h1>Terrain</h1>
    <LimitedList
      items={terrainWithFlag.sort((a, b) =>
        singularName(a).localeCompare(singularName(b))
      )}
      let:item>
      <ItemSymbol {item} />
      <ThingLink type="terrain" id={item.id} />
    </LimitedList>
  </section>
{/if}
{#if furnitureWithFlag.length}
  <section>
    <h1>Furniture</h1>
    <LimitedList
      items={furnitureWithFlag.sort((a, b) =>
        singularName(a).localeCompare(singularName(b))
      )}
      let:item>
      <ItemSymbol {item} />
      <ThingLink type="furniture" id={item.id} />
    </LimitedList>
  </section>
{/if}
{#if bionicWithFlag.length}
  <section>
    <h1>Bionics</h1>
    <LimitedList
      items={bionicWithFlag.sort((a, b) =>
        singularName(a).localeCompare(singularName(b))
      )}
      let:item>
      <ItemSymbol {item} />
      <ThingLink type="bionic" id={item.id} />
    </LimitedList>
  </section>
{/if}
