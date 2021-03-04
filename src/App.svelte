<script lang="ts">
  import { onMount } from "svelte";
	import Object from "./Object.svelte";
  import SearchResults from "./SearchResults.svelte";
  
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
  let search: string = ''
  
  const clearItem = () => {
    if (item) history.pushState(null, '', location.href.replace(/#.*$/, ''))
    item = null;
  }
</script>
<svelte:window on:hashchange={hashchange}/>

<header>
  <nav>
    <div>
      <strong>Hitchhiker's Guide to the Cataclysm</strong>
    </div>
    <div style="flex: 0.8">
      <input style="margin: 0; width: 100%" placeholder="Search..." bind:value={search} on:input={clearItem} />
    </div>
  </nav>
</header>
<main>
{#if item}
{#key item}
<Object {item} />
{/key}
{:else if search}
<SearchResults search={search} />
{:else}
DON'T PANIC
{/if}
</main>

<style>
  main {
    text-align: left;
    padding: 1em;
    max-width: 980px;
    margin: 0 auto;
    margin-top: 4rem;
  }
  header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 4rem;
    background: rgba(33, 33, 33, 0.98);
  }
  
  nav {
    max-width: 980px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
  }
</style>
