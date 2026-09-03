/**
 * @vitest-environment jsdom
 */
import { cleanup, render } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";

import { CddaData } from "./data";
import Thing from "./Thing.svelte";
import WithData from "./WithData.svelte";
import ModTag from "./ModTag.svelte";
import ThingLink from "./types/ThingLink.svelte";

afterEach(cleanup);

describe("ModTag", () => {
  it("shows each mod that edited an object without showing dda", () => {
    const data = new CddaData(
      [{ type: "GENERIC", id: "test_item", name: "Base item" }],
      undefined,
      undefined,
      undefined,
      {
        first_mod: {
          info: { name: "First Mod" },
          data: [
            {
              type: "GENERIC",
              id: "test_item",
              "copy-from": "test_item",
              name: "First edit",
            },
          ],
        },
        second_mod: {
          info: { name: "Second Mod" },
          data: [
            {
              type: "GENERIC",
              id: "test_item",
              "copy-from": "test_item",
              name: "Second edit",
            },
          ],
        },
      },
      ["first_mod", "second_mod"],
    );

    const { container, getByText, queryByText } = render(ModTag, {
      item: data.byId("item", "test_item"),
    });

    expect(getByText("First Mod").getAttribute("href")).toBe("/mod/first_mod");
    expect(getByText("Second Mod").getAttribute("href")).toBe(
      "/mod/second_mod",
    );
    expect(queryByText("Dark Days Ahead")).toBeNull();
    expect(container.querySelectorAll(".mod-tag")).toHaveLength(2);
  });

  it("renders nothing for objects only provided by dda", () => {
    const data = new CddaData([
      { type: "GENERIC", id: "test_item", name: "Base item" },
    ]);

    const { container } = render(ModTag, {
      item: data.byId("item", "test_item"),
    });

    expect(container.querySelector(".mod-tags")).toBeNull();
  });

  it("shows mod tags on links to modded objects", () => {
    const data = new CddaData(
      [],
      undefined,
      undefined,
      undefined,
      {
        test_mod: {
          info: { name: "Test Mod" },
          data: [{ type: "GENERIC", id: "test_item", name: "Test item" }],
        },
      },
      ["test_mod"],
    );

    const { getByText } = render(WithData, {
      Component: ThingLink,
      data,
      type: "item",
      id: "test_item",
    });

    expect(getByText("Test item").tagName).toBe("A");
    expect(getByText("Test Mod").classList).toContain("mod-tag");
  });

  it("does not add trailing whitespace to unmodded links", () => {
    const data = new CddaData([
      { type: "GENERIC", id: "test_item", name: "Test item" },
    ]);

    const { container } = render(WithData, {
      Component: ThingLink,
      data,
      type: "item",
      id: "test_item",
    });

    expect(container.textContent).toBe("Test item");
  });

  it("attaches mod tags to a detail page title", () => {
    const data = new CddaData(
      [{ type: "MONSTER", id: "test_monster", name: "Test monster" }],
      undefined,
      undefined,
      undefined,
      {
        test_mod: {
          info: { name: "Test Mod" },
          data: [
            {
              type: "MONSTER",
              id: "test_monster",
              "copy-from": "test_monster",
            },
          ],
        },
      },
      ["test_mod"],
    );

    const { container } = render(Thing, {
      item: { type: "monster", id: "test_monster" },
      data,
    });

    const title = container.querySelector("h1");
    expect(title?.textContent).toContain("Test monster");
    expect(title?.querySelector(".mod-tag")?.textContent).toBe("Test Mod");
  });
});
