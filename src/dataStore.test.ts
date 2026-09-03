import { get } from "svelte/store";
import { expect, test } from "vitest";

import { createDataStore } from "./data";

const dataFile = (version: string) => ({
  data: [{ type: "GENERIC", id: `item_${version}`, name: version }],
  build_number: version,
});

test("publishes a new CddaData when the version changes", async () => {
  const store = createDataStore({
    fetchData: async (version) => dataFile(version),
  });

  const first = await store.setVersion("first", null);
  const second = await store.setVersion("second", null);

  expect(first).not.toBe(second);
  expect(get(store)).toBe(second);
  expect(get(store)?.byIdMaybe("item", "item_first")).toBeUndefined();
  expect(get(store)?.byId("item", "item_second")).toMatchObject({
    id: "item_second",
    name: "second",
  });
});

test("does not publish an obsolete load that finishes late", async () => {
  const resolveLoad = new Map<
    string,
    (value: ReturnType<typeof dataFile>) => void
  >();
  const signals = new Map<string, AbortSignal>();
  const store = createDataStore({
    fetchData: (version, _progress, signal) =>
      new Promise((resolve) => {
        signals.set(version, signal);
        resolveLoad.set(version, resolve);
      }),
  });

  const first = store.setVersion("first", null);
  const second = store.setVersion("second", null);

  expect(signals.get("first")?.aborted).toBe(true);
  resolveLoad.get("second")!(dataFile("second"));
  await second;
  resolveLoad.get("first")!(dataFile("first"));
  await first;

  expect(get(store)?.build_number).toBe("second");
});

test("publishes a new snapshot when enabled mods change", async () => {
  const store = createDataStore({
    fetchData: async () => ({
      data: [{ type: "GENERIC", id: "test_item", name: "Base item" }],
      mods: {
        test_mod: { id: "test_mod", name: "Test Mod" },
      },
    }),
    fetchModData: async () => ({
      test_mod: {
        info: { id: "test_mod", name: "Test Mod" },
        data: [
          {
            type: "GENERIC",
            id: "test_item",
            "copy-from": "test_item",
            name: "Mod item",
          },
        ],
      },
    }),
  });

  const base = await store.setVersion("test", null);
  const modded = await store.setEnabledMods(["test_mod"]);

  expect(modded).not.toBe(base);
  expect((base?.byId("item", "test_item") as any).name).toBe("Base item");
  expect((modded?.byId("item", "test_item") as any).name).toBe("Mod item");
  expect(get(store)).toBe(modded);
});
