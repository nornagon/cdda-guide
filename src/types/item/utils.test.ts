import { Maybe } from "./utils";

describe("Maybe(123)", () => {
  it("ignores the default", () => {
    const m = new Maybe(123);
    expect(m.getOrDefault(321)).toBe(123);
  })
})
