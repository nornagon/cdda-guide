<script lang="ts">
import { onMount } from "svelte";
import Thing from "./Thing.svelte";
import { data, loadProgress } from "./data";
import { tileData } from "./tile-data";
import SearchResults from "./SearchResults.svelte";
import Catalog from "./Catalog.svelte";
import dontPanic from "./assets/dont_panic.png";
import throttle from "lodash.throttle";
import InterpolatedTranslation from "./InterpolatedTranslation.svelte";
import { t } from "@transifex/native";

let item: { type: string; id: string } | null = null;

let builds:
  | {
      build_number: string;
      prerelease: boolean;
      created_at: string;
      langs?: string[];
    }[]
  | null = null;

fetch("https://raw.githubusercontent.com/nornagon/cdda-data/main/builds.json")
  .then((d) => d.json())
  .then((b) => {
    builds = b;
  })
  .catch((e) => {
    console.error(e);
  });

const url = new URL(location.href);
const version = url.searchParams.get("v") ?? "latest";
const locale = url.searchParams.get("lang");
data.setVersion(version, locale);

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

const normalizeTemplate = (t: string) => (t === "null" || !t ? "" : t);
function loadTileset() {
  try {
    return normalizeTemplate(localStorage.getItem("cdda-guide:tileset"));
  } catch (e) {
    return null;
  }
}
function saveTileset(url: string) {
  try {
    localStorage.setItem("cdda-guide:tileset", normalizeTemplate(url));
  } catch (e) {
    /* swallow security errors, which can happen when in incognito mode */
  }
}
let tilesetUrlTemplate = loadTileset();
$: saveTileset(tilesetUrlTemplate);
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
      item = { type, id: id ? decodeURIComponent(id) : "" };
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

// Throttle replaceState to avoid browser warnings.
const replaceState = throttle(history.replaceState.bind(history), 100);

const clearItem = () => {
  if (item) history.pushState(null, "", location.href.replace(/#.*$/, ""));
  else replaceState(null, "", urlWithHash("/search/" + search));
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

function getLanguageName(code: string) {
  // from src/options.cpp
  return (
    {
      en: "English",
      ar: "العربية",
      cs: "Český Jazyk",
      da: "Dansk",
      de: "Deutsch",
      el: "Ελληνικά",
      es_AR: "Español (Argentina)",
      es_ES: "Español (España)",
      fr: "Français",
      hu: "Magyar",
      id: "Bahasa Indonesia",
      is: "Íslenska",
      it_IT: "Italiano",
      ja: "日本語",
      ko: "한국어",
      nb: "Norsk",
      nl: "Nederlands",
      pl: "Polski",
      pt_BR: "Português (Brasil)",
      ru: "Русский",
      sr: "Српски",
      tr: "Türkçe",
      uk_UA: "український",
      zh_CN: "中文 (天朝)",
      zh_TW: "中文 (台灣)",
    }[code] ??
    (Intl?.DisplayNames
      ? new Intl.DisplayNames([code.replace(/_/, "-")], {
          type: "language",
        }).of(code.replace(/_/, "-"))
      : code)
  );
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
        placeholder={t("Search...", {
          _comment: "Placeholder text in the search box",
        })}
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
      <span style="color: var(--cata-color-gray)">
        <em>{t("Loading...")}</em>
        {#if $loadProgress}
          ({($loadProgress[0] / 1024 / 1024).toFixed(1)}/{(
            $loadProgress[1] /
            1024 /
            1024
          ).toFixed(1)} MB)
        {/if}
      </span>
    {/if}
  {:else if search}
    {#key search}
      <SearchResults data={$data} {search} />
    {/key}
  {:else}
    <img
      src={dontPanic}
      height="200"
      width="343"
      style="float:right"
      alt="The words 'Don't Panic' in big friendly letters" />
    <p>
      <InterpolatedTranslation
        str={t(
          `The {hhg} is a guide to the zombie survival roguelike game {link_cdda}. You can
search for things in the game, like items (e.g. a {link_flashlight}), furniture
(e.g. a {link_table}), or monsters (e.g. a {link_zombie}), and find useful
information about them. The data in the Guide comes directly from the JSON
files in the game itself.`,
          {
            hhg: "{hhg}",
            link_cdda: "{link_cdda}",
            link_flashlight: "{link_flashlight}",
            link_table: "{link_table}",
            link_zombie: "{link_zombie}",
          }
        )}
        slot0="hhg"
        slot1="link_cdda"
        slot2="link_flashlight"
        slot3="link_table"
        slot4="link_zombie">
        <strong slot="0">Hitchhiker's Guide to the Cataclysm</strong>
        <a slot="1" href="https://cataclysmdda.org/"
          >Cataclysm: Dark Days Ahead</a>
        <a slot="2" href="#/item/flashlight"
          >{t("flashlight", { _comment: "Item name" })}</a>
        <a slot="3" href="#/furniture/f_table"
          >{t("table", { _comment: "Furniture" })}</a>
        <a slot="4" href="#/monster/mon_zombie"
          >{t("zombie", { _comment: "Monster name" })}</a>
      </InterpolatedTranslation>
    </p>
    <p>
      {t(`The Guide stores all its data locally and is offline-capable, so you can
take it with you whereever you go. There's nothing to do to make the Guide
work offline, just visit the page and it will work even without internet
access, as long as you've visited it once before.`)}
      {#if deferredPrompt}
        <InterpolatedTranslation
          str={t(
            `It's also {installable_button}, so you can pop it out of your browser and use it like a regular app.`,
            { installable_button: "{installable_button}" }
          )}
          slot0="installable_button">
          <button
            slot="0"
            class="disclosure"
            on:click={(e) => {
              e.preventDefault();
              deferredPrompt.prompt();
            }}
            >{t("installable", {
              _context: "Front page",
              _comment: "Meaning, install the Hitchhiker's Guide app itself.",
            })}</button>
        </InterpolatedTranslation>
      {/if}
    </p>
    <p style="font-style: italic; color: var(--cata-color-gray)">
      {t(
        `More popular than the Celestial Home Care Omnibus, better selling than
Fifty-three More Things to do in Zero Gravity, and more controversial than
Oolon Colluphid's trilogy of philosophical blockbusters Where God Went
Wrong, Some More of God's Greatest Mistakes and Who is this God Person
Anyway?`,
        {
          _comment:
            "This is a quote from the Hitchhiker's Guide to the Galaxy, by Douglas Adams",
        }
      )}
    </p>
    <p>
      <InterpolatedTranslation
        str={t(
          `The Guide is developed on {link_github} by {link_nornagon}. If you notice any problems, please {link_file_an_issue}!`,
          {
            link_github: "{link_github}",
            link_nornagon: "{link_nornagon}",
            link_file_an_issue: "{link_file_an_issue}",
          }
        )}
        slot0="link_github"
        slot1="link_nornagon"
        slot2="link_file_an_issue">
        <a slot="0" href="https://github.com/nornagon/cdda-guide">GitHub</a>
        <a slot="1" href="https://www.nornagon.net">nornagon</a>
        <a slot="2" href="https://github.com/nornagon/cdda-guide/issues"
          >{t("file an issue")}</a>
      </InterpolatedTranslation>
    </p>

    {#if locale}
      <p style="font-weight: bold">
        <InterpolatedTranslation
          str={t(
            `You can help translate the Guide into your language on {link_transifex}.`,
            { link_transifex: "{link_transifex}" }
          )}
          slot0="link_transifex">
          <a
            slot="0"
            href="https://www.transifex.com/nornagon/the-hitchhikers-guide-to-the-cataclysm/"
            >Transifex</a>
        </InterpolatedTranslation>
      </p>
    {/if}

    <h2>{t("Catalogs")}</h2>
    <ul>
      <li><a href="#/item">{t("Items")}</a></li>
      <li><a href="#/monster">{t("Monsters")}</a></li>
      <li><a href="#/furniture">{t("Furniture")}</a></li>
      <li><a href="#/terrain">{t("Terrain")}</a></li>
      <li><a href="#/vehicle_part">{t("Vehicle Parts")}</a></li>
      <li><a href="#/tool_quality">{t("Qualities")}</a></li>
      <li><a href="#/mutation">{t("Mutations")}</a></li>
      <li><a href="#/martial_art">{t("Martial Arts")}</a></li>
      <li><a href="#/json_flag">{t("Flags")}</a></li>
      <li>
        <a href="#/achievement">{t("Achievements")}</a> /
        <a href="#/conduct">{t("Conducts")}</a>
      </li>
    </ul>
  {/if}

  <p>
    {t("Version:")}
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
      <em style="color: var(--cata-color-gray)">({t("Loading...")})</em>
    {/if}
    <span style="white-space: nowrap">
      {t("Tileset:")}
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
    </span>
    <span style="white-space: nowrap">
      {t("Language:")}
      {#if builds}
        {@const build_number =
          version === "latest" ? builds[0].build_number : version}
        <select
          value={locale ?? "en"}
          on:change={(e) => {
            const url = new URL(location.href);
            const lang = e.currentTarget.value;
            if (lang === "en") url.searchParams.delete("lang");
            else url.searchParams.set("lang", lang);
            location.href = url.toString();
          }}>
          <option value="en">English</option>
          {#each [...(builds.find((b) => b.build_number === build_number)?.langs ?? [])].sort( (a, b) => a.localeCompare(b) ) as lang}
            <option value={lang}>{getLanguageName(lang)}</option>
          {/each}
        </select>
      {:else}
        <select disabled><option>{t("Loading...")}</option></select>
      {/if}
    </span>
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
