/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/svelte";
import * as fs from "fs";

import { CddaData, mapType } from "./data";

import Thing from "./Thing.svelte";
import { lootByOMSAppearance } from "./types/item/spawnLocations";

const json = JSON.parse(
  fs.readFileSync(__dirname + "/../_test/all.json", "utf8")
);
let data: CddaData = new CddaData(json.data);
const types = [
  "item",
  "furniture",
  "monster",
  "technique",
  "ammunition_type",
  "fault",
  "json_flag",
  "material",
  "proficiency",
  "tool_quality",
  "skill",
  "vehicle_part",
  "vitamin",
  "martial_art",
  "mutation",
  "mutation_type",
  "mutation_category",
  "vehicle",
  "terrain",
  "weapon_category",
  "construction_group",
  "bionic",
];

const all = data._raw
  .filter((x) => x.id && types.includes(mapType(x.type)))
  .map((x) => [mapType(x.type), x.id]);

test.each(all)("render %s %s", async (type, id) => {
  // Prefill the loot tables, so we don't have to mess with waiting for async load...
  await lootByOMSAppearance(data);
  const { container } = render(Thing, { item: { type, id }, data });
  if (type !== "technique") {
    expect(container.textContent).not.toMatch(/undefined|NaN|object Object/);
  }
});
