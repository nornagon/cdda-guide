<script lang="ts">
export let str: string;

export let slot0: string | null = null;
export let slot1: string | null = null;
export let slot2: string | null = null;
export let slot3: string | null = null;
export let slot4: string | null = null;
export let slot5: string | null = null;
export let slot6: string | null = null;
export let slot7: string | null = null;

const slotNameToNumber = new Map();
if (slot0) slotNameToNumber.set(slot0, 0);
if (slot1) slotNameToNumber.set(slot1, 1);
if (slot2) slotNameToNumber.set(slot2, 2);
if (slot3) slotNameToNumber.set(slot3, 3);
if (slot4) slotNameToNumber.set(slot4, 4);
if (slot5) slotNameToNumber.set(slot5, 5);
if (slot6) slotNameToNumber.set(slot6, 6);
if (slot7) slotNameToNumber.set(slot7, 7);

// Split a string like:
// "1 tool with {quality} of 2 or more."
// into:
// [
//   {text: "1 tool with "},
//   {slot: "quality"},
//   {text: " of 2 or more"}
// ]
const parts: ({ text: string } | { slot: number })[] = [];
const re = /\{([^}]+)\}/gms;
let m: RegExpExecArray | null;
let i = 0;
while ((m = re.exec(str))) {
  const before = str.substring(i, m.index);
  if (before.length) parts.push({ text: before });
  parts.push({ slot: slotNameToNumber.get(m[1]) });
  i = m.index + m[0].length;
}
if (i < str.length) parts.push({ text: str.substring(i) });
</script>

{#each parts as part}
  {#if "text" in part}{part.text}{:else if part.slot === 0}<slot
      name="s0" />{:else if part.slot === 1}<slot
      name="s1" />{:else if part.slot === 2}<slot
      name="s2" />{:else if part.slot === 3}<slot
      name="s3" />{:else if part.slot === 4}<slot
      name="s4" />{:else if part.slot === 5}<slot
      name="s5" />{:else if part.slot === 6}<slot
      name="s6" />{:else if part.slot === 7}<slot name="7" />{/if}
{/each}
