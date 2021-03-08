<script lang="ts">
import { singularName } from "../data";
import type { Name } from "../data"

type Skill = {
  type: 'skill'
  id: string
  name: Name
  description: string
}
export let item: Skill
</script>

<h1>Skill: {singularName(item)}</h1>
<section>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>