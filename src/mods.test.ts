import { expect, test } from "vitest";

import { resolveModDependencies } from "./mods";

test("resolves transitive mod dependencies in load order without dda", () => {
  const mods = {
    selected: { dependencies: ["middle", "dda"] },
    middle: { dependencies: ["first"] },
    first: { dependencies: ["dda"] },
  };

  expect(
    resolveModDependencies("selected", (id) => mods[id as keyof typeof mods]),
  ).toEqual(["first", "middle"]);
});

test("deduplicates dependencies and tolerates cycles", () => {
  const mods = {
    selected: { dependencies: ["first", "second"] },
    first: { dependencies: ["second"] },
    second: { dependencies: ["selected"] },
  };

  expect(
    resolveModDependencies("selected", (id) => mods[id as keyof typeof mods]),
  ).toEqual(["second", "first"]);
});
