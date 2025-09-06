<script lang="ts">
import Thing from "./Thing.svelte";
import { CddaData, data, loadProgress, mapType, singularName } from "./data";
import { tileData } from "./tile-data";
import SearchResults from "./SearchResults.svelte";
import Catalog from "./Catalog.svelte";
import dontPanic from "./assets/dont_panic.png";
import InterpolatedTranslation from "./InterpolatedTranslation.svelte";
import { t } from "@transifex/native";
import type { SupportedTypeMapped, SupportedTypesWithMapped } from "./types";
import throttle from "lodash/throttle";
import ModCatalog from "./ModCatalog.svelte";

let item: { type: string; id: string } | null = null;

let builds:
  | {
      build_number: string;
      prerelease: boolean;
      created_at: string;
      langs?: string[];
    }[]
  | null = null;

fetch(`${process.env.CDDA_DATA_SOURCE}/builds.json`)
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

let enabledMods: string[] = url.searchParams.get("m")?.split(",") ?? [];

data.setVersion(version, locale, enabledMods);

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
function loadTileset(): string {
  try {
    const templ = localStorage.getItem("cdda-guide:tileset");
    if (!templ) return "";
    return normalizeTemplate(templ);
  } catch (e) {
    return "";
  }
}
function saveTileset(url: string) {
  try {
    if (!url) localStorage.removeItem("cdda-guide:tileset");
    else localStorage.setItem("cdda-guide:tileset", normalizeTemplate(url));
  } catch (e) {
    /* swallow security errors, which can happen when in incognito mode */
  }
}
let tilesetUrlTemplate = loadTileset();
$: saveTileset(tilesetUrlTemplate);
$: tilesetUrl = $data
  ? tilesetUrlTemplate?.replace("{version}", $data.build_number!) ?? null
  : null;
$: tileData.setURL(tilesetUrl);

function decodeQueryParam(p: string) {
  return decodeURIComponent(p.replace(/\+/g, " "));
}

function setModEnabled(mod: string, enabled: boolean) {
  if (enabled) {
    if (!enabledMods.includes(mod)) {
      enabledMods = [...enabledMods, mod];
    }
  } else {
    if (enabledMods.includes(mod)) {
      enabledMods = enabledMods.filter((m) => m !== mod);
    }
  }
}

function load(noScroll: boolean = false) {
  const path = location.pathname.slice(import.meta.env.BASE_URL.length - 1);
  let m: RegExpExecArray | null;
  if ((m = /^\/([^\/]+)(?:\/(.+))?$/.exec(path))) {
    const [, type, id] = m;
    if (type === "search") {
      item = null;
      search = decodeQueryParam(id ?? "");
    } else {
      item = { type, id: id ? decodeURIComponent(id) : "" };
    }

    if (!noScroll) window.scrollTo(0, 0);
  } else {
    item = null;
    search = "";
  }
}

$: if (item && item.id && $data && $data.byIdMaybe(item.type as any, item.id)) {
  const it = $data.byId(item.type as any, item.id);
  document.title = `${singularName(
    it
  )} - The Hitchhiker's Guide to the Cataclysm`;
} else if (item && !item.id && item.type) {
  document.title = `${item.type} - The Hitchhiker's Guide to the Cataclysm`;
} else {
  document.title = "The Hitchhiker's Guide to the Cataclysm";
}

$: {
  const modIds = enabledMods;
  const url = new URL(location.href);
  if (modIds.length > 0) {
    url.searchParams.set("m", modIds.join(","));
  } else {
    url.searchParams.delete("m");
  }
  if (
    $data &&
    $data.availableMods.length > 0 &&
    !$data.modsFetched &&
    modIds.length > 0
  ) {
    console.log("reloading data for mods", modIds);
    location.href = url.toString();
  } else {
    console.log("setting mods to", modIds);
    replaceState(null, "", url.toString());
    $data?.setEnabledMods(modIds);
    load(true);
  }
}

let search: string = "";

load();

// Throttle replaceState to avoid browser warnings.
// |throttle| isn't defined when running tests for some reason.
const replaceState = throttle
  ? throttle(history.replaceState.bind(history), 100, {
      trailing: true,
    })
  : history.replaceState.bind(history);

const clearItem = () => {
  if (item)
    history.pushState(
      null,
      "",
      import.meta.env.BASE_URL +
        (search ? "search/" + encodeURIComponent(search) : "") +
        location.search
    );
  else
    replaceState(
      null,
      "",
      import.meta.env.BASE_URL +
        (search ? "search/" + encodeURIComponent(search) : "") +
        location.search
    );
  item = null;
};

function maybeNavigate(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const anchor = target?.closest("a") as HTMLAnchorElement | null;
  if (anchor && anchor.href) {
    const { origin, pathname, search } = new URL(anchor.href);
    if (
      origin === location.origin &&
      pathname.startsWith(import.meta.env.BASE_URL)
    ) {
      event.preventDefault();
      const newSearchParams = new URLSearchParams(search);
      const searchParams = new URLSearchParams(location.search);
      const mod = newSearchParams.get("mod");
      if (
        mod &&
        /^\/([^\/]+)$/.test(pathname.slice(import.meta.env.BASE_URL.length - 1))
      ) {
        // Navigating to a catalog, allow the "&mod=" query param to persist.
        searchParams.set("mod", mod);
      } else {
        // Navigating to an item or something else, drop the "&mod=" query param.
        searchParams.delete("mod");
      }
      const newSearch = searchParams.toString();
      history.pushState(
        null,
        "",
        pathname + (newSearch ? "?" + newSearch : "")
      );
      load();
    }
  }
}

window.addEventListener("popstate", () => {
  load();
});

let deferredPrompt: any;
window.addEventListener("beforeinstallprompt", (e) => {
  deferredPrompt = e;
});

function maybeFocusSearch(e: KeyboardEvent) {
  if (e.key === "/" && document.activeElement?.id !== "search") {
    document.getElementById("search")?.focus();
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

const randomableItemTypes = new Set<keyof SupportedTypesWithMapped>([
  "item",
  "monster",
  "furniture",
  "terrain",
  "vehicle_part",
  "tool_quality",
  "mutation",
  "martial_art",
  "json_flag",
  "achievement",
  "conduct",
  "proficiency",
]);
async function getRandomPage() {
  const d = await new Promise<CddaData>((resolve) => {
    const unsubscribe = data.subscribe((v) => {
      if (v) {
        resolve(v);
        setTimeout(() => unsubscribe());
      }
    });
  });
  const items = d
    .all()
    .filter(
      (x) => "id" in x && randomableItemTypes.has(mapType(x.type))
    ) as (SupportedTypeMapped & { id: string })[];
  return items[(Math.random() * items.length) | 0];
}

let randomPage: string | null = null;
function newRandomPage() {
  getRandomPage().then((r) => {
    randomPage = `${import.meta.env.BASE_URL}${mapType(r.type)}/${r.id}${
      location.search
    }`;
  });
}
newRandomPage();

// This is one character behind the actual search value, because
// of the throttle, but eh, it's good enough.
let currentHref = location.href;
$: item, search, (currentHref = location.href);

function langHref(lang: string, href: string) {
  const u = new URL(href);
  u.searchParams.set("lang", lang);
  return u.toString();
}
</script>

<svelte:window on:click={maybeNavigate} on:keydown={maybeFocusSearch} />

<svelte:head>
  {#if builds}
    {@const build_number =
      version === "latest" ? builds[0].build_number : version}
    {#each [...(builds.find((b) => b.build_number === build_number)?.langs ?? [])].sort( (a, b) => a.localeCompare(b) ) as lang}
      <link
        rel="alternate"
        hreflang={lang}
        href={langHref(lang, currentHref)} />
    {/each}
  {/if}
</svelte:head>

<header>
  <nav>
    <div class="title">
      <!-- svelte-ignore a11y-invalid-attribute -->
      <strong>
        <a
          href={import.meta.env.BASE_URL + location.search}
          on:click={() => (search = "")}
          ><span class="wide">Hitchhiker's Guide to the Cataclysm</span><span
            class="narrow">HHG</span
          ></a>
      </strong>
    </div>
    <div class="search">
      <input
        style="margin: 0; width: 100%"
        placeholder={t("Search...", {
          _comment: "Placeholder text in the search box",
        })}
        type="search"
        bind:value={search}
        on:input={clearItem}
        id="search" />
    </div>
  </nav>
</header>
<main>
  {#if item}
    {#if $data}
      {#if item.type === "mods"}
        <ModCatalog data={$data} {enabledMods} {setModEnabled} />
      {:else if item.id}
        {#key [item, enabledMods]}
          <Thing {item} data={$data} />
        {/key}
      {:else}
        {#key [item.type, enabledMods]}
          <Catalog type={item.type} data={$data} />
        {/key}
      {/if}
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
    {#if $data}
      {#key [search, enabledMods]}
        <SearchResults data={$data} {search} />
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
        <a
          slot="2"
          href="{import.meta.env.BASE_URL}item/flashlight{location.search}"
          >{t("flashlight", { _comment: "Item name" })}</a>
        <a
          slot="3"
          href="{import.meta.env.BASE_URL}furniture/f_table{location.search}"
          >{t("table", { _comment: "Furniture" })}</a>
        <a
          slot="4"
          href="{import.meta.env.BASE_URL}monster/mon_zombie{location.search}"
          >{t("zombie", { _comment: "Monster name" })}</a>
      </InterpolatedTranslation>
    </p>
    <p>
      {t(`The Guide stores all its data locally and is offline-capable, so you can
take it with you wherever you go. There's nothing to do to make the Guide
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
      <li><a href="/item{location.search}">{t("Items")}</a></li>
      <li><a href="/monster{location.search}">{t("Monsters")}</a></li>
      <li><a href="/furniture{location.search}">{t("Furniture")}</a></li>
      <li><a href="/terrain{location.search}">{t("Terrain")}</a></li>
      <li><a href="/vehicle_part{location.search}">{t("Vehicle Parts")}</a></li>
      <li><a href="/tool_quality{location.search}">{t("Qualities")}</a></li>
      <li><a href="/mutation{location.search}">{t("Mutations")}</a></li>
      <li><a href="/martial_art{location.search}">{t("Martial Arts")}</a></li>
      <li><a href="/json_flag{location.search}">{t("Flags")}</a></li>
      <li>
        <a href="/achievement{location.search}">{t("Achievements")}</a> /
        <a href="/conduct{location.search}">{t("Conducts")}</a>
      </li>
      <li><a href="/proficiency{location.search}">{t("Proficiencies")}</a></li>
      {#if $data && $data.activeMods.length > 1}
        <li><a href="/mod{location.search}">{t("Mods")}</a></li>
      {/if}
    </ul>

    <InterpolatedTranslation
      str={t(`Or visit a {link_random_page}.`, {
        link_random_page: "{link_random_page}",
      })}
      slot0="link_random_page">
      <a slot="0" href={randomPage} on:click={() => setTimeout(newRandomPage)}
        >{t("random page")}</a>
    </InterpolatedTranslation>
  {/if}

  <p class="data-options">
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
            if (buildNumber === builds?.[0].build_number)
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
          value={locale || "en"}
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
  <p class="data-options" style="display: flex; align-items: center;">
    <a href="{import.meta.env.BASE_URL}mods{location.search}">{t("Mods")}</a>:
    <span style="margin-left: 0.5em">
      {#if $data && $data.availableMods.length === 0}
        <em style="color: var(--cata-color-gray)"
          >{t("Mods data not processed for this version.")}</em>
      {:else if $data}
        {#key enabledMods}
          {#each $data.activeMods.filter((m) => m !== "dda") as mod, i}
            {#if i > 0}, {/if}{$data.availableMods.find((am) => am.id === mod)
              ?.label ?? mod}
          {/each}
        {/key}
      {:else}
        <em style="color: var(--cata-color-gray)">{t("Loading...")}</em>
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
  flex: 1;
  max-width: calc(0.5 * 980px);
}

nav > .title .narrow {
  display: none;
}

nav > .title {
  margin-right: 1em;
}

@media (max-width: 600px) {
  nav > .title .wide {
    display: none;
  }
  nav > .title .narrow {
    display: inline;
  }

  nav > .search {
    flex: 1;
  }
}

.data-options select {
  max-width: 100%;
}
</style>
