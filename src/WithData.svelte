<script lang="ts">
import { setContext } from "svelte";

export let Component: any;
export let data: any;

setContext("data", data);
</script>

<svelte:component this={Component} {...$$restProps} />
