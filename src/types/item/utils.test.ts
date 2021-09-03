import { Maybe } from "./utils";

describe("Maybe.getOrDefault()", () => {
  it.each([
    [new Maybe(123), 123],
    [new Maybe(456), 456],
  ])("ignores the default when it already has a value", (given, expected) => {
    expect(given.getOrDefault(321)).toBe(expected);
  });
  it("returns the default when there is no value", () => {
    const given = new Maybe(undefined);
    expect(given.getOrDefault(321)).toBe(321);
  });
});
