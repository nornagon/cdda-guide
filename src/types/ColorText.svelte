<script lang="ts">
  interface Props {
    text: string;
    fgOnly?: boolean;
  }

  let { text, fgOnly = false }: Props = $props();

function parseColorText(text: string): { string: string; color: string }[] {
  let color = ["gray"];
  const spans: { string: string; color: string }[] = [];
  let remaining = text;
  while (true) {
    const nextColorTag = remaining.match(
      /<\/?(info|good|bad|neutral|color|color_[^>]+)>/
    );
    if (nextColorTag && nextColorTag.index != null) {
      if (nextColorTag.index > 0)
        spans.push({
          string: remaining.substring(0, nextColorTag.index),
          color: color[0],
        });
      if (nextColorTag[0][1] === "/" && color.length > 1) {
        color.shift();
      } else {
        color.unshift(nextColorTag[1]);
      }
      remaining = remaining.substring(
        nextColorTag.index + nextColorTag[0].length
      );
    } else break;
  }
  if (remaining.length) {
    spans.push({ string: remaining, color: color[0] });
  }

  return spans;
}

const spans = parseColorText(text ?? "");

const colors: Record<string, string> = {
  info: "cyan",
  good: "green",
  bad: "red",
  neutral: "yellow",
};

const colorLookup = (color: string): string => {
  if (color in colors) return colors[color];
  const m = /^color_(.+)$/.exec(color);
  if (m) return m[1];
  return "gray";
};
</script>

{#each spans as { color, string }}<span
    style="color: var(--cata-color-{colorLookup(color)})"
    class={fgOnly ? "fg_only" : ""}>{string}</span
  >{/each}
