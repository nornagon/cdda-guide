<script lang="ts">
import { setContext } from "svelte";

export let Component;
export let data;

setContext("data", data);
</script>

<svelte:component this={Component} {...$$restProps} />
