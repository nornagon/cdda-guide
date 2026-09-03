/**
 * @vitest-environment jsdom
 */
import { cleanup, render } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";

import { CddaData } from "./data";
import ModCatalog from "./ModCatalog.svelte";

afterEach(cleanup);

describe("ModCatalog", () => {
  it("groups links to mod pages by category", () => {
    const data = new CddaData([], undefined, undefined, {
      test_mod: {
        id: "test_mod",
        name: "Test Mod",
        description: "A test mod.",
        category: "content",
      },
      other_mod: {
        id: "other_mod",
        name: "Other Mod",
        description: "Another mod.",
        category: "total_conversion",
      },
    });
    const { getByRole, queryByText } = render(ModCatalog, { data });

    const link = getByRole("link", { name: "Test Mod" });
    expect(link.getAttribute("href")).toBe("/mod/test_mod");
    expect(queryByText("A test mod.")).toBeNull();
    expect(queryByText("Items")).toBeNull();
    expect(document.querySelector("input[type=checkbox]")).toBeNull();
    expect(link.closest("section")).toBe(
      getByRole("heading", { name: "CORE CONTENT PACKS" }).closest("section"),
    );
    expect(getByRole("link", { name: "Other Mod" }).closest("section")).toBe(
      getByRole("heading", { name: "TOTAL CONVERSIONS" }).closest("section"),
    );
  });
});
