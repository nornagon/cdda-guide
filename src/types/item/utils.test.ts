import { describe, it, expect } from "vitest";
import { multimap } from "./utils";

describe("multimap()", () => {
  it("correcty handles empty input", () => {
    expect(multimap([])).toStrictEqual(new Map());
  });
  it("collects entries into a map", () => {
    expect(
      multimap([
        ["k1", "v1"],
        ["k2", "v2"],
      ])
    ).toStrictEqual(
      new Map([
        ["k1", ["v1"]],
        ["k2", ["v2"]],
      ])
    );
  });
  it("collects multiple entries", () => {
    expect(
      multimap([
        ["k", "v1"],
        ["k", "v2"],
      ])
    ).toStrictEqual(new Map([["k", ["v1", "v2"]]]));
  });
});
