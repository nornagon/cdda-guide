/**
 * @jest-environment jsdom
 */
import {
  collection,
  getFurnitureForMapgen,
  getLootForMapgen,
  parseItemGroup,
  parsePalette,
  repeatChance,
} from "./spawnLocations";
import { CddaData } from "../../data";
import type { ItemGroupData, Mapgen } from "../../types";
import { describe, it, expect } from "vitest";

const emptyData = new CddaData([]);

describe("collection()", () => {
  it("returns nothing given no items", () => {
    const got = collection([]);

    expect(got).toStrictEqual(new Map());
  });
  it("given one item, returns it", () => {
    const loot = new Map([["fake_item", { prob: 1.0, expected: 1 }]]);
    const given = [loot];

    const got = collection(given);

    expect(got).toStrictEqual(loot);
  });
  it("knowns about loot chance", () => {
    const given = [new Map([["fake_item", { prob: 0.5, expected: 0.5 }]])];

    const got = collection(given);

    expect(got).toStrictEqual(
      new Map([["fake_item", { prob: 0.5, expected: 0.5 }]]),
    );
  });
  it("can add up probabilities", () => {
    const item = new Map([["fake_item", { prob: 0.5, expected: 0.5 }]]);
    const given = [item, item];

    const got = collection(given);

    expect(got).toStrictEqual(
      new Map([["fake_item", { prob: 0.75, expected: 1 }]]),
    );
  });
});

describe("parseItemGroup()", () => {
  it("basic", () => {
    const got = parseItemGroup(
      emptyData,
      {
        subtype: "collection",
        items: [["test_pants_fur", 50]],
      },
      undefined,
      1,
    );

    expect(got).toStrictEqual(
      new Map([["test_pants_fur", { prob: 0.5, expected: 0.5 }]]),
    );
  });
  it("repeat", () => {
    const got = parseItemGroup(
      emptyData,
      {
        subtype: "collection",
        items: [["test_pants_fur", 50]],
      },
      2,
      1,
    );

    expect(got).toStrictEqual(
      new Map([["test_pants_fur", { prob: 0.75, expected: 1 }]]),
    );
  });
  it("repeat 2", () => {
    const data = new CddaData([
      {
        id: "fake_item_group",
        type: "item_group",
        subtype: "collection",
        items: ["fake_item"],
      },
    ]);
    const x = parseItemGroup(data, "fake_item_group", 2, 0.5);
    expect(x).toStrictEqual(
      new Map([["fake_item", { prob: 0.75, expected: 1 }]]),
    );
  });
});

describe("parsePalette()", () => {
  it("perses empty palette", () => {
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
      new Map([
        ["X", new Map([["test_pants_fur", { prob: 0.5, expected: 0.5 }]])],
      ]),
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

    expect(got).toStrictEqual(
      new Map([["X", new Map([["fake_item", { prob: 0.75, expected: 1 }]])]]),
    );
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
      new Map([
        ["X", new Map([["test_pants_fur", { prob: 0.25, expected: 0.25 }]])],
      ]),
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

    expect(got).toStrictEqual(
      new Map([["X", new Map([["fake_item", { prob: 0.75, expected: 1 }]])]]),
    );
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

    expect(got).toStrictEqual(
      new Map([["X", new Map([["fake_item", { prob: 0.75, expected: 1 }]])]]),
    );
  });
  it("parses inline item group", () => {
    const data = new CddaData([]);
    const rawPalette = {
      items: {
        X: {
          item: {
            subtype: "collection" as const,
            items: [["fake_item", 50] as [string, number]],
          },
        },
      },
    };

    const got = parsePalette(data, rawPalette);
    expect(got).toStrictEqual(
      new Map([["X", new Map([["fake_item", { prob: 0.5, expected: 0.5 }]])]]),
    );
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
    expect(got).toStrictEqual(
      new Map([["X", new Map([["fake_item", { prob: 1, expected: 1 }]])]]),
    );
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
        ["X", new Map([["i0", { prob: 0.75, expected: 1 }]])],
        [
          "Y",
          new Map([
            ["i1", { prob: 1, expected: 1 }],
            ["i2", { prob: 1, expected: 1 }],
          ]),
        ],
      ]),
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
        ["X", new Map([["fake_item", { prob: 1, expected: 1 }]])],
        ["Y", new Map([["fake_item", { prob: 0.5, expected: 0.5 }]])],
      ]),
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

    expect(got).toStrictEqual(
      new Map([["X", new Map([["fake_item", { prob: 0.75, expected: 1 }]])]]),
    );
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
        ["X", new Map([["fake_item", { prob: 1, expected: 1 }]])],
        ["Y", new Map([["fake_item", { prob: 0.5, expected: 0.5 }]])],
        ["Z", new Map([["fake_item", { prob: 0.5, expected: 0.5 }]])],
        ["A", new Map([["fake_item", { prob: 0.75, expected: 1 }]])],
      ]),
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
    expect(repeatChance(nullish as any, 0.5)).toBe(0.5);
  });
});

describe("loot", () => {
  it("place_loot", async () => {
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        om_terrain: "test_ter",
        object: {
          fill_ter: "t_floor",
          rows: [],
          place_loot: [
            { group: "test_group", x: 0, y: 0, repeat: 4, chance: 75 },
          ],
        },
      } as Mapgen,
      {
        type: "item_group",
        id: "test_group",
        items: [
          ["item_a", 50],
          ["item_b", 100],
        ],
      } as ItemGroupData,
    ]);
    const loot = getLootForMapgen(data, data.byType("mapgen")[0]);
    // prob for item_a:
    //   4x 75% chances for a 1/3 chance to spawn.
    //   = 4x (75%*1/3 = 25%) chances to spawn
    //   so prob(spawn) = 1-(1-25%)^4
    //   ~= 68%
    expect(loot.get("item_a")!.prob.toFixed(2)).toEqual("0.68");
    // expected for item_a:
    //   4x 75% chances for a 1/3 chance to spawn.
    //   e.v. for one chance = 75% * 1/3 = 0.25
    //   4x 0.25 = 1
    expect(loot.get("item_a")!.expected.toFixed(2)).toEqual("1.00");
    // prob for item_b:
    //   4x 75% chances for a 2/3 chance to spawn.
    //   = 4x 75%*2/3 = 50% chances to spawn
    //   so prob(spawn) = 1-(1-50%)^4
    //   ~= 93%
    expect(loot.get("item_b")!.prob.toFixed(2)).toEqual("0.94");
    // expected for item_b:
    //   4x 75% chances for a 2/3 chance to spawn.
    //   e.v. for one chance = 75% * 2/3 = 0.5
    //   4x 0.5 = 2
    expect(loot.get("item_b")!.expected.toFixed(2)).toEqual("2.00");
  });
});

describe("nested mapgen", () => {
  it("reads place_nested", async () => {
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        om_terrain: "test_ter",
        object: {
          fill_ter: "t_floor",
          rows: [],
          place_nested: [{ chunks: ["test_chunk"], x: 0, y: 0 }],
        },
      } as Mapgen,
      {
        type: "mapgen",
        method: "json",
        nested_mapgen_id: "test_chunk",
        object: {
          mapgensize: [1, 1],
          rows: ["L"],
          item: {
            L: { item: "test_item" },
          },
        },
      } as Mapgen,
    ]);
    const loot = await getLootForMapgen(data, data.byType("mapgen")[0]);
    expect([...loot.entries()]).toEqual([
      ["test_item", { prob: 1, expected: 1 }],
    ]);
  });

  it("handles chunk weights", async () => {
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        om_terrain: "test_ter",
        object: {
          fill_ter: "t_floor",
          rows: [],
          place_nested: [
            {
              chunks: [
                ["test_chunk", 10],
                ["test_chunk_2", 30],
              ],
              x: 0,
              y: 0,
            },
          ],
        },
      } as Mapgen,
      {
        type: "mapgen",
        method: "json",
        nested_mapgen_id: "test_chunk",
        object: {
          mapgensize: [1, 1],
          rows: ["L"],
          item: {
            L: { item: "test_item" },
          },
        },
      } as Mapgen,
      {
        type: "mapgen",
        method: "json",
        nested_mapgen_id: "test_chunk_2",
        object: {
          mapgensize: [1, 1],
          rows: ["L"],
          item: {
            L: { item: "test_item_2" },
          },
        },
      } as Mapgen,
    ]);
    const loot = await getLootForMapgen(data, data.byType("mapgen")[0]);
    expect([...loot.entries()]).toEqual([
      ["test_item", { prob: 0.25, expected: 0.25 }],
      ["test_item_2", { prob: 0.75, expected: 0.75 }],
    ]);
  });

  it("handles repeat", async () => {
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        om_terrain: "test_ter",
        object: {
          fill_ter: "t_floor",
          rows: [],
          place_nested: [{ chunks: ["test_chunk"], x: 0, y: 0, repeat: 2 }],
        },
      } as Mapgen,
      {
        type: "mapgen",
        method: "json",
        nested_mapgen_id: "test_chunk",
        object: {
          mapgensize: [1, 1],
          rows: ["L"],
          item: {
            L: { item: "test_item", chance: 30 },
          },
        },
      } as Mapgen,
    ]);
    const loot = await getLootForMapgen(data, data.byType("mapgen")[0]);
    expect([...loot.entries()]).toEqual([
      ["test_item", { prob: 0.51, expected: 0.6 }],
    ]);
  });

  it.todo("handles repeat range");

  it("reads nested", async () => {
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        om_terrain: "test_ter",
        object: {
          fill_ter: "t_floor",
          rows: ["f"],
          nested: {
            f: { chunks: ["test_chunk"] },
          },
        },
      } as Mapgen,
      {
        type: "mapgen",
        method: "json",
        nested_mapgen_id: "test_chunk",
        object: {
          mapgensize: [1, 1],
          rows: ["L"],
          item: {
            L: { item: "test_item" },
          },
        },
      } as Mapgen,
    ]);
    // NB, lootByOmSpecial is what handles mapgen offsets, so we have to call through that.
    const loot = await getLootForMapgen(data, data.byType("mapgen")[0]);
    expect([...loot.entries()]).toEqual([
      ["test_item", { prob: 1, expected: 1 }],
    ]);
  });
});

describe("furniture", () => {
  it("furniture", async () => {
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        om_terrain: "test_ter",
        object: {
          fill_ter: "t_floor",
          rows: ["."],
          furniture: {
            ".": "f_test_furn",
          },
        },
      } as Mapgen,
    ]);
    const loot = getFurnitureForMapgen(data, data.byType("mapgen")[0]);
    expect(loot.get("f_test_furn")).toEqual({ prob: 1, expected: 1 });
  });

  it("place_furniture", async () => {
    const data = new CddaData([
      {
        type: "mapgen",
        method: "json",
        om_terrain: "test_ter",
        object: {
          fill_ter: "t_floor",
          rows: ["."],
          place_furniture: [{ x: 0, y: 0, furn: "f_test_furn" }],
        },
      } as Mapgen,
    ]);
    const loot = getFurnitureForMapgen(data, data.byType("mapgen")[0]);
    expect(loot.get("f_test_furn")).toEqual({ prob: 1, expected: 1 });
  });
});
