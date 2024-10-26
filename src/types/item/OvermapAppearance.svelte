<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singular } from "../../data";
import type { OvermapSpecial } from "../../types";

const data = getContext<CddaData>("data");

export let overmapSpecial: OvermapSpecial;
export let showZ: number = 0;

const overmaps = [
  ...(overmapSpecial.subtype !== "mutable"
    ? overmapSpecial.overmaps ?? []
    : []),
];
let minX = Infinity,
  minY = Infinity;
let maxX = -Infinity,
  maxY = -Infinity;
const overmapsByPoint = new Map<string, (typeof overmaps)[0]>();

for (const om of overmaps) {
  const [x, y, z] = om.point;
  if (om.overmap) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    overmapsByPoint.set(`${x}|${y}|${z}`, om);
  }
}

function makeAppearanceGrid(z: number) {
  const appearanceGrid: { sym?: string; color: string; name: string }[][] = [];
  for (let y = minY; y <= maxY; y++) {
    const appearanceRow: { sym?: string; color: string; name: string }[] = [];
    for (let x = minX; x <= maxX; x++) {
      const om = overmapsByPoint.get(`${x}|${y}|${z}`);
      if (om?.overmap) {
        const [, omt_id, dir] = /^(.+?)(?:_(north|south|east|west))?$/.exec(
          om.overmap
        )!;
        const appearance = omtAppearance(omt_id, dir || "north");
        appearanceRow.push(appearance);
      } else {
        appearanceRow.push({ color: "black", sym: " ", name: "" });
      }
    }
    appearanceGrid.push(appearanceRow);
  }

  return appearanceGrid;
}

function rotateSymbol(symbol: string, dir: string) {
  const dirNum =
    dir === "north"
      ? 0
      : dir === "east"
      ? 1
      : dir === "south"
      ? 2
      : dir === "west"
      ? 3
      : 0;
  if (dirNum === 0) return symbol;
  const rotatable = data
    .byType("rotatable_symbol")
    .find((r) => r.tuple.some((x) => x === symbol));
  if (!rotatable) return symbol;
  return rotatable.tuple[
    (rotatable.tuple.indexOf(symbol) + dirNum) % rotatable.tuple.length
  ];
}

function omtAppearance(
  omt_id: string,
  dir: string = "north"
): {
  color: string;
  sym: string;
  name: string;
} {
  const omt = data.byIdMaybe("overmap_terrain", omt_id);
  return omt
    ? {
        color: omt.color ?? "black",
        sym: rotateSymbol(omt.sym ?? "\u00a0" /* LINE_XOXO_C */, dir),
        name: singular(omt.name),
      }
    : { color: "black", sym: " ", name: "" };
}
</script>

<div class="appearance-grid">
  {#each makeAppearanceGrid(showZ) as row}{#each row as omt}<span
        class="c_{omt.color}"
        title={omt.name}>{omt.sym ?? "\u00a0"}</span
      >{/each}<br />{/each}
</div>

<style>
.appearance-grid {
  font-family: Unifont, monospace;
  line-height: 1;
  white-space: pre;
}
</style>
