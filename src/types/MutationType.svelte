<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";

import { CddaData, singularName } from "../data";
import type { MutationType } from "../types";
import MutationList from "./MutationList.svelte";

export let item: MutationType;

let data = getContext<CddaData>("data");

const mutationsWithType = data
  .byType("mutation")
  .filter((m) => (m.types ?? []).includes(item.id));
</script>

<h1>{t("Mutation Type")}: {singularName(item)}</h1>
<section>
  <dl>
    <dt>{t("Mutations")}</dt>
    <dd>
      <MutationList mutations={mutationsWithType} />
    </dd>
  </dl>
</section>
