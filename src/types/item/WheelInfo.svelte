<script lang="ts">
import { t } from "@transifex/native";

import type { WheelSlot } from "../../types";

const _context = "Item Wheel Info";

interface Props {
  item: WheelSlot;
}

let { item }: Props = $props();
</script>

<section>
  <h1>{t("Wheel", { _context })}</h1>
  <dl>
    <dt>{t("Diameter", { _context })}</dt>
    <dd>{item.diameter ?? 0}"</dd>
    <dt>{t("Width", { _context })}</dt>
    <dd>{item.width ?? 0}"</dd>
  </dl>
</section>
