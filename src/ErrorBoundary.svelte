<script>
  export let error = null;
  export let onError = null;
  let ENV =
    typeof process !== 'undefined' && process.env && process.env.NODE_ENV;
  let DEV = ENV !== 'production';
  $: if ($error && onError) onError($error);
</script>
<style>
  .error {
    border: 1px solid red;
  }
  .trace {
    font-family: monospace;
  }
</style>

{#if $error}
  <div class="error">
    <b>{$error.message}</b>
    <pre class="trace">
      {DEV ? $error.stack : ''}
    </pre>
  </div>
{:else}
  <slot />
{/if}
