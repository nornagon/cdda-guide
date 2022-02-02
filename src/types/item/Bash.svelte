<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singularName } from "../../data";
import LimitedList from "../../LimitedList.svelte";
import type { Terrain, Furniture } from "../../types";
import ThingLink from "../ThingLink.svelte";
import ItemSymbol from "./ItemSymbol.svelte";

export let item_id: string;

const data = getContext<CddaData>("data");

let bashFrom = (data.byType("terrain") as (Terrain | Furniture)[])
  .concat(data.byType("furniture"))
  .filter((f) => {
    const bash = f.bash?.items
      ? data.flattenItemGroup({
          subtype: "collection",
          entries:
            typeof f.bash.items === "string"
              ? [{ group: f.bash.items }]
              : f.bash.items,
        })
      : [];

    return bash.some(({ id }) => id === item_id);
  })
  .sort((a, b) => singularName(a).localeCompare(singularName(b)));
</script>

{#if bashFrom.length}
  <section>
    <h1>Bash</h1>
    <LimitedList items={bashFrom} let:item={f}>
      <ItemSymbol item={data.byId(f.type, f.id)} />
      <ThingLink id={f.id} type={f.type} />
    </LimitedList>
  </section>
{/if}
