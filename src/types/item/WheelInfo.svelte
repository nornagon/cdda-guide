<script lang="ts">
import type { WheelSlot } from "../../types";

export let item: WheelSlot
</script>

<section>
  <h1>Wheel</h1>
  <dl>
    <dt>Diameter</dt>
    <dd>{item.diameter ?? 0}"</dd>
    <dt>Width</dt>
    <dd>{item.width ?? 0}"</dd>
  </dl>
</section>
