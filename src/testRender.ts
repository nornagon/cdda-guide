import { render, cleanup } from "@testing-library/svelte";
import { tick } from "svelte";
import { expect, test, afterEach, inject } from "vitest";
import { commands } from "vitest/browser";

import { CddaData, mapType } from "./data";
import type { SupportedTypeMapped } from "./types";

import Thing from "./Thing.svelte";
declare module "vitest" {
  export interface ProvidedContext {
    testOnly: string;
    dumpPages: boolean;
  }
}

export async function makeRenderTests(chunkIdx: number, numChunks: number) {
  const json = await (await fetch("/_test/all.json")).json();
  const data = new CddaData(json.data);
  const testOnly = inject("testOnly");
  const dumpPages = inject("dumpPages");
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

  const all = data
    .all()
    .filter(
      (x): x is SupportedTypeMapped & { id: string } =>
        "id" in x &&
        Boolean(x.id) &&
        types.includes(mapType(x.type)) &&
        (!testOnly || testOnly === `${mapType(x.type)}/${x.id}`),
    )
    .map((x) => [mapType(x.type), x.id]);

  afterEach(cleanup);

  test.each(all.filter((_, i) => testOnly || i % numChunks === chunkIdx))(
    "render %s %s",
    {
      // The first item page builds the shared location indexes.
      timeout: 60000,
    },
    async (type, id) => {
      // This lets LimitedList always render expanded.
      (globalThis as any).__isTesting__ = true;
      const { container } = render(Thing, { item: { type, id }, data });
      // Let Svelte show pending await blocks, then wait for the page to finish loading.
      await tick();
      await expect
        .poll(
          () => container.querySelector('[data-testid="loading-indicator"]'),
          { timeout: 30000 },
        )
        .toBeNull();

      if (dumpPages) {
        await commands.writeFile(
          `_rendered/${type}/${id}`,
          dumpElement(container),
        );
      }

      const { textContent } = container;
      expect(textContent).not.toMatch(
        /undefined|NaN|object Object|There was a problem displaying this page/,
      );
    },
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
