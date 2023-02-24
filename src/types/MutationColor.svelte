<script lang="ts">
import type { Mutation } from "src/types";

export let mutation: Mutation;

let displayColor =
  mutation.threshold || mutation.profession
    ? "white"
    : mutation.mixed_effect
    ? "light_magenta"
    : mutation.points > 0
    ? "light_green"
    : mutation.points < 0
    ? "light_red"
    : "yellow";
</script>

<span style={`color: var(--cata-color-${displayColor})`}
  ><slot>({mutation.points ?? 0})</slot></span>
