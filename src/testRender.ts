import { render, cleanup, act } from "@testing-library/svelte";
import { screen } from "@testing-library/dom";
import { expect, test, afterEach } from "vitest";
import * as fs from "fs";
import path from "path";

import { CddaData, mapType } from "./data";

import Thing from "./Thing.svelte";
import {
  furnitureByOMSAppearance,
  lootByOMSAppearance,
  terrainByOMSAppearance,
} from "./types/item/spawnLocations";

export function makeRenderTests(chunkIdx: number, numChunks: number) {
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
    "proficiency",
    "overmap_special",
    "item_action",
    "technique",
  ];

  const all = data._raw
    .filter(
      (x) =>
        x.id &&
        types.includes(mapType(x.type)) &&
        (!process.env.TEST_ONLY ||
          process.env.TEST_ONLY === `${mapType(x.type)}/${x.id}`)
    )
    .map((x) => [mapType(x.type), x.id]);

  afterEach(cleanup);

  test.each(all.filter((_, i) => i % numChunks === chunkIdx))(
    "render %s %s",
    {
      // The first test sometimes times out on CI with the default 5sec timeout.
      timeout: 20000,
    },
    async (type, id) => {
      // Prefill the loot tables, so we don't have to mess with waiting for async load...
      await lootByOMSAppearance(data);
      await furnitureByOMSAppearance(data);
      await terrainByOMSAppearance(data);

      // This lets LimitedList always render expanded.
      (globalThis as any).__isTesting__ = true;
      const { container } = render(Thing, { item: { type, id }, data });
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
      expect(screen.queryByTestId("loading-indicator")).toBe(null);

      if (process.env.DUMP_PAGES) {
        const filename = path.resolve(
          process.cwd(),
          "_rendered",
          type,
          id + ""
        );
        const dumpStr = dumpElement(container);
        fs.mkdirSync(path.dirname(filename), { recursive: true });
        fs.writeFileSync(filename, dumpStr);
      }

      const { textContent } = container;
      expect(textContent).not.toMatch(/undefined|NaN|object Object/);
    }
  );
}

const BLOCK_TAGS = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "DETAILS",
  "DIALOG",
  "DD",
  "DIV",
  "DL",
  "DT",
  "FIELDSET",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "FORM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HGROUP",
  "HR",
  "LI",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "TR",
  "THEAD",
  "TBODY",
  "TFOOT",
  "UL",
]);
function dumpElement(el: HTMLElement): string {
  let out = "";

  let preserveWhitespace = false;

  const append = (s: string) => {
    if (!s) return;
    if (!preserveWhitespace) {
      s = s.replace(/\s+/g, " ");
      if (out.endsWith(" ") && s.startsWith(" ")) s = s.slice(1);
    }
    out += s;
  };

  const rec = (node: Node) => {
    if (node.nodeType === node.TEXT_NODE) {
      append((node as Text).nodeValue || "");
      return;
    }

    if (node.nodeType !== node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName;

    const wasPreserve = preserveWhitespace;
    if (tag === "PRE") preserveWhitespace = true;

    const isBlock = BLOCK_TAGS.has(tag);
    const isBr = tag === "BR";

    if (isBr) {
      if (!out.endsWith("\n")) out += "\n";
      return;
    }

    if (isBlock && !out.endsWith("\n")) out += "\n";

    // For table-ish elements, insert lightweight separators
    if (tag === "TR" && !out.endsWith("\n")) out += "\n";

    // Recurse children
    for (const child of Array.from(el.childNodes)) rec(child);

    // Close block with newline
    if (isBlock && !out.endsWith("\n")) out += "\n";

    preserveWhitespace = wasPreserve;
  };

  for (const child of el.childNodes) {
    rec(child);
  }
  return out;
}
