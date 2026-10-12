<script lang="ts">
import { tileData } from "../../tile-data";
import { colorForName } from "../../colors";
import { CddaData, mapType } from "../../data";
import { getContext } from "svelte";
export let item: {
  id: string;
  looks_like?: string;
  color?: string | string[];
  bgcolor?: string | [string] | [string, string, string, string];
  symbol?: string | string[];
  type: string;
  variants?: any;
};

let data: CddaData = getContext("data");

$: tile_info = $tileData?.tile_info[0];
$: tile = typeHasTile(item)
  ? (findTileOrLooksLike($tileData, item) ??
    fallbackTile(
      $tileData,
      item.type === "vehicle_part" && item.variants
        ? item.variants[0].symbols[0]
        : item.symbol,
      item.color ?? "white",
    ))
  : null;
$: baseUrl = $tileData?.baseUrl;
$: layers = [tile?.bg, tile?.fg].filter((layer) => !!layer);

const sym =
  item.type === "vehicle_part" && item.variants
    ? item.variants[0].symbols[0]
    : ([item.symbol].flat()[0] ?? " ");
const symbol = /^LINE_/.test(sym) ? "|" : sym;
const color = item.color
  ? typeof item.color === "string"
    ? item.color
    : item.color[0]
  : item.bgcolor
    ? colorFromBgcolor(item.bgcolor)
    : "white";

function typeHasTile(item: any): boolean {
  return ["item", "monster", "terrain", "furniture", "vehicle_part"].includes(
    mapType(item.type),
  );
}

function colorFromBgcolor(
  color: string | [string] | [string, string, string, string],
): string {
  return typeof color === "string" ? `i_${color}` : colorFromBgcolor(color[0]);
}

function findTileOrLooksLike(
  tileData: any,
  item: any,
  jumps: number = 10,
): TileInfo | undefined {
  function resolveId(id: string): string {
    return item.type === "vehicle_part"
      ? item.variants?.[0].id
        ? `vp_${id}_${item.variants[0].id}`
        : `vp_${id}`
      : id;
  }
  const idTile = findTile(tileData, resolveId(item.id ?? item.abstract));
  if (idTile) return idTile;
  const looksLikeId = item.looks_like ?? item["copy-from"];
  if (!looksLikeId) return;
  const looksLikeTile = findTile(tileData, resolveId(looksLikeId));
  if (looksLikeTile) return looksLikeTile;
  if (jumps > 0) {
    const parent =
      data.byIdMaybe(mapType(item.type), looksLikeId) ??
      data.abstractById(mapType(item.type), looksLikeId);
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

function findTile(tileData: any, id: string): TileInfo | undefined {
  if (!tileData || !id) return;
  let offset = 0;
  const ranges: { from: number; to: number; chunk: any }[] = [];
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
    if (!range) return;
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
  const idMatches = (testId: string) =>
    testId &&
    (testId === id ||
      (testId.startsWith(id) &&
        /^_season_(autumn|spring|summer|winter)$/.test(
          testId.substring(id.length),
        )));
  for (const chunk of tileData["tiles-new"]) {
    for (const info of chunk.tiles) {
      if (
        Array.isArray(info.id) ? info.id.some(idMatches) : idMatches(info.id)
      ) {
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
  symbolMaybeArr: string | string[] | undefined,
  color: string | string[],
): TileInfo | undefined {
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
</script>

{#if layers.length}
  <div
    class="tile-icon"
    style="
      zoom: {tile_info.pixelscale};
      --cell-width: {tile_info.width}px;
      --cell-height: {tile_info.height}px;
    ">
    {#each layers as layer}
      <div
        class="layer"
        style="
          --width: {layer.width}px;
          --height: {layer.height}px;
          --column: {layer.tx};
          --row: {layer.ty};
          background-image: url({baseUrl}/{encodeURIComponent(layer.file)});
        ">
      </div>
    {/each}
  </div>
{:else}
  <span style="font-family: monospace;" class="c_{color}">{symbol}</span>
{/if}

<style>
/* The box is at least one tileset cell. The layers share one grid area, which
   sits in the center of the box. */
.tile-icon {
  display: inline-grid;
  place-content: center;
  vertical-align: middle;
  min-width: var(--cell-width);
  min-height: var(--cell-height);
  image-rendering: pixelated;
}

/* Tilesets anchor larger layers to the bottom center of the cell. */
.layer {
  grid-area: 1 / 1;
  place-self: end center;
  width: var(--width);
  height: var(--height);
  background-position: calc(-1 * var(--column) * var(--width))
    calc(-1 * var(--row) * var(--height));
}
</style>
