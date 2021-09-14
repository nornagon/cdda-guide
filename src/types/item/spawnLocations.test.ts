import * as spawnLocations from "./spawnLocations";
import {
  getItemSpawnLocations,
  collection,
  getAllLocationsAndLoot,
  getAllMapgens,
  getItemGroup,
  parsePalette,
} from "./spawnLocations";
import { CddaData } from "../../data";

beforeEach(() => jest.restoreAllMocks());

describe("getItemSpawnLocations()", () => {
  it("finds a one spawn location", () => {
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
        items: [["fake_item", 25]],
      },
      {
        type: "overmap_terrain",
        id: "fake_terrain",
        name: "fake loc",
      },
    ]);

    const locations = getItemSpawnLocations(data, "fake_item");

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
  it("given one item, returns it", () => {
    const loot = new Map([["fake_item", 1.0]]);
    const given = [{ chance: 1.0, loot }];

    const got = collection(given);

    expect(got).toStrictEqual(loot);
  });
  it("knowns about item chance", () => {
    const given = [{ chance: 0.5, loot: new Map([["fake_item", 1.0]]) }];

    const got = collection(given);

    expect(got).toStrictEqual(new Map([["fake_item", 0.5]]));
  });
  it("knowns about loot chance", () => {
    const given = [{ chance: 1.0, loot: new Map([["fake_item", 0.5]]) }];

    const got = collection(given);

    expect(got).toStrictEqual(new Map([["fake_item", 0.5]]));
  });
  it("can add up probabilities", () => {
    const item = { chance: 1.0, loot: new Map([["fake_item", 0.5]]) };
    const given = [item, item];

    const got = collection(given);

    expect(got).toStrictEqual(new Map([["fake_item", 0.75]]));
  });
});

describe("getAllLocationsAndLoot()", () => {
  it.skip("knows about additional_items", () => {
    const additional_items = new Map([["fake_item", 1.0]]);
    const mapgen = {
      additional_items,
      overmap_terrains: [],
      rows: [],
      palette: new Map(),
    };
    const given = [mapgen];
    jest.spyOn(spawnLocations, "getAllMapgens").mockReturnValue(given);

    const got = getAllLocationsAndLoot(null as CddaData);

    expect(got).toStrictEqual([{ loot: additional_items, mapgen }]);
  });
  it("knows about rows", () => {
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        object: {
          rows: ["X"],
          items: { X: { item: "fake_item_group" } },
        },
      },
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: [["fake_item", 100]],
      },
    ]);

    const got = getAllLocationsAndLoot(data);

    expect(got).toStrictEqual([
      {
        loot: new Map([["fake_item", 1.0]]),
        mapgen: {
          additional_items: new Map(),
          overmap_terrains: [],
          rows: ["X"],
          palette: new Map([["X", new Map([["fake_item", 1.0]])]]),
        },
      },
    ]);
  });
  it("handles missing palette", () => {
    /* a more plausable situation: mapgen has a palette, but it does not define
    any items for X */
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        object: {
          rows: ["X"],
        },
      },
    ]);

    const got = getAllLocationsAndLoot(data);

    expect(got).toStrictEqual([
      {
        loot: new Map(),
        mapgen: {
          additional_items: new Map(),
          overmap_terrains: [],
          rows: ["X"],
          palette: new Map(),
        },
      },
    ]);
  });
});

describe("getAllMapgens()", () => {
  const mapgen_common = {
    overmap_terrains: [],
    rows: [],
    palette: new Map(),
    additional_items: new Map(),
  };
  it("returns [] if there are no mapgens", () => {
    const given = new CddaData([]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([]);
  });
  it("finds one mapgen if there is only one", () => {
    const given = new CddaData([
      {
        type: "mapgen",
        method: "json",
        object: {},
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([mapgen_common]);
  });
  it.each([
    ["fake_terrain" /* :string */],
    [["fake_terrain"] /* :string[] */],
    [[["fake_terrain"]] /* :string[][] */],
  ])("understands om_terrain %j", (om_terrain) => {
    const given = new CddaData([
      {
        type: "mapgen",
        method: "json",
        object: {},
        om_terrain,
      },
      {
        type: "overmap_terrain",
        id: "fake_terrain",
        name: "fake terrain",
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([
      {
        ...mapgen_common,
        overmap_terrains: [{ singularName: "fake terrain" }],
      },
    ]);
  });
  it("understands name objects", () => {
    const given = new CddaData([
      {
        type: "mapgen",
        method: "json",
        object: {},
        om_terrain: "fake_terrain",
      },
      {
        type: "overmap_terrain",
        id: "fake_terrain",
        name: { str: "fake terrain" },
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([
      {
        ...mapgen_common,
        overmap_terrains: [{ singularName: "fake terrain" }],
      },
    ]);
  });
  it("knows about rows", () => {
    const given = new CddaData([
      {
        type: "mapgen",
        method: "json",
        object: { rows: ["X"] },
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([{ ...mapgen_common, rows: ["X"] }]);
  });

  it("parses palette", () => {
    const given = new CddaData([
      {
        type: "mapgen",
        method: "json",
        object: { items: { X: { item: "fake_item_group" } } },
      },
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: [["fake_item", 50]],
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([
      {
        ...mapgen_common,
        palette: new Map([["X", new Map([["fake_item", 0.5]])]]),
      },
    ]);
  });
  it("handles missing overmap_terrain", () => {
    const given = new CddaData([
      {
        type: "mapgen",
        method: "json",
        object: {},
        om_terrain: "fake_terrain",
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([
      {
        ...mapgen_common,
        overmap_terrains: [{ singularName: "fake_terrain" }],
      },
    ]);
  });
});

describe("getItemGroup()", () => {
  it("finds an item group", () => {
    const given = new CddaData([
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: [["test_pants_fur", 50]],
      },
    ]);

    const got = getItemGroup(given, "fake_item_group");

    expect(got).toStrictEqual(new Map([["test_pants_fur", 0.5]]));
  });
});

describe("parsePalette()", () => {
  it("perses empty pallete", () => {
    const got = parsePalette(new CddaData([]), {});
    expect(got).toStrictEqual(new Map());
  });

  it("knows about .items", () => {
    const data = new CddaData([
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: [["test_pants_fur", 50]],
      },
    ]);
    const rawPalette = {
      items: { X: { item: "fake_item_group" } },
    };

    const got = parsePalette(data, rawPalette);

    expect(got).toStrictEqual(
      new Map([["X", new Map([["test_pants_fur", 0.5]])]])
    );
  });

  it("knows about arrays in .items", () => {
    const data = new CddaData([
      {
        id: "gr0",
        type: "item_group",
        subtype: "collection",
        items: [["fake_item", 50]],
      },
      {
        id: "gr1",
        type: "item_group",
        subtype: "collection",
        items: [["fake_item", 50]],
      },
    ]);
    const rawPalette = {
      items: { X: [{ item: "gr0" }, { item: "gr1" }] },
    };

    const got = parsePalette(data, rawPalette);

    expect(got).toStrictEqual(new Map([["X", new Map([["fake_item", 0.75]])]]));
  });

  it("knows about chance in .items", () => {
    const data = new CddaData([
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: [["test_pants_fur", 50]],
      },
    ]);
    const rawPalette = {
      items: { X: { item: "fake_item_group", chance: 50 } },
    };

    const got = parsePalette(data, rawPalette);

    expect(got).toStrictEqual(
      new Map([["X", new Map([["test_pants_fur", 0.25]])]])
    );
  });
});
