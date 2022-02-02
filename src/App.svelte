<script lang="ts">
import { onMount } from "svelte";
import Thing from "./Thing.svelte";
import { data } from "./data";
import { tileData } from "./tile-data";
import SearchResults from "./SearchResults.svelte";
import Catalog from "./Catalog.svelte";

let item: { type: string; id: string } | null = null;

let builds:
  | { build_number: string; prerelease: boolean; created_at: string }[]
  | null = null;

fetch("https://raw.githubusercontent.com/nornagon/cdda-data/main/builds.json")
  .then((d) => d.json())
  .then((b) => {
    builds = b;
  });

const url = new URL(location.href);
const version = url.searchParams.get("v") ?? "latest";
data.setVersion(version);

const tilesets = [
  {
    name: "AltiCa",
    url: "https://raw.githubusercontent.com/CleverRaven/Cataclysm-DDA/{version}/gfx/Altica",
  },
  {
    name: "BrownLikeBears",
    url: "https://raw.githubusercontent.com/CleverRaven/Cataclysm-DDA/{version}/gfx/BrownLikeBears",
  },
  {
    name: "Chibi_Ultica",
    url: "https://raw.githubusercontent.com/CleverRaven/Cataclysm-DDA/{version}/gfx/ChibiUltica",
  },
  {
    name: "Cuteclysm(Alpha)",
    url: "https://raw.githubusercontent.com/CleverRaven/Cataclysm-DDA/{version}/gfx/Cuteclysm",
  },
  {
    name: "Hollow Moon",
    url: "https://raw.githubusercontent.com/CleverRaven/Cataclysm-DDA/{version}/gfx/HollowMoon",
  },
  {
    name: "MSXotto+",
    url: "https://raw.githubusercontent.com/CleverRaven/Cataclysm-DDA/{version}/gfx/MshockXotto%2B",
  },
  {
    name: "NeoDays",
    url: "https://raw.githubusercontent.com/CleverRaven/Cataclysm-DDA/{version}/gfx/NeoDaysTileset",
  },
  {
    name: "RetroDays",
    url: "https://raw.githubusercontent.com/CleverRaven/Cataclysm-DDA/{version}/gfx/RetroDaysTileset",
  },
  {
    name: "UltiCa",
    url: "https://raw.githubusercontent.com/CleverRaven/Cataclysm-DDA/{version}/gfx/UltimateCataclysm",
  },
];

let tilesetUrlTemplate = localStorage.getItem("cdda-guide:tileset");
$: localStorage.setItem("cdda-guide:tileset", tilesetUrlTemplate);
$: tilesetUrl = $data
  ? tilesetUrlTemplate.replace("{version}", $data.build_number)
  : null;
$: tileData.setURL(tilesetUrl);

function hashchange() {
  // the poor man's router!
  const path = window.location.hash.slice(1);

  let m: RegExpExecArray | null;
  if ((m = /^\/([^\/]+)(?:\/(.+))?$/.exec(path))) {
    const [, type, id] = m;
    if (type === "search") {
      item = null;
      search = decodeURIComponent(id ?? "");
    } else {
      if (id) item = { type, id: decodeURIComponent(id) };
      else item = { type, id: "" };
    }

    window.scrollTo(0, 0);
  } else {
    item = null;
    search = "";
  }
}

onMount(hashchange);
let search: string = "";

function urlWithHash(newHash: string) {
  const url = new URL(location.href);
  url.hash = newHash;
  return url.toString();
}

const clearItem = () => {
  if (item) history.pushState(null, "", location.href.replace(/#.*$/, ""));
  else history.replaceState(null, "", urlWithHash("/search/" + search));
  item = null;
};

let deferredPrompt: any;
window.addEventListener("beforeinstallprompt", (e) => {
  deferredPrompt = e;
});

function maybeFocusSearch(e: KeyboardEvent) {
  if (e.key === "/" && document.activeElement.id !== "search") {
    document.getElementById("search").focus();
    e.preventDefault();
  }
}
</script>

<svelte:window on:hashchange={hashchange} on:keydown={maybeFocusSearch} />

<header>
  <nav>
    <div class="title">
      <!-- svelte-ignore a11y-invalid-attribute -->
      <strong>
        <a href="#" on:click={() => (search = "")}
          >Hitchhiker's Guide to the Cataclysm</a>
      </strong>
    </div>
    <div class="search">
      <input
        style="margin: 0; width: 100%"
        placeholder="Search..."
        bind:value={search}
        on:input={clearItem}
        id="search" />
    </div>
  </nav>
</header>
<main>
  {#if item}
    {#if $data}
      {#key item}
        {#if item.id}
          <Thing {item} data={$data} />
        {:else}
          <Catalog type={item.type} data={$data} />
        {/if}
      {/key}
    {:else}
      <em style="color: var(--cata-color-gray)">Loading...</em>
    {/if}
  {:else if search}
    {#key search}
      <SearchResults data={$data} {search} />
    {/key}
  {:else}
    <img
      src="dont_panic.png"
      height="200"
      width="343"
      style="float:right"
      alt="The words 'Don't Panic' in big friendly letters" />
    <p>
      The <strong>Hitchhiker's Guide to the Cataclysm</strong> is a guide to the
      zombie survival roguelike game
      <a href="https://cataclysmdda.org/">Cataclysm: Dark Days Ahead</a>. You
      can search for things in the game, like items (e.g. a
      <a href="#/item/flashlight">flashlight</a>), furniture (e.g. a
      <a href="#/furniture/f_table">table</a>), or monsters (e.g. a
      <a href="#/monster/mon_zombie">zombie</a>), and find useful information
      about them. The data in the Guide comes directly from the JSON files in
      the game itself.
    </p>
    <p>
      The Guide stores all its data locally and is offline-capable, so you can
      take it with you whereever you go. There's nothing to do to make the Guide
      work offline, just visit the page and it will work even without internet
      access, as long as you've visited it once before.
      {#if deferredPrompt}
        It's also <button
          class="disclosure"
          on:click={(e) => {
            e.preventDefault();
            deferredPrompt.prompt();
          }}>installable</button
        >, so you can pop it out of your browser and use it like a regular app.
      {/if}
    </p>
    <p style="font-style: italic; color: var(--cata-color-gray)">
      More popular than the Celestial Home Care Omnibus, better selling than
      Fifty-three More Things to do in Zero Gravity, and more controversial than
      Oolon Colluphid's trilogy of philosophical blockbusters Where God Went
      Wrong, Some More of God's Greatest Mistakes and Who is this God Person
      Anyway?
    </p>
    <p>
      The guide is developed on <a href="https://github.com/nornagon/cdda-guide"
        >GitHub</a>
      by <a href="https://www.nornagon.net">nornagon</a>. If you notice any
      problems, please
      <a href="https://github.com/nornagon/cdda-guide/issues">file an issue</a>!
    </p>

    <h2>Catalogs</h2>
    <ul>
      <li><a href="#/item">Items</a></li>
      <li><a href="#/monster">Monsters</a></li>
      <li><a href="#/furniture">Furniture</a></li>
      <li><a href="#/vehicle_part">Vehicle Parts</a></li>
      <li><a href="#/tool_quality">Qualities</a></li>
      <li><a href="#/mutation">Mutations</a></li>
      <li><a href="#/json_flag">Flags</a></li>
      <li>
        <a href="#/achievement">Achievements</a> /
        <a href="#/conduct">Conducts</a>
      </li>
    </ul>
  {/if}

  <p>
    Build:
    {#if $data || builds}
      {#if builds}
        <!-- svelte-ignore a11y-no-onchange -->
        <select
          value={$data?.build_number ??
            (version === "latest" ? builds[0].build_number : version)}
          on:change={(e) => {
            const url = new URL(location.href);
            const buildNumber = e.currentTarget.value;
            if (buildNumber === builds[0].build_number)
              url.searchParams.delete("v");
            else url.searchParams.set("v", buildNumber);
            location.href = url.toString();
          }}>
          <optgroup label="Stable">
            {#each builds.filter((b) => !b.prerelease) as build}
              <option value={build.build_number}>{build.build_number}</option>
            {/each}
          </optgroup>
          <optgroup label="Experimental">
            {#each builds.filter((b) => b.prerelease) as build, i}
              <option value={build.build_number}
                >{build.build_number}{#if i === 0}&nbsp;(latest){/if}</option>
            {/each}
          </optgroup>
        </select>
      {:else if $data}
        <select disabled>
          <option>{$data.build_number}</option>
        </select>
      {/if}
    {:else}
      <em style="color: var(--cata-color-gray)">(loading...)</em>
    {/if}
    Tiles:
    <!-- svelte-ignore a11y-no-onchange -->
    <select
      value={tilesetUrlTemplate}
      on:change={(e) => {
        tilesetUrlTemplate = e.currentTarget.value;
      }}>
      <option value="">None (ASCII)</option>
      {#each tilesets as { name, url }}
        <option value={url}>{name}</option>
      {/each}
    </select>
  </p>
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
  z-index: 100;
  box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.5);
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
