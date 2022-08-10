<script lang="ts">
import { t } from "@transifex/native";
import type { BionicSlot, ItemBasicInfo } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let item: ItemBasicInfo & BionicSlot;

const _context = "Item Bionic Info";
</script>

<section>
  <h1>{t("Bionic", { _context, _comment: "Section heading" })}</h1>
  <dl>
    <dt>{t("Installs as", { _context })}</dt>
    <dd><ThingLink type="bionic" id={item.bionic_id ?? item.id} /></dd>
    <dt>{t("Difficulty", { _context })}</dt>
    <dd>{item.difficulty ?? 0}</dd>
    <dt>{t("Is upgrade", { _context })}</dt>
    <dd>{item.is_upgrade ? "yes" : "no"}</dd>
    {#if item.installation_data}
      <dt>{t("Installation data", { _context })}</dt>
      <dd><ThingLink type="item" id={item.installation_data} /></dd>
    {/if}
  </dl>
</section>
