<script lang="ts">
import { getContext } from "svelte";
import { CddaData, itemGroupFromVehicle } from "../../data";
import { showProbability } from "./utils";
import LimitedList from "../../LimitedList.svelte";
import ThingLink from "../ThingLink.svelte";
import { t } from "@transifex/native";

interface Props {
  item_id: string;
}

let { item_id }: Props = $props();

const data = getContext<CddaData>("data");

const vehiclesAndProbabilities = data
  .byType("vehicle")
  .filter((i) => i.id)
  .flatMap((vehicle) => {
    const group = itemGroupFromVehicle(vehicle);
    const flatGroup = data.flattenItemGroup(group);
    const self = flatGroup.find((e) => e.id === item_id);
    if (self) return [{ vehicle, prob: self.prob, count: self.count }];
    else return [];
  });
vehiclesAndProbabilities.sort((a, b) => b.prob - a.prob);
</script>

{#if vehiclesAndProbabilities.length}
  <section>
    <h1>{t("In Vehicle", { _context: "Obtaining" })}</h1>
    <LimitedList items={vehiclesAndProbabilities}>
      {#snippet children({ item: { vehicle, prob } })}
        <ThingLink id={vehicle.id} type="vehicle" /> ({showProbability(prob)})
      {/snippet}
    </LimitedList>
  </section>
{/if}
