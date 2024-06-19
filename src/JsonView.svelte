<script lang="ts">
import { t } from "@transifex/native";
export let obj: any;
export let buildNumber: string | undefined;
const _context = "View/Edit on GitHub";
</script>

<pre>{JSON.stringify(
    obj,
    (key, value) => (key === "__filename" ? undefined : value),
    2
  )}</pre>
{#if obj.__filename}
  <a
    href={`https://github.com/CleverRaven/Cataclysm-DDA/blob/${
      buildNumber ?? "master"
    }/${obj.__filename}`}
    target="_blank">{t("View", { _context })}</a>
  /
  <a
    href={`https://github.dev/CleverRaven/Cataclysm-DDA/blob/${
      buildNumber ?? "master"
    }/${obj.__filename}`}
    target="_blank">{t("Edit on GitHub", { _context })}</a>
{/if}
