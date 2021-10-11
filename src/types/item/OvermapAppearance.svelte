<script lang="ts">
import { getContext } from "svelte";
import { CddaData, singular } from "../../data";
import type { OvermapSpecial } from "../../types";

const data = getContext<CddaData>("data");

export let overmapSpecial: OvermapSpecial;

const overmaps = [...(overmapSpecial.overmaps ?? [])];
let minX = Infinity,
  minY = Infinity;
let maxX = -Infinity,
  maxY = -Infinity;
const overmapsByPoint = new Map<string, typeof overmaps[0]>();
for (const om of overmaps) {
  const [x, y, z] = om.point;
  if (z !== 0) continue;
  if (x < minX) minX = x;
  if (y < minY) minY = y;
  if (x > maxX) maxX = x;
  if (y > maxY) maxY = y;
  overmapsByPoint.set(`${x}|${y}`, om);
}
const appearanceGrid: { sym?: string; color: string; name: string }[][] = [];
for (let y = minY; y <= maxY; y++) {
  const appearanceRow: { sym?: string; color: string; name: string }[] = [];
  for (let x = minX; x <= maxX; x++) {
    const om = overmapsByPoint.get(`${x}|${y}`);
    if (om) {
      const omt_id = om.overmap.replace(/_(north|south|east|west)$/, "");
      const appearance = omtAppearance(omt_id);
      appearanceRow.push(appearance);
    } else {
      appearanceRow.push({ color: "black", sym: " ", name: "" });
    }
  }
  appearanceGrid.push(appearanceRow);
}

while (appearanceGrid.length) {
  const row = appearanceGrid[0];
  if (!isEmpty(row)) break;
  appearanceGrid.shift();
}

while (appearanceGrid.length) {
  const row = appearanceGrid[appearanceGrid.length - 1];
  if (!isEmpty(row)) break;
  appearanceGrid.pop();
}

function isEmpty(
  row: { sym?: string; color: string; name: string }[]
): boolean {
  return row.every((cell) => cell.sym === " ");
}

function omtAppearance(omt_id: string): {
  color: string;
  sym: string;
  name: string;
} {
  const omt = data.byId("overmap_terrain", omt_id);
  return omt
    ? { color: omt.color, sym: omt.sym, name: singular(omt.name) }
    : { color: "black", sym: " ", name: "" };
}
</script>

<div
  style="font-family: Unifont, monospace; line-height: 1; display: inline-block; white-space: pre;">
  {#each appearanceGrid as row}
    {#each row as omt}
      <span class="c_{omt.color}" title={omt.name}>{omt.sym ?? "\u00a0"}</span>
    {/each}
    <br />
  {/each}
</div>
