/**
 * @jest-environment jsdom
 */
import { render, cleanup } from "@testing-library/svelte";
import { describe, it, expect, afterEach } from "vitest";

import AmmunitionType from "./AmmunitionType.svelte";
import WithData from "../WithData.svelte";
import { CddaData } from "../data";

afterEach(cleanup);

describe("AmmunitionType compatible variants", () => {
  it("lists ammo items that share the ammo_type", () => {
    const data = new CddaData([
      { type: "ammunition_type", id: "22", name: "22", default: "22_lr" },
      {
        type: "ITEM",
        id: "22_lr",
        name: ".22 LR",
        subtypes: ["AMMO"],
        ammo_type: "22",
      },
      {
        type: "ITEM",
        id: "22_hp",
        name: ".22 HP",
        subtypes: ["AMMO"],
        ammo_type: "22",
      },
      {
        type: "AMMO",
        id: "22_sp",
        name: ".22 SP",
        ammo_type: "22",
      },
      {
        type: "ITEM",
        id: "dummy_mag",
        name: "dummy mag",
        subtypes: ["MAGAZINE"],
        ammo_type: "22",
      },
    ]);

    const { getByText, queryByText } = render(WithData, {
      Component: AmmunitionType,
      item: data.byId("ammunition_type", "22"),
      data,
    });

    expect(getByText(/\.22 LR/)).toBeTruthy();
    expect(getByText(/\.22 HP/)).toBeTruthy();
    expect(getByText(/\.22 SP/)).toBeTruthy();
    expect(queryByText(/dummy mag/)).toBeNull();
  });
});
