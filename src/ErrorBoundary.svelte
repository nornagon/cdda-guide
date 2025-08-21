<script lang="ts">
  import { run } from 'svelte/legacy';

import type { Writable } from "svelte/store";

  interface Props {
    error: Writable<Error>;
    onError?: Function | null;
    children?: import('svelte').Snippet;
  }

  let { error, onError = null, children }: Props = $props();
let ENV = typeof process !== "undefined" && process.env && process.env.NODE_ENV;
let DEV = ENV !== "production";
run(() => {
    if ($error && onError) onError($error);
  });
</script>

{#if $error}
  <div class="error">
    <b>{$error.message}</b>
    <pre class="trace">
      {DEV ? $error.stack : ""}
    </pre>
  </div>
{:else}
  {@render children?.()}
{/if}

<style>
.error {
  border: 1px solid red;
}
.trace {
  font-family: monospace;
}
</style>
