import { collection, getLootForMapgen, lootByOmSpecial, parsePalette, repeatChance } from "./spawnLocations";
import { CddaData } from "../../data";
import type {Mapgen, OvermapSpecial} from "../../types";

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

describe("nested mapgen", () => {
  it("reads place_nested", () => {
    const data = new CddaData([
      {
        "type": "mapgen",
        "method": "json",
        "om_terrain": "test_ter",
        "object": {
          "fill_ter": "t_floor",
          "rows": [],
          "place_nested": [
            { "chunks": [ "test_chunk" ], "x": 0, "y": 0 },
          ]
        }
      } as Mapgen,
      {
        "type": "mapgen",
        "method": "json",
        "nested_mapgen_id": "test_chunk",
        "object": {
          "mapgensize": [ 1, 1 ],
          "rows": [
            "L",
          ],
          "item": {
            "L": { "item": "test_item" }
          }
        }
      } as Mapgen,
    ])
    const loot = getLootForMapgen(data, data.byType("mapgen")[0])
    expect([...loot.entries()]).toEqual([["test_item", 1]])
  })

  it("handles chunk weights", () => {
    const data = new CddaData([
      {
        "type": "mapgen",
        "method": "json",
        "om_terrain": "test_ter",
        "object": {
          "fill_ter": "t_floor",
          "rows": [],
          "place_nested": [
            { "chunks": [ [ "test_chunk", 10 ], [ "test_chunk_2", 30 ] ], "x": 0, "y": 0 },
          ]
        }
      } as Mapgen,
      {
        "type": "mapgen",
        "method": "json",
        "nested_mapgen_id": "test_chunk",
        "object": {
          "mapgensize": [ 1, 1 ],
          "rows": [
            "L",
          ],
          "item": {
            "L": { "item": "test_item" }
          }
        }
      } as Mapgen,
      {
        "type": "mapgen",
        "method": "json",
        "nested_mapgen_id": "test_chunk_2",
        "object": {
          "mapgensize": [ 1, 1 ],
          "rows": [
            "L",
          ],
          "item": {
            "L": { "item": "test_item_2" }
          }
        }
      } as Mapgen,
    ])
    const loot = getLootForMapgen(data, data.byType("mapgen")[0])
    expect([...loot.entries()]).toEqual([["test_item", 0.25], ["test_item_2", 0.75]])
  })

  it("handles repeat", () => {
    const data = new CddaData([
      {
        "type": "mapgen",
        "method": "json",
        "om_terrain": "test_ter",
        "object": {
          "fill_ter": "t_floor",
          "rows": [],
          "place_nested": [
            { "chunks": [ "test_chunk" ], "x": 0, "y": 0, "repeat": 2 },
          ]
        }
      } as Mapgen,
      {
        "type": "mapgen",
        "method": "json",
        "nested_mapgen_id": "test_chunk",
        "object": {
          "mapgensize": [ 1, 1 ],
          "rows": [
            "L",
          ],
          "item": {
            "L": { "item": "test_item", "chance": 30 }
          }
        }
      } as Mapgen,
    ])
    const loot = getLootForMapgen(data, data.byType("mapgen")[0])
    expect([...loot.entries()]).toEqual([["test_item", 0.51]])
  })

  it.todo("handles repeat range")

  it("reads nested", () => {
    const data = new CddaData([
      {
        "type": "mapgen",
        "method": "json",
        "om_terrain": "test_ter",
        "object": {
          "fill_ter": "t_floor",
          "rows": [ "f" ],
          "nested": {
            "f": { "chunks": [ "test_chunk" ] },
          }
        }
      } as Mapgen,
      {
        "type": "mapgen",
        "method": "json",
        "nested_mapgen_id": "test_chunk",
        "object": {
          "mapgensize": [ 1, 1 ],
          "rows": [
            "L",
          ],
          "item": {
            "L": { "item": "test_item" }
          }
        }
      } as Mapgen,
    ])
    // NB, lootByOmSpecial is what handles mapgen offsets, so we have to call through that.
    const loot = getLootForMapgen(data, data.byType("mapgen")[0])
    expect([...loot.entries()]).toEqual([["test_item", 1]])
  })
})
