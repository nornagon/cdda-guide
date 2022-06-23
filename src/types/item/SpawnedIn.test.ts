import "@testing-library/jest-dom";
import { render } from "@testing-library/svelte";
import SpawnedIn from "./SpawnedIn.svelte";
import WithData from "../../WithData.svelte";
import { CddaData } from "../../data";

describe("the loot section", () => {
  it("displays the name of the spawn location and chance", () => {
    const spawnLocations = [{ singularName: "fake place", chance: 0.5 }];
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

    const { getByText } = render(WithData, {
      Component: SpawnedIn,
      item_id,
      data,
    });

    expect(getByText(/fake place/)).toBeInTheDocument();
    expect(getByText(/50.00%/)).toBeInTheDocument();
  });
  it("displays a composite chance", () => {
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

    const { getByText } = render(WithData, {
      Component: SpawnedIn,
      item_id: "fake_item",
      data,
    });

    expect(getByText(/75.00%/)).toBeInTheDocument();
  });
});
//getItemSpawnLocations
