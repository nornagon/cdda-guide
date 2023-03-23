/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/svelte";

import SpawnedIn from "./SpawnedIn.svelte";
import WithData from "../../WithData.svelte";
import { CddaData } from "../../data";
import { lootByOMSAppearance } from "./spawnLocations";
import { describe, it, expect } from "vitest";

describe("the loot section", () => {
  it("displays the name of the spawn location and chance", async () => {
    const item_id = "fake_item";
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        om_terrain: "fake_terrain",
        object: {
          rows: ["X"],
          items: { X: { item: "fake_item_group" } },
        },
      },
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: [["fake_item", 50]],
      },
      {
        type: "overmap_terrain",
        id: "fake_terrain",
        name: "fake place",
      },
      {
        type: "overmap_special",
        id: "fake_overmap_special",
        overmaps: [{ point: [0, 0, 0], overmap: "fake_terrain" }],
      },
    ]);

    await lootByOMSAppearance(data);

    const { getByText } = render(WithData, {
      Component: SpawnedIn,
      item_id,
      data,
    });
    await new Promise((r) => setTimeout(r));

    expect(getByText(/fake place/)).toBeTruthy();
    expect(getByText(/50.00%/)).toBeTruthy();
  });
  it("displays a composite chance", async () => {
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        om_terrain: "fake_terrain",
        object: {
          place_item: [{ item: "fake_item" }],
        },
      },
      {
        type: "mapgen",
        method: "json",
        om_terrain: "fake_terrain",
        object: {
          place_item: [{ item: "fake_item", chance: 50 }],
        },
      },
      {
        type: "overmap_terrain",
        id: "fake_terrain",
        name: "fake place",
      },
      {
        type: "overmap_special",
        id: "fake_overmap_special",
        overmaps: [{ point: [0, 0, 0], overmap: "fake_terrain" }],
      },
    ]);

    await lootByOMSAppearance(data);

    const { getByText } = render(WithData, {
      Component: SpawnedIn,
      item_id: "fake_item",
      data,
    });
    await new Promise((r) => setTimeout(r));

    expect(getByText(/75.00%/)).toBeTruthy();
  });
});
