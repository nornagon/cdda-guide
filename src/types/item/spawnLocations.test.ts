import * as spawnLocations from "./spawnLocations";
import {
  getItemSpawnLocations,
  collection,
  getAllLocationsAndLoot,
  getAllMapgens,
  parsePalette,
  repeatChance,
} from "./spawnLocations";
import { CddaData } from "../../data";

const raw_mapgen_common = {
  type: "mapgen",
  method: "json",
  om_terrain: "this_terrain_does_not_exist",
  object: {},
};

const mapgen_common = {
  overmap_terrains: [{ singularName: "this_terrain_does_not_exist" }],
  rows: [],
  palette: new Map(),
  additional_items: new Map(),
};

describe("getItemSpawnLocations()", () => {
  it("finds a one spawn location", () => {
    const data = new CddaData([
      {
        ...raw_mapgen_common,
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
      { singularName: "fake loc", chance: [0.25] },
    ]);
  });
  it("merges location variants", () => {
    const oneVariant = {
      ...raw_mapgen_common,
      om_terrain: "fake_terrain",
      object: {
        place_item: [{ item: "fake_item" }],
      },
    };
    const data = new CddaData([oneVariant, oneVariant]);

    const locations = getItemSpawnLocations(data, "fake_item");

    expect(locations).toStrictEqual([
      { singularName: "fake_terrain", chance: [1, 1] },
    ]);
  });
  it("sorts the chances", () => {
    const withChance = (chance) => ({
      ...raw_mapgen_common,
      om_terrain: "fake_terrain",
      object: {
        place_item: [{ item: "fake_item", chance }],
      },
    });
    const data = new CddaData([
      withChance(100),
      withChance(25),
      withChance(50),
    ]);

    const locations = getItemSpawnLocations(data, "fake_item");

    expect(locations).toStrictEqual([
      { singularName: "fake_terrain", chance: [1, 0.5, 0.25] },
    ]);
  });
  it("sorts by highest chance", () => {
    const data = new CddaData(
      [
        ["ter100", 100],
        ["ter25", 25],
        ["ter50", 50],
      ].map(([om_terrain, chance]) => ({
        ...raw_mapgen_common,
        om_terrain,
        object: {
          place_item: [{ item: "fake_item", chance }],
        },
      }))
    );

    const locations = getItemSpawnLocations(data, "fake_item");

    expect(locations).toStrictEqual([
      { singularName: "ter100", chance: [1] },
      { singularName: "ter50", chance: [0.5] },
      { singularName: "ter25", chance: [0.25] },
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
  it("defaunts chance to 1", () => {
    const given = [{ loot: new Map([["fake_item", 0.5]]) }];

    const got = collection(given);

    expect(got).toStrictEqual(new Map([["fake_item", 0.5]]));
  });
});

describe("getAllLocationsAndLoot()", () => {
  it("knows about additional_items", () => {
    const data = new CddaData([
      {
        ...raw_mapgen_common,
        object: {
          place_item: [{ item: "fake_item" }],
        },
      },
    ]);

    const got = getAllLocationsAndLoot(data);

    const additional_items = new Map([["fake_item", 1.0]]);
    const mapgen = {
      ...mapgen_common,
      additional_items,
    };
    expect(got).toStrictEqual([{ loot: additional_items, mapgen }]);
  });
  it("knows about rows", () => {
    const data = new CddaData([
      {
        ...raw_mapgen_common,
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
          ...mapgen_common,
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
        ...raw_mapgen_common,
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
          ...mapgen_common,
          rows: ["X"],
        },
      },
    ]);
  });
});

describe("getAllMapgens()", () => {
  it("returns [] if there are no mapgens", () => {
    const given = new CddaData([]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([]);
  });
  it("finds one mapgen if there is only one", () => {
    const given = new CddaData([raw_mapgen_common]);

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
        ...raw_mapgen_common,
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
        ...raw_mapgen_common,
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
        ...raw_mapgen_common,
        object: { rows: ["X"] },
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([{ ...mapgen_common, rows: ["X"] }]);
  });

  it("parses palette", () => {
    const given = new CddaData([
      {
        ...raw_mapgen_common,
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
        ...raw_mapgen_common,
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
  it("ignores nested and update mapgens", () => {
    const { om_terrain: _, ...common } = raw_mapgen_common;
    const given = new CddaData([
      {
        ...common,
        nested_mapgen_id: "fake_nested",
      },
      {
        ...common,
        update_mapgen_id: "fake_update",
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([]);
  });
  it.each(["place_item", "add"])("knows about .object.%s", (key) => {
    const given = new CddaData([
      {
        ...raw_mapgen_common,
        object: {
          [key]: [{ item: "fake_item" }, { item: "with_chance", chance: 50 }],
        },
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([
      {
        ...mapgen_common,
        additional_items: new Map([
          ["fake_item", 1],
          ["with_chance", 0.5],
        ]),
      },
    ]);
  });
  it("knows about .object.place_item.[].repeat", () => {
    const given = new CddaData([
      {
        ...raw_mapgen_common,
        object: {
          place_item: [{ item: "fake_item", chance: 50, repeat: 2 }],
        },
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([
      {
        ...mapgen_common,
        additional_items: new Map([["fake_item", 0.75]]),
      },
    ]);
  });
  it("knows about .object.place_items", () => {
    const given = new CddaData([
      ...["plain", "with_chance", "with_repeat"].map((s) => ({
        id: s + "_g",
        type: "item_group",
        subtype: "collection",
        items: [[s, 100]],
      })),
      {
        ...raw_mapgen_common,
        object: {
          place_items: [
            { item: "plain_g" },
            { item: "with_chance_g", chance: 50 },
            { item: "with_repeat_g", chance: 50, repeat: 2 },
          ],
        },
      },
    ]);

    const got = getAllMapgens(given);
    expect(got).toStrictEqual([
      {
        ...mapgen_common,
        additional_items: new Map([
          ["plain", 1],
          ["with_chance", 0.5],
          ["with_repeat", 0.75],
        ]),
      },
    ]);
  });
  it("knows about .object.place_loot", () => {
    const given = new CddaData([
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: [["fake_item", 50]],
      },
      {
        ...raw_mapgen_common,
        object: {
          place_loot: [
            { group: "fake_item_group" },
            { item: "plain" },
            { item: "with_chance", chance: 50 },
            { item: "with_repeat", chance: 50, repeat: 2 },
          ],
        },
      },
    ]);

    const got = getAllMapgens(given);

    expect(got).toStrictEqual([
      {
        ...mapgen_common,
        additional_items: new Map([
          ["fake_item", 0.5],
          ["plain", 1],
          ["with_chance", 0.5],
          ["with_repeat", 0.75],
        ]),
      },
    ]);
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

  it("knows about repeat in .items", () => {
    const data = new CddaData([
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: ["fake_item"],
      },
    ]);
    const rawPalette = {
      items: { X: { item: "fake_item_group", chance: 50, repeat: 2 } },
    };

    const got = parsePalette(data, rawPalette);

    expect(got).toStrictEqual(new Map([["X", new Map([["fake_item", 0.75]])]]));
  });
  it("knows anout .palettes", () => {
    const data = new CddaData([
      {
        type: "palette",
        id: "fake_palette",
        items: { X: { item: "fake_item_group" } },
      },
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: [["fake_item", 50]],
      },
    ]);
    const rawPalette = {
      palettes: ["fake_palette"],
      items: { X: { item: "fake_item_group" } },
    };

    const got = parsePalette(data, rawPalette);

    expect(got).toStrictEqual(new Map([["X", new Map([["fake_item", 0.75]])]]));
  });
  it("parses inline item group", () => {
    const data = new CddaData([]);
    const rawPalette = {
      items: {
        X: {
          item: {
            subtype: "collection" as "collection",
            items: [["fake_item", 50] as [string, number]],
          },
        },
      },
    };

    const got = parsePalette(data, rawPalette);
    expect(got).toStrictEqual(new Map([["X", new Map([["fake_item", 0.5]])]]));
  });
  it("parses inline item collections", () => {
    const data = new CddaData([]);
    const rawPalette = {
      items: {
        X: {
          item: [{ item: "fake_item" }],
        },
      },
    };
    const got = parsePalette(data, rawPalette);
    expect(got).toStrictEqual(new Map([["X", new Map([["fake_item", 1]])]]));
  });
  it("knows about .item", () => {
    const data = new CddaData([]);
    const rawPalette = {
      item: {
        X: { item: "i0", chance: 50, repeat: 2 },
        Y: [{ item: "i1" }, { item: "i2" }],
      },
    };
    const got = parsePalette(data, rawPalette);
    expect(got).toStrictEqual(
      new Map([
        ["X", new Map([["i0", 0.75]])],
        [
          "Y",
          new Map([
            ["i1", 1],
            ["i2", 1],
          ]),
        ],
      ])
    );
  });
  it("knows about .sealed_item.[].items", () => {
    const data = new CddaData([
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: ["fake_item"],
      },
    ]);
    const common = { items: { item: "fake_item_group" }, furniture: "fake" };
    const rawPalette = {
      sealed_item: {
        X: common,
        Y: { ...common, chance: 50 },
      },
    };

    const got = parsePalette(data, rawPalette);

    expect(got).toStrictEqual(
      new Map([
        ["X", new Map([["fake_item", 1]])],
        ["Y", new Map([["fake_item", 0.5]])],
      ])
    );
  });
  it("knows about .sealed_item | .[].items | {repeat, chance}", () => {
    const data = new CddaData([
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: ["fake_item"],
      },
    ]);
    const rawPalette = {
      sealed_item: {
        X: {
          items: { item: "fake_item_group", chance: 50, repeat: 2 },
          furniture: "fake",
        },
      },
    };

    const got = parsePalette(data, rawPalette);

    expect(got).toStrictEqual(new Map([["X", new Map([["fake_item", 0.75]])]]));
  });
  it("knows about .sealed_item | .[].item", () => {
    const data = new CddaData([]);
    const rawPalette = {
      sealed_item: {
        X: {
          item: { item: "fake_item" },
          furniture: "fake",
        },
        Y: {
          item: { item: "fake_item" },
          furniture: "fake",
          chance: 50,
        },
        Z: {
          item: { item: "fake_item", chance: 50 },
          furniture: "fake",
        },
        A: {
          item: { item: "fake_item", chance: 50, repeat: 2 },
          furniture: "fake",
        },
      },
    };

    const got = parsePalette(data, rawPalette);

    expect(got).toStrictEqual(
      new Map([
        ["X", new Map([["fake_item", 1]])],
        ["Y", new Map([["fake_item", 0.5]])],
        ["Z", new Map([["fake_item", 0.5]])],
        ["A", new Map([["fake_item", 0.75]])],
      ])
    );
  });
});

describe("repeatChance()", () => {
  it.each([1.0, 0.5])("repeats once (chance: %d)", (chance) => {
    expect(repeatChance(1, chance)).toBe(chance);
  });
  it.each([
    [2, 0.75],
    [3, 1 - 0.125],
  ])("repeats %d times", (repeat, expected) => {
    expect(repeatChance(repeat, 0.5)).toBe(expected);
  });
  it("handles repeat ranges", () => {
    expect(repeatChance([1, 2], 0.5)).toBe((0.5 + 0.75) / 2);
  });
  it("handles one-element ranges", () => {
    expect(repeatChance([2], 0.5)).toBe(0.75);
  });
  it.each([undefined, null])("handles %s repeat as 1", (nullish) => {
    expect(repeatChance(nullish, 0.5)).toBe(0.5);
  });
});
