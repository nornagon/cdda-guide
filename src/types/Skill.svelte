<script lang="ts">
import { singularName } from "../data";
import type { Skill } from "../types";

export let item: Skill;
</script>

<h1>Skill: {singularName(item)}</h1>
<section>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>
