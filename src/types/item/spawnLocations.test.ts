import * as spawnLocations from "./spawnLocations";
import { getItemSpawnLocations } from "./spawnLocations";
import type { CddaData } from "../../data";

beforeEach(() => jest.restoreAllMocks());

describe("getItemSpawnLocations()", () => {
  it("finds a one spawn location", () => {
    let loot = [
      {
        mapgen: { overmap_terrains: [{ singularName: "fake loc" }] },
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
