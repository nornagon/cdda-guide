<script lang="ts">
export let onError: ((error: Error) => void) | null = null;
let ENV = typeof process !== "undefined" && process.env && process.env.NODE_ENV;
let DEV = ENV !== "production";

function normalizeError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

function handleError(error: unknown) {
  onError?.(normalizeError(error));
}
</script>

<svelte:boundary onerror={handleError}>
  <slot />

  {#snippet failed(error)}
    {@const normalizedError = normalizeError(error)}
    <div class="error">
      <b>{normalizedError.message}</b>
      <pre class="trace">
        {DEV ? normalizedError.stack : ""}
      </pre>
    </div>
  {/snippet}
</svelte:boundary>

<style>
.error {
  border: 1px solid red;
}
.trace {
  font-family: monospace;
}
</style>
