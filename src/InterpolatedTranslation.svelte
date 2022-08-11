<script lang="ts">
export let str: string;

// Split a string like:
// "1 tool with \x00\x00 of 2 or more."
// into:
// [
//   {text: "1 tool with "},
//   {slot: 0},
//   {text: " of 2 or more"}
// ]
const parts: ({ text: string } | { slot: number })[] = str
  .split("\x00")
  .flatMap((part, i) => {
    if (i === 0) return [{ text: part }];
    else return [{ slot: Number(part[0]) }, { text: part.substring(1) }];
  });
</script>

{#each parts as part}
  {#if "text" in part}{part.text}{:else if part.slot === 0}<slot
      name="0" />{:else if part.slot === 1}<slot
      name="1" />{:else if part.slot === 2}<slot name="2" />{/if}
{/each}
