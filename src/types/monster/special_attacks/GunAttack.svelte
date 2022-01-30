<script lang="ts">
import type { GunAttack } from "../../../types";
import ThingLink from "../../ThingLink.svelte";

export let attack: GunAttack & { cooldown?: number };
</script>

<ThingLink type="item" id={attack.gun_type} /> (cooldown: {attack.cooldown})
