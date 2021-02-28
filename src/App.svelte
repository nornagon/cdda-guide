<script lang="ts">
  import { onMount } from "svelte";
import Item from "./Item.svelte";

  import Search from "./Search.svelte";
  
  let item: string | null = null
  
  function hashchange() {
    // the poor man's router!
    const path = window.location.hash.slice(1);

    if (path.startsWith('/item')) {
      const id = path.slice(6);
      item = id

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
<Item id={item} />
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
