import { CddaData } from "./data";
import { getLootForMapgen } from "./types/item/spawnLocations";

test("flattened item group includes container item for distribution", () => {
  const data = new CddaData([
    {
      type: "item_group",
      id: "foo",
      subtype: "distribution",
      entries: [
        { item: "contained_thing", prob: 5, "container-item": "container" },
        { item: "other_thing", prob: 10 },
      ],
    },
  ]);
  const flat = data.flattenItemGroup(data.byId("item_group", "foo"));
  expect(flat.map((x) => ({ ...x, prob: x.prob.toFixed(2) }))).toEqual([
    { id: "container", count: [1, 1], prob: "0.33" },
    { id: "contained_thing", count: [1, 1], prob: "0.33" },
    { id: "other_thing", count: [1, 1], prob: "0.67" },
  ]);
});

test("flattened item group includes container item for collection", () => {
  const data = new CddaData([
    {
      type: "item_group",
      id: "foo",
      subtype: "collection",
      entries: [
        { item: "contained_thing", prob: 5, "container-item": "container" },
        { item: "other_thing", prob: 10 },
      ],
    },
  ]);
  const flat = data.flattenItemGroup(data.byId("item_group", "foo"));
  expect(flat.map((x) => ({ ...x, prob: x.prob.toFixed(2) }))).toEqual([
    { id: "container", count: [1, 1], prob: "0.05" },
    { id: "contained_thing", count: [1, 1], prob: "0.05" },
    { id: "other_thing", count: [1, 1], prob: "0.10" },
  ]);
});

test("includes container item specified in item", () => {
  const data = new CddaData([
    {
      type: "item_group",
      id: "foo",
      subtype: "collection",
      entries: [{ item: "contained_thing", prob: 50 }],
    },
    {
      type: "COMESTIBLE",
      id: "contained_thing",
      container: "container",
    },
  ]);
  const flat = data.flattenItemGroup(data.byId("item_group", "foo"));
  expect(flat.map((x) => ({ ...x, prob: x.prob.toFixed(2) }))).toEqual([
    {
      count: [1, 1],
      id: "contained_thing",
      prob: "0.50",
    },
    {
      count: [1, 1],
      id: "container",
      prob: "0.50",
    },
  ]);
});

test("nested", () => {
  const data = new CddaData([
    {
      type: "item_group",
      id: "foo",
      subtype: "collection",
      entries: [
        {
          distribution: [
            {
              collection: [
                {
                  item: "water_clean",
                  charges: 1,
                  "container-item": "bottle_plastic",
                  prob: 50,
                },
                {
                  item: "water_clean",
                  "container-item": "bottle_plastic",
                  count: [1, 6],
                },
              ],
              prob: 90,
            },
            { collection: [], prob: 10 },
          ],
        },
      ],
    },
  ]);
  const flat = data.flattenItemGroup(data.byId("item_group", "foo"));
  expect(flat.map((x) => ({ ...x, prob: x.prob.toFixed(2) }))).toEqual([
    { id: "bottle_plastic", count: [2, 2], prob: "0.90" },
    { id: "water_clean", count: [2, 7], prob: "0.90" },
  ]);
});
