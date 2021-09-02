import * as spawnLocations from "./spawnLocations";
import { getItemSpawnLocations, collection } from "./spawnLocations";
import type { CddaData } from "../../data";

beforeEach(() => jest.restoreAllMocks());

describe("getItemSpawnLocations()", () => {
  it("finds a one spawn location", () => {
    let loot = [
      {
        mapgen: {
          overmap_terrains: [{ singularName: "fake loc" }],
          rows: [],
          palettes: [],
          additional_items: new Map(),
        },
        loot: new Map([["fake_item", 0.25]]),
      },
    ];
    jest.spyOn(spawnLocations, "getAllLocationsAndLoot").mockReturnValue(loot);

    const locations = getItemSpawnLocations(null as CddaData, "fake_item");

    expect(locations).toStrictEqual([
      { singularName: "fake loc", chance: 0.25 },
    ]);
  });
});

describe("collection()", () => {
  it("returns nothing given no items", () => {
    const got = collection([]);

    expect(got).toStrictEqual(new Map());
  });
});
