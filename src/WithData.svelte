<script lang="ts">
import { setContext } from "svelte";

interface Props {
  Component: any;
  data: any;
  [key: string]: any;
}

let { Component, data, ...rest }: Props = $props();

setContext("data", data);
</script>

<Component {...rest} />
