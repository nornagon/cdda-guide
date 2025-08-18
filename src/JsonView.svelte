<script lang="ts">
import { t } from "@transifex/native";
interface Props {
  obj: any;
  buildNumber: string | undefined;
}

let { obj, buildNumber }: Props = $props();
const _context = "View/Edit on GitHub";

const urlView = `https://github.com/CleverRaven/Cataclysm-DDA/blob/${
  buildNumber ?? "master"
}`;
const urlEdit = `https://github.dev/CleverRaven/Cataclysm-DDA/blob/${
  buildNumber ?? "master"
}`;

function allSources(o: any): any[] {
  const sources: any[] = [];
  sources.push(o.__self);
  while (o.__prevSelf) {
    sources.push(o.__prevSelf);
    o = o.__prevSelf;
  }
  return sources.reverse();
}
</script>

<pre>{JSON.stringify(
    obj,
    (key, value) =>
      ["__mod", "__filename", "__self", "__prevSelf"].includes(key)
        ? undefined
        : value,
    2
  )}</pre>
{#if obj.__prevSelf == null}
  <a href={`${urlView}/${obj.__filename}`} target="_blank"
    >{t("View", { _context })}</a>
  /
  <a href={`${urlEdit}/${obj.__filename}`} target="_blank"
    >{t("Edit on GitHub", { _context })}</a>
{:else}
  {#each allSources(obj) as o}
    <details>
      <summary>{o.__mod}</summary>
      <pre>{JSON.stringify(
          o,
          (key, value) =>
            ["__mod", "__filename", "__self", "__prevSelf"].includes(key)
              ? undefined
              : value,
          2
        )}</pre>
      {#if o.__filename}
        <a href={`${urlView}/${o.__filename}`} target="_blank"
          >{t("View", { _context })}</a>
        /
        <a href={`${urlEdit}/${o.__filename}`} target="_blank"
          >{t("Edit on GitHub", { _context })}</a>
      {/if}
    </details>
  {/each}
{/if}
