<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  str: string;
  contents: Snippet<[string]>;
}

let { str, contents }: Props = $props();

// Split a string like:
// "1 tool with {quality} of 2 or more."
// into:
// [
//   {text: "1 tool with "},
//   {slot: "quality"},
//   {text: " of 2 or more"}
// ]
const parts: ({ text: string } | { slot: string })[] = [];
const re = /\{([^}]+)\}/gms;
let m: RegExpExecArray | null;
let i = 0;
while ((m = re.exec(str))) {
  const before = str.substring(i, m.index);
  if (before.length) parts.push({ text: before });
  parts.push({ slot: m[1] });
  i = m.index + m[0].length;
}
if (i < str.length) parts.push({ text: str.substring(i) });
</script>

{#each parts as part}
  {#if "text" in part}
    {part.text}
  {:else}
    {@render contents(part.slot)}
  {/if}
{/each}
