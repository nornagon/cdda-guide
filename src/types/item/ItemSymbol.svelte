<script lang="ts">
import { tileData } from "../../tile-data";
import { colorForName } from "../../colors";
export let item: {
  id: string;
  looks_like?: string;
  color?: string | string[];
  bgcolor?: string | [string] | [string, string, string, string];
  symbol?: string | string[];
};

$: tile_info = $tileData?.tile_info[0];
$: tile =
  findTile($tileData, item.id) ??
  findTile($tileData, item.looks_like) ??
  fallbackTile($tileData, item.symbol, item.color);
$: baseUrl = $tileData?.baseUrl;

const sym = [item.symbol].flat()[0] ?? " ";
const symbol = /^LINE_/.test(sym) ? "|" : sym;
const color = item.color
  ? typeof item.color === "string"
    ? item.color
    : item.color[0]
  : item.bgcolor
  ? colorFromBgcolor(item.bgcolor)
  : null;

function colorFromBgcolor(
  color: string | [string] | [string, string, string, string]
) {
  return typeof color === "string" ? `i_${color}` : colorFromBgcolor(color[0]);
}

function findTile(tileData: any, id: string) {
  if (!tileData) return;
  let offset = 0;
  for (const chunk of tileData["tiles-new"]) {
    for (const info of chunk.tiles) {
      if ((Array.isArray(info.id) && info.id.includes(id)) || info.id === id) {
        const fg = Array.isArray(info.fg) ? info.fg[0]?.sprite : info.fg;
        const bg = Array.isArray(info.bg) ? info.bg[0]?.sprite : info.bg;
        return {
          file: chunk.file,
          fg: fg - offset,
          bg: bg != null ? bg - offset : null,
          nx: chunk.nx,
          ny: chunk.ny,
          sprite_width: chunk.sprite_width ?? tileData.tile_info[0].width,
          sprite_height: chunk.sprite_height ?? tileData.tile_info[0].height,
          sprite_offset_x: chunk.sprite_offset_x ?? 0,
          sprite_offset_y: chunk.sprite_offset_y ?? 0,
        };
      }
    }
    offset += chunk.nx * chunk.ny;
  }
}

function fallbackTile(
  tileData: any,
  symbolMaybeArr: string | string[],
  color: string | string[]
) {
  if (!tileData) return;
  const symbol = [symbolMaybeArr].flat()[0];
  const sym = !symbol ? " " : /^LINE_/.test(symbol) ? "|" : symbol;
  const c = colorForName(Array.isArray(color) ? color[0] : color).fg;
  for (const chunk of tileData["tiles-new"]) {
    for (const entry of chunk.ascii ?? []) {
      const fg = parseEntryColor(entry.color) + (entry.bold ? 8 : 0);
      if (fg === c) {
        return {
          file: chunk.file,
          fg: entry.offset + sym.charCodeAt(0),
          bg: null,
          nx: chunk.nx,
          ny: chunk.ny,
          sprite_width: tileData.tile_info[0].width,
          sprite_height: tileData.tile_info[0].height,
          sprite_offset_x: 0,
          sprite_offset_y: 0,
        };
      }
    }
  }

  function parseEntryColor(color: string) {
    if (color === "BLACK") {
      return 0;
    } else if (color === "RED") {
      return 1;
    } else if (color === "GREEN") {
      return 2;
    } else if (color === "YELLOW") {
      return 3;
    } else if (color === "BLUE") {
      return 4;
    } else if (color === "MAGENTA") {
      return 5;
    } else if (color === "CYAN") {
      return 6;
    } else if (color === "WHITE") {
      return 7;
    } else return -1;
  }
}
</script>

{#if tile}
  <div
    style={`display: inline-block; width:
${tile_info.width * tile_info.pixelscale}px; height:
${tile_info.height * tile_info.pixelscale}px; position: relative;`}
    class="tile-icon">
    {#if tile.bg != null}
      <div
        style={`
position: absolute;
width: ${tile.sprite_width}px;
height: ${tile.sprite_height}px;
background-image: url(${`${baseUrl}/${encodeURIComponent(tile.file)}`});
background-position: ${-(tile.bg % tile.nx) * tile.sprite_width}px ${
          -((tile.bg / tile.nx) | 0) * tile.sprite_height
        }px;
transform-origin: top left;
transform: scale(${tile_info.pixelscale}) translate(${
          tile.sprite_offset_x
        }px, ${tile.sprite_offset_y}px) ;
image-rendering: pixelated;
`} />
    {/if}
    <div
      style={`
position: absolute;
width: ${tile.sprite_width}px;
height: ${tile.sprite_height}px;
background-image: url(${`${baseUrl}/${encodeURIComponent(tile.file)}`});
background-position: ${-(tile.fg % tile.nx) * tile.sprite_width}px ${
        -((tile.fg / tile.nx) | 0) * tile.sprite_height
      }px;
transform-origin: top left;
transform: scale(${tile_info.pixelscale}) translate(${
        tile.sprite_offset_x
      }px, ${tile.sprite_offset_y}px) ;
image-rendering: pixelated;
`} />
  </div>
{:else}
  <span style="font-family: monospace;" class="c_{color}">{symbol}</span>
{/if}

<style>
.tile-icon {
  vertical-align: middle;
}
</style>
