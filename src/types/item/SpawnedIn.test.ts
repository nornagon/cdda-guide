import "@testing-library/jest-dom";
import { render } from "@testing-library/svelte";
import SpawnedIn from "./SpawnedIn.svelte";
import WithData from "../../WithData.svelte";
import { getItemSpawnLocations } from "../../data";

jest.mock("../../data");

describe("the loot section", () => {
  it("displays the name of the spawn location and chance", () => {
    const spawnLocations = [{ singularName: "fake place", chance: 0.5 }];
    (getItemSpawnLocations as jest.Mock).mockReturnValue(spawnLocations);
    const item_id = "fake_item";

    const { getByText } = render(WithData, { Component: SpawnedIn, item_id });

    expect(getByText(/fake place/)).toBeInTheDocument();
    expect(getByText(/50.00%/)).toBeInTheDocument();
  });
});
//getItemSpawnLocations
