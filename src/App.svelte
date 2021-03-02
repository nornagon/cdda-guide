<script lang="ts">
  import { onMount } from "svelte";
	import Object from "./Object.svelte";

  import Search from "./Search.svelte";
  
  let item: { type: string, id: string } | null = null
  
  function hashchange() {
    // the poor man's router!
    const path = window.location.hash.slice(1);

    let m: RegExpExecArray | null;
    if (m = /^\/([^\/]+)\/(.+)$/.exec(path)) {
      const [, type, id] = m
      item = { type, id }

      window.scrollTo(0,0);
    } else {
      item = null
    }
  }

  onMount(hashchange)
</script>
<svelte:window on:hashchange={hashchange}/>

<main>
{#if item}
{#key item}
<Object {item} />
{/key}
{:else}
<Search />
{/if}
</main>

<style>
  main {
    text-align: left;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
