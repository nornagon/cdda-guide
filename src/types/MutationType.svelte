<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";

import { CddaData, singularName } from "../data";
import { topologicalSort } from "../toposort";
import type { Mutation, MutationType } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: MutationType;

let data = getContext<CddaData>("data");

const allPrereqs = (m: Mutation) =>
  (m.prereqs ?? []).concat(m.prereqs2 ?? []).concat(m.threshreq ?? []);
const mutationsWithType = topologicalSort(
  data
    .byType("mutation")
    .filter((m) => (m.types ?? []).includes(item.id))
    .sort((a, b) => singularName(a).localeCompare(singularName(b))),
  (m) => allPrereqs(m).map((x) => data.byId("mutation", x))
);
</script>

<h1>{t("Mutation Type")}: {singularName(item)}</h1>
<section>
  <dl>
    <dt>{t("Mutations")}</dt>
    <dd>
      <ul>
        {#each mutationsWithType as m}
          <li><ThingLink id={m.id} type="mutation" /></li>
        {/each}
      </ul>
    </dd>
  </dl>
</section>
