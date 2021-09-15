import { Maybe, multimap } from "./utils";

describe("Maybe.getOrDefault()", () => {
  it.each([
    [new Maybe(123), 123],
    [new Maybe(456), 456],
  ])("ignores the default when it already has a value", (given, expected) => {
    expect(given.getOrDefault(-100)).toBe(expected);
  });
  it.each([undefined, null])("returns the default when %p", (value) => {
    const given = new Maybe(value);
    expect(given.getOrDefault(321)).toBe(321);
  });
});

describe("Maybe.map()", () => {
  it("passes undefined forvard", () => {
    const given = new Maybe(undefined);

    const got = given.map(() => -100);

    expect(got.getOrDefault(123)).toBe(123);
    expect(got.getOrDefault(456)).toBe(456);
  });
  it.each([undefined, null])("does not call the callback if %p", (value) => {
    const given = new Maybe(value);
    const callback = jest.fn(() => 123);

    given.map(callback);

    expect(callback).toHaveBeenCalledTimes(0);
  });
  it.each([
    [() => 456, 456],
    [(n) => n * 2, 246],
  ])("transforms the value using the callback", (callback, expected) => {
    const given = new Maybe(123);

    const got = given.map(callback);

    expect(got.getOrDefault(-100)).toBe(expected);
  });
});

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
});
