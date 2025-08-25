<script lang="ts">
import { t } from "@transifex/native";
import { getAllObjectSources } from "./data";

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
</script>

<pre>{JSON.stringify(
    obj,
    (key, value) =>
      ["__mod", "__filename", "__self", "__prevSelf"].includes(key)
        ? undefined
        : value,
    2,
  )}</pre>
{#each getAllObjectSources(obj) as o}
  <details>
    <summary
      >{o.__mod}
      {#if o.__filename}
        <a href={`${urlView}/${o.__filename}`} target="_blank"
          >{t("View", { _context })}</a>
        /
        <a href={`${urlEdit}/${o.__filename}`} target="_blank"
          >{t("Edit on GitHub", { _context })}</a>
      {/if}
    </summary>
    <pre>{JSON.stringify(
        o,
        (key, value) =>
          ["__mod", "__filename", "__self", "__prevSelf"].includes(key)
            ? undefined
            : value,
        2,
      )}</pre>
  </details>
{/each}
