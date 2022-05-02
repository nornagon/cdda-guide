<script lang="ts">
import { tileData } from "../../tile-data";
import { colorForName } from "../../colors";
import { data, mapType } from "../../data";
export let item: {
  id: string;
  looks_like?: string;
  color?: string | string[];
  bgcolor?: string | [string] | [string, string, string, string];
  symbol?: string | string[];
  type: string;
};

$: tile_info = $tileData?.tile_info[0];
$: tile = typeHasTile(item)
  ? findTileOrLooksLike($tileData, item) ??
    fallbackTile($tileData, item.symbol, item.color)
  : null;
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

function typeHasTile(item: any): boolean {
  return ["item", "monster", "terrain", "furniture", "vehicle_part"].includes(
    mapType(item.type)
  );
}

function colorFromBgcolor(
  color: string | [string] | [string, string, string, string]
) {
  return typeof color === "string" ? `i_${color}` : colorFromBgcolor(color[0]);
}

function findTileOrLooksLike(
  tileData: any,
  item: any,
  jumps: number = 10
): TileInfo {
  function resolveId(id: string): string {
    return item.type === "vehicle_part" ? `vp_${id}` : id;
  }
  const idTile = findTile(tileData, resolveId(item.id ?? item.abstract));
  if (idTile) return idTile;
  const looksLikeId = item.looks_like ?? item["copy-from"];
  if (!looksLikeId) return;
  const looksLikeTile = findTile(tileData, resolveId(looksLikeId));
  if (looksLikeTile) return looksLikeTile;
  if (jumps > 0) {
    const parent =
      $data.byId(mapType(item.type), looksLikeId) ??
      $data.abstractById(mapType(item.type), looksLikeId);
    if (parent) return findTileOrLooksLike(tileData, parent, jumps - 1);
  }
}

type TilePosition = {
  file: string;
  tx: number;
  ty: number;
  width: number;
  height: number;
  offx: number;
  offy: number;
};
type TileInfo = {
  fg?: TilePosition;
  bg?: TilePosition;
};

function findTile(tileData: any, id: string): TileInfo {
  if (!tileData || !id) return;
  let offset = 0;
  const ranges = [];
  for (const chunk of tileData["tiles-new"]) {
    ranges.push({
      from: offset,
      to: offset + chunk.nx * chunk.ny,
      chunk,
    });
    offset += chunk.nx * chunk.ny;
  }
  function findRange(id: number) {
    for (const range of ranges)
      if (id >= range.from && id < range.to) return range;
  }
  function tileInfoForId(id: number | undefined): TilePosition | undefined {
    if (id == null) return;
    const range = findRange(id);
    const offsetInFile = id - range.from;
    const fgTx = offsetInFile % range.chunk.nx;
    const fgTy = (offsetInFile / range.chunk.nx) | 0;
    return {
      file: range.chunk.file,
      width: range.chunk.sprite_width ?? tileData.tile_info[0].width,
      height: range.chunk.sprite_height ?? tileData.tile_info[0].height,
      offx: range.chunk.sprite_offset_x ?? 0,
      offy: range.chunk.sprite_offset_y ?? 0,
      tx: fgTx,
      ty: fgTy,
    };
  }
  for (const chunk of tileData["tiles-new"]) {
    for (const info of chunk.tiles) {
      if ((Array.isArray(info.id) && info.id.includes(id)) || info.id === id) {
        let fg = Array.isArray(info.fg) ? info.fg[0] : info.fg;
        let bg = Array.isArray(info.bg) ? info.bg[0] : info.bg;
        if (fg && typeof fg === "object") fg = fg.sprite;
        if (bg && typeof bg === "object") bg = bg.sprite;
        return {
          fg: tileInfoForId(fg),
          bg: tileInfoForId(bg),
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
): TileInfo {
  if (!tileData) return;
  const symbol = [symbolMaybeArr].flat()[0];
  const sym = !symbol ? " " : /^LINE_/.test(symbol) ? "|" : symbol;
  const c = colorForName(Array.isArray(color) ? color[0] : color).fg;
  for (const chunk of tileData["tiles-new"]) {
    for (const entry of chunk.ascii ?? []) {
      const fg = parseEntryColor(entry.color) + (entry.bold ? 8 : 0);
      if (fg === c) {
        const index = entry.offset + sym.charCodeAt(0);
        const tx = index % chunk.nx;
        const ty = (index / chunk.nx) | 0;
        return {
          fg: {
            file: chunk.file,
            tx,
            ty,
            width: tileData.tile_info[0].width,
            height: tileData.tile_info[0].height,
            offx: 0,
            offy: 0,
          },
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

// Simple CSS helper to fight Prettier, which wants to mangle inline CSS strings.
function css(obj: Record<string, string>) {
  let result = "";
  for (const [k, v] of Object.entries(obj)) {
    result += `${k}: ${v};`;
  }
  return result;
}
</script>

{#if tile}
  <div
    style={css({
      width: `${tile_info.width * tile_info.pixelscale}px`,
      height: `${tile_info.height * tile_info.pixelscale}px`,
    })}
    class="tile-icon">
    {#if tile.bg != null}
      <div
        class="icon-layer bg"
        style={css({
          width: `${tile.bg.width}px`,
          height: `${tile.bg.height}px`,
          "background-image": `url(${`${baseUrl}/${encodeURIComponent(
            tile.bg.file
          )}`})`,
          "background-position": `${-tile.bg.tx * tile.bg.width}px ${
            -tile.bg.ty * tile.bg.height
          }px`,
          transform: `scale(${tile_info.pixelscale}) translate(${tile.bg.offx}px, ${tile.bg.offy}px)`,
        })} />
    {/if}
    {#if tile.fg != null}
      <div
        class="icon-layer fg"
        style={css({
          width: `${tile.fg.width}px`,
          height: `${tile.fg.height}px`,
          "background-image": `url(${`${baseUrl}/${encodeURIComponent(
            tile.fg.file
          )}`})`,
          "background-position": `${-tile.fg.tx * tile.fg.width}px ${
            -tile.fg.ty * tile.fg.height
          }px`,
          transform: `scale(${tile_info.pixelscale}) translate(${tile.fg.offx}px, ${tile.fg.offy}px)`,
        })} />
    {/if}
  </div>
{:else}
  <span style="font-family: monospace;" class="c_{color}">{symbol}</span>
{/if}

<style>
.tile-icon {
  vertical-align: middle;
  display: inline-block;
  position: relative;
}

.icon-layer {
  position: absolute;
  transform-origin: top left;
  image-rendering: pixelated;
}
</style>
