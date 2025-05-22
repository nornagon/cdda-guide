/**
 * @jest-environment jsdom
 */
import { test, expect, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/svelte";

import { CddaData } from "./data";

import SearchResults from "./SearchResults.svelte";

let data: CddaData = new CddaData([
  { type: "MONSTER", id: "zombie", name: "zombie", symbol: "Z" },
  { type: "MONSTER", id: "zombie_child", name: "zombie child", symbol: "z" },
  { type: "BOOK", id: "ZSG", name: "Zombie Survival Guide", symbol: "?" },
  { type: "AMMO", id: "battery", name: "battery", symbol: "=" },
]);

afterEach(cleanup);

test("search results shows results", () => {
  const { container } = render(SearchResults, { data, search: "zombie" });
  expect(container.textContent).not.toMatch(/undefined|NaN|object Object/);
  expect(container.textContent).toMatch(/zombie/);
  expect(container.textContent).toMatch(/zombie child/);
  expect(container.textContent).toMatch(/Zombie Survival Guide/);
  expect(container.textContent).not.toMatch(/battery/);
});

test("search with <2 letters shows ...", () => {
  const { container } = render(SearchResults, { data, search: "z" });
  expect(container.textContent).not.toMatch(/undefined|NaN|object Object/);
  expect(container.textContent).toMatch(/\.\.\./);
});

test("search with no results shows 'no results'", () => {
  const { container } = render(SearchResults, {
    data,
    search: "zaoeusthhhahchsigdiypcgiybx",
  });
  expect(container.textContent).not.toMatch(/undefined|NaN|object Object/);
  expect(container.textContent).toMatch(/No results/);
});
