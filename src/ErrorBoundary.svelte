<script lang="ts">
export let error: any = null;
export let onError: Function | null = null;
let ENV = typeof process !== "undefined" && process.env && process.env.NODE_ENV;
let DEV = ENV !== "production";
$: if ($error && onError) onError($error);
</script>

{#if $error}
  <div class="error">
    <b>{$error.message}</b>
    <pre class="trace">
      {DEV ? $error.stack : ""}
    </pre>
  </div>
{:else}
  <slot />
{/if}

<style>
.error {
  border: 1px solid red;
}
.trace {
  font-family: monospace;
}
</style>
