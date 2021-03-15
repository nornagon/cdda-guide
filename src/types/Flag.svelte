<script lang="ts">
import type { JsonFlag } from "../types";

export let item: JsonFlag
</script>

<h1>Flag: {item.id}</h1>
{#if item.info}
<section>
  <p style="color: var(--cata-color-gray)">{item.info}</p>
</section>
{/if}
