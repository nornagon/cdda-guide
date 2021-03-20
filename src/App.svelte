<script lang="ts">
  import { onMount } from "svelte";
	import Thing from "./Thing.svelte";
	import { data } from "./data";
  import SearchResults from "./SearchResults.svelte";

  let item: { type: string, id: string } | null = null

  function hashchange() {
    // the poor man's router!
    const path = window.location.hash.slice(1);

    let m: RegExpExecArray | null;
    if (m = /^\/([^\/]+)\/(.+)$/.exec(path)) {
      const [, type, id] = m
      item = { type, id: decodeURIComponent(id) }

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

  let deferredPrompt: any;
  window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
  });

  function maybeFocusSearch(e: KeyboardEvent) {
    if (e.key === '/' && document.activeElement.id !== 'search') {
      document.getElementById('search').focus()
      e.preventDefault()
    }
  }

</script>
<svelte:window on:hashchange={hashchange} on:keydown={maybeFocusSearch}/>

<header>
  <nav>
    <div class="title">
      <!-- svelte-ignore a11y-invalid-attribute -->
      <strong><a href="#" on:click={() => search = ''}>Hitchhiker's Guide to the Cataclysm</a></strong>
    </div>
    <div class="search">
      <input style="margin: 0; width: 100%" placeholder="Search..." bind:value={search} on:input={clearItem} id="search" />
    </div>
  </nav>
</header>
<main>
{#if item}
{#if $data}
{#key item}
<Thing {item} data={$data} />
{/key}
{:else}
...
{/if}
{:else if search}
<SearchResults search={search} />
{:else}
<img src="dont_panic.png" height="200" width="343" style="float:right" alt="The words 'Don't Panic' in big friendly letters" />
<p>The <strong>Hitchhiker's Guide to the Cataclysm</strong> is a guide to the
zombie survival roguelike game <a href="https://cataclysmdda.org/">Cataclysm:
Dark Days Ahead</a>. You can search for things in the game, like items (e.g. a
<a href="#/item/flashlight">flashlight</a>), furniture (e.g. a <a
href="#/furniture/f_table">table</a>), or monsters (e.g. a <a
href="#/monster/mon_zombie">zombie</a>), and find useful information about
them. The data in the Guide comes directly from the JSON files in the game
itself.</p>
<p>The Guide stores all its data locally and is offline-capable, so you can
take it with you whereever you go.
{#if deferredPrompt}
It's also <button class="disclosure" on:click={(e) => {e.preventDefault(); deferredPrompt.prompt()}}>installable</button>,
so you can pop it out of your browser like a regular app.
{/if}
</p>
<p style="font-style: italic; color: var(--cata-color-gray)">More popular than the Celestial Home Care
Omnibus, better selling than Fifty-three More Things to do in Zero Gravity, and
more controversial than Oolon Colluphid's trilogy of philosophical blockbusters
Where God Went Wrong, Some More of God's Greatest Mistakes and Who is this God
Person Anyway?</p>
<p>The guide is developed on <a
href="https://github.com/nornagon/cdda-guide">GitHub</a> by <a
href="https://www.nornagon.net">nornagon</a>. If you notice any problems,
please <a href="https://github.com/nornagon/cdda-guide/issues">file an
issue</a>!</p>
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
    padding: 0 calc(1em + 8px);
    box-sizing: border-box;
  }

  nav {
    max-width: 980px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
  }

  nav > .search {
    flex: 0.8;
  }

  @media (max-width: 600px) {
    nav > .title {
      display: none;
    }
    nav > .search {
      flex: 1;
    }
  }
</style>
