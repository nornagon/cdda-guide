<script lang="ts">
import type { AsciiArt } from "../types";

export let picture: AsciiArt

let color = ['white']
const parsed = []
for (const line of picture.picture) {
  const spans: {string: string, color: string}[] = []
  let remaining = line
  while (true) {
    const nextColorTag = remaining.match(/<\/?color([^>]*?)>/)
    if (nextColorTag) {
      if (nextColorTag.index > 0)
        spans.push({string: remaining.substr(0, nextColorTag.index), color: color[0]})
      if (nextColorTag[0][1] === '/' && color.length > 1) {
        color.shift()
      } else {
        color.unshift(nextColorTag[1].substr(1))
      }
      remaining = remaining.substr(nextColorTag.index + nextColorTag[0].length)
    } else break
  }
  if (remaining.length) {
    spans.push({string: remaining, color: color[0]})
  }
  const remainingWidth = 41 - spans.reduce((m, s) => m + s.string.length, 0)
  if (remainingWidth > 0) {
    spans.push({string: ' '.repeat(remainingWidth), color: color[0]})
  }
  parsed.push(spans)
}
</script>

<pre style="font-family: Unifont, monospace; line-height: 1">
{#each parsed as line}{#each line as span}<span class="c_{span.color}">{span.string}</span>{/each}{'\n'}{/each}
</pre>
