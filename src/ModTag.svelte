<script lang="ts">
import { getAllObjectSources, singular } from "./data";

export let item: any;
export let attachToPageTitle = false;

function attachToTitle(node: HTMLElement, enabled: boolean) {
  if (!enabled) return;

  const container = node.parentElement;
  if (!container) return;

  const attach = () => {
    const title = Array.from(container.children).find(
      (child) => child.tagName === "H1",
    );
    if (title && node.parentElement !== title) title.appendChild(node);
  };

  attach();
  const observer = new MutationObserver(attach);
  observer.observe(container, { childList: true });

  return {
    destroy: () => observer.disconnect(),
  };
}

function modSources(item: any) {
  const mods = new Map<string, string>();
  for (const source of getAllObjectSources(item)) {
    if (source.__mod !== "dda" && !mods.has(source.__mod)) {
      mods.set(source.__mod, source.__modName ?? source.__mod);
    }
  }
  return [...mods].map(([id, name]) => ({
    id,
    name: singular(name),
  }));
}

$: display = modSources(item);
</script>

{#if display.length > 0}
  <span class="mod-tags" use:attachToTitle={attachToPageTitle}>
    {#each display as d}
      <a
        class="mod-tag"
        title={d.name}
        href="{import.meta.env.BASE_URL}mod/{encodeURIComponent(
          d.id,
        )}{location.search}">{d.name}</a>
    {/each}
  </span>
{/if}

<style>
.mod-tags {
  display: inline-flex;
  gap: 0.3em;
  margin-inline-start: 0.4em;
  vertical-align: 0.1em;
}
.mod-tag {
  padding: 0.1em 0.45em;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  color: color-mix(
    in srgb,
    var(--cata-color-gray) 65%,
    var(--cata-color-dark_gray)
  );
  font-size: 0.65em;
  line-height: 1.4;
  white-space: nowrap;
}
.mod-tag:hover {
  text-decoration: none;
}
:global(h1) .mod-tag {
  font-size: 0.35em;
}
</style>
