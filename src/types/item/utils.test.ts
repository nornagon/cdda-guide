import { Maybe } from "./utils";

describe("Maybe.getOrDefault()", () => {
  it.each([
    [new Maybe(123), 123],
    [new Maybe(456), 456],
  ])("ignores the default when it already has a value", (given, expected) => {
    expect(given.getOrDefault(-100)).toBe(expected);
  });
  it("returns the default when there is no value", () => {
    const given = new Maybe(undefined);
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
  it("does not call the callback if empty", () => {
    const given = new Maybe(undefined);
    const callback = jest.fn(() => 123);

    given.map(callback);

    expect(callback).toHaveBeenCalledTimes(0);
  });
  it("transforms the value using callback", () => {
    const given = new Maybe(123);

    const got = given.map(() => 456);

    expect(got.getOrDefault(-100)).toBe(456);
  });
});
