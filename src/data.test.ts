import { expect, test } from "vitest";
import {
  CddaData,
  countsByCharges,
  getAllObjectSources,
  singular,
} from "./data";
import type { ArmorSlot } from "./types";

test("flattened item group includes container item for distribution", () => {
  const data = new CddaData([
    {
      type: "item_group",
      id: "foo",
      subtype: "distribution",
      entries: [
        { item: "contained_thing", prob: 5, "container-item": "container" },
        { item: "other_thing", prob: 10 },
      ],
    },
  ]);
  const flat = data.flattenTopLevelItemGroup(data.byId("item_group", "foo"));
  expect(
    flat.map((x) => ({
      ...x,
      prob: x.prob.toFixed(2),
      expected: x.expected.toFixed(2),
    })),
  ).toEqual([
    { id: "container", count: [1, 1], prob: "0.33", expected: "0.33" },
    { id: "contained_thing", count: [1, 1], prob: "0.33", expected: "0.33" },
    { id: "other_thing", count: [1, 1], prob: "0.67", expected: "0.67" },
  ]);
});

test("monster whitelist criteria are combined like Cataclysm", () => {
  const data = new CddaData(
    [
      {
        type: "MONSTER",
        id: "mon_deer",
        name: "deer",
        categories: ["WILDLIFE"],
        species: ["MAMMAL"],
      },
    ],
    undefined,
    undefined,
    undefined,
    {
      aftershock_exoplanet: {
        info: { name: "Aftershock: Exoplanet" },
        data: [
          {
            type: "MONSTER_WHITELIST",
            mode: "EXCLUSIVE",
            categories: ["WILDLIFE", "MUTANT"],
            species: ["MOXIE", "ROBOT"],
          },
        ],
      },
      Tamable_Wildlife: {
        info: { name: "Tamable Wildlife" },
        data: [
          {
            type: "MONSTER",
            id: "mon_deer",
            "copy-from": "mon_deer",
            extend: { flags: ["PET_MOUNTABLE"] },
          },
        ],
      },
    },
    ["aftershock_exoplanet", "Tamable_Wildlife"],
  );

  const monsters = data.byType("monster");
  expect(monsters.map((monster) => monster.id)).toEqual(["mon_deer"]);
  expect(
    getAllObjectSources(monsters[0]).map((source) => source.__mod),
  ).toEqual(["dda", "Tamable_Wildlife"]);
});

test("mod interactions load after regular data and only with their target", () => {
  const base = [{ type: "GENERIC", id: "shared", name: "Base" }];
  const rawMods = {
    owner: {
      info: { name: "Owner" },
      data: [
        {
          type: "GENERIC",
          id: "shared",
          "copy-from": "shared",
          name: "Interaction",
          __filename:
            "data/mods/owner/mod_interactions/counterpart/items.json#L1-L7",
        },
        {
          type: "GENERIC",
          id: "shared",
          "copy-from": "shared",
          name: "Owner",
          __filename: "data/mods/owner/items.json#L1-L6",
        },
      ],
    },
    counterpart: {
      info: { name: "Counterpart" },
      data: [],
    },
  };

  const ownerOnly = new CddaData(
    base,
    undefined,
    undefined,
    undefined,
    rawMods,
    ["owner"],
  );
  const ownerItem = ownerOnly.byId("item", "shared");
  expect(singular((ownerItem as any).name)).toBe("Owner");
  expect(getAllObjectSources(ownerItem).map((source) => source.__mod)).toEqual([
    "dda",
    "owner",
  ]);

  const withCounterpart = new CddaData(
    base,
    undefined,
    undefined,
    undefined,
    rawMods,
    ["owner", "counterpart"],
  );
  const interactionItem = withCounterpart.byId("item", "shared");
  expect(singular((interactionItem as any).name)).toBe("Interaction");
  expect(
    getAllObjectSources(interactionItem).map((source) => source.__mod),
  ).toEqual(["dda", "owner", "owner"]);
});

test("same-name abstract overrides and concrete objects preserve inheritance", () => {
  const data = new CddaData([
    {
      type: "GENERIC",
      abstract: "base_item",
      name: "Base item",
      flags: ["BASE"],
    },
    {
      type: "GENERIC",
      abstract: "base_item",
      "copy-from": "base_item",
      extend: { flags: ["ABSTRACT_OVERRIDE"] },
    },
    {
      type: "GENERIC",
      id: "base_item",
      "copy-from": "base_item",
      extend: { flags: ["CONCRETE"] },
    },
  ]);

  expect(data.byId("item", "base_item")).toMatchObject({
    name: "Base item",
    flags: ["BASE", "ABSTRACT_OVERRIDE", "CONCRETE"],
  });
});

test("flattened item group includes container item for collection", () => {
  const data = new CddaData([
    {
      type: "item_group",
      id: "foo",
      subtype: "collection",
      entries: [
        { item: "contained_thing", prob: 5, "container-item": "container" },
        { item: "other_thing", prob: 10 },
      ],
    },
  ]);
  const flat = data.flattenTopLevelItemGroup(data.byId("item_group", "foo"));
  expect(flat.map((x) => ({ ...x, prob: x.prob.toFixed(2) }))).toEqual([
    { id: "container", count: [1, 1], prob: "0.05", expected: 0.05 },
    { id: "contained_thing", count: [1, 1], prob: "0.05", expected: 0.05 },
    { id: "other_thing", count: [1, 1], prob: "0.10", expected: 0.1 },
  ]);
});

test("includes container item specified in item", () => {
  const data = new CddaData([
    {
      type: "item_group",
      id: "foo",
      subtype: "collection",
      entries: [{ item: "contained_thing", prob: 50 }],
    },
    {
      type: "COMESTIBLE",
      id: "contained_thing",
      container: "container",
    },
  ]);
  const flat = data.flattenTopLevelItemGroup(data.byId("item_group", "foo"));
  expect(flat.map((x) => ({ ...x, prob: x.prob.toFixed(2) }))).toEqual([
    {
      count: [1, 1],
      id: "contained_thing",
      prob: "0.50",
      expected: 0.5,
    },
    {
      count: [1, 1],
      id: "container",
      prob: "0.50",
      expected: 0.5,
    },
  ]);
});

test("replace_materials does not mutate inherited armor data", () => {
  const data = new CddaData([
    {
      type: "ITEM",
      subtypes: ["ARMOR"],
      abstract: "base_chainmail_vest",
      material: ["steel"],
      armor: [
        {
          material: [{ type: "steel", covered_by_mat: 100, thickness: 1.2 }],
          covers: ["torso"],
          coverage: 100,
          encumbrance: 14,
        },
      ],
    },
    {
      type: "ITEM",
      subtypes: ["ARMOR"],
      id: "lc_chainmail_vest",
      "copy-from": "base_chainmail_vest",
      replace_materials: { steel: "lc_steel_chain" },
    },
    {
      type: "ITEM",
      subtypes: ["ARMOR"],
      id: "qt_chainmail_vest",
      "copy-from": "base_chainmail_vest",
      replace_materials: { steel: "qt_steel_chain" },
    },
  ]);

  expect(
    (data.byId("item", "lc_chainmail_vest") as ArmorSlot).armor?.[0].material,
  ).toEqual([{ type: "lc_steel_chain", covered_by_mat: 100, thickness: 1.2 }]);
  expect(
    (data.byId("item", "qt_chainmail_vest") as ArmorSlot).armor?.[0].material,
  ).toEqual([{ type: "qt_steel_chain", covered_by_mat: 100, thickness: 1.2 }]);
});

test("proportional encumbrance scales inherited armor portion encumbrance", () => {
  const data = new CddaData([
    {
      type: "ITEM",
      subtypes: ["ARMOR"],
      abstract: "base_boots",
      armor: [
        {
          covers: ["foot_l", "foot_r"],
          coverage: 95,
          encumbrance: 4,
        },
        {
          covers: ["leg_l", "leg_r"],
          coverage: 20,
          encumbrance: [1, 3],
        },
      ],
    },
    {
      type: "ITEM",
      subtypes: ["ARMOR"],
      id: "boots_western",
      "copy-from": "base_boots",
      proportional: { encumbrance: 2 },
    },
  ]);

  expect((data.byId("item", "boots_western") as ArmorSlot).armor).toMatchObject(
    [{ encumbrance: 8 }, { encumbrance: [2, 6] }],
  );
  expect(
    (data.abstractById("item", "base_boots") as ArmorSlot).armor,
  ).toMatchObject([{ encumbrance: 4 }, { encumbrance: [1, 3] }]);
});

test("nested", () => {
  const data = new CddaData([
    {
      type: "COMESTIBLE",
      id: "water_clean",
    },
    {
      type: "item_group",
      id: "foo",
      subtype: "collection",
      entries: [
        {
          distribution: [
            {
              collection: [
                {
                  item: "water_clean",
                  charges: 1,
                  "container-item": "bottle_plastic",
                  prob: 50,
                },
                {
                  item: "water_clean",
                  "container-item": "bottle_plastic",
                  count: [1, 6],
                },
              ],
              prob: 90,
            },
            { collection: [], prob: 10 },
          ],
        },
      ],
    },
  ]);
  const flat = data.flattenTopLevelItemGroup(data.byId("item_group", "foo"));
  expect(flat.map((x) => ({ ...x, prob: x.prob.toFixed(2) }))).toEqual([
    { id: "bottle_plastic", count: [2, 2], prob: "0.90", expected: 1.8 },
    { id: "water_clean", count: [2, 7], prob: "0.90", expected: 4.05 },
  ]);
});

test("countsByCharges matches Cataclysm rules", () => {
  expect(countsByCharges({ type: "AMMO" })).toBe(true);
  expect(countsByCharges({ type: "COMESTIBLE", phase: "liquid" })).toBe(true);
  expect(countsByCharges({ type: "COMESTIBLE", phase: "plasma" })).toBe(true);
  expect(countsByCharges({ type: "COMESTIBLE" })).toBe(false);
  expect(countsByCharges({ type: "COMESTIBLE", phase: "solid" })).toBe(false);
  expect(countsByCharges({ type: "GENERIC", stackable: true })).toBe(true);
});

test("singular preserves CDDA string_format placeholders", () => {
  expect(singular("The %1$s has shattered.")).toBe("The %1$s has shattered.");
});

const damageTypesForTests = [
  { type: "damage_type", id: "bash", name: "bash", physical: true },
  { type: "damage_type", id: "cut", name: "cut", physical: true },
  {
    type: "damage_type",
    id: "stab",
    name: "stab",
    physical: true,
    derived_from: ["cut", 0.8],
  },
  { type: "damage_type", id: "bullet", name: "bullet", physical: true },
  {
    type: "damage_type",
    id: "acid",
    name: "acid",
    physical: false,
    derived_from: ["cut", 0.5],
  },
  { type: "damage_type", id: "electric", name: "electric", physical: false },
];

test("relative melee_damage on a monster leaves the default multipliers alone", () => {
  const data = new CddaData([
    ...damageTypesForTests,
    {
      type: "MONSTER",
      id: "base",
      melee_damage: [{ damage_type: "cut", amount: 2 }],
    },
    {
      type: "MONSTER",
      id: "child",
      "copy-from": "base",
      relative: { melee_damage: { damage_type: "cut", amount: 2 } },
    },
  ]);
  const child = data.byId("monster", "child") as any;
  // As in damage_instance::operator+=, the multipliers stay at their default
  // of 1 (here: unset), so total damage is 4, not 0.
  expect(child.melee_damage).toEqual([
    { damage_type: "cut", amount: 4, armor_penetration: 0 },
  ]);
});

test("monster armor derives stab/acid from the armor as written, before relative/proportional", () => {
  const data = new CddaData([
    ...damageTypesForTests,
    { type: "MONSTER", id: "crayfish", armor: { cut: 8, bullet: 6 } },
    {
      type: "MONSTER",
      id: "crayfish_mega",
      "copy-from": "crayfish",
      proportional: { armor: { cut: 2, bullet: 2 } },
    },
    { type: "MONSTER", id: "dog", armor: { electric: 1 } },
    {
      type: "MONSTER",
      id: "dog_brute",
      "copy-from": "dog",
      relative: { armor: { bash: 4, cut: 6, bullet: 5, electric: 1 } },
    },
    {
      type: "MONSTER",
      id: "explicit_zero",
      armor: { bash: 28, cut: 35, acid: 0, bullet: 40 },
    },
  ]);
  expect((data.byId("monster", "crayfish") as any).armor).toEqual({
    cut: 8,
    bullet: 6,
    stab: 6.4,
    acid: 4,
  });
  // Derivation happens before the proportional adjustment (finalize_mtypes).
  expect((data.byId("monster", "crayfish_mega") as any).armor).toEqual({
    cut: 16,
    bullet: 12,
    stab: 6.4,
    acid: 4,
  });
  // ...and before the relative adjustment, so a relative cut adds no stab.
  expect((data.byId("monster", "dog_brute") as any).armor).toEqual({
    bash: 4,
    cut: 6,
    bullet: 5,
    electric: 2,
  });
  // An explicit 0 is not "missing" and is never derived.
  expect((data.byId("monster", "explicit_zero") as any).armor).toEqual({
    bash: 28,
    cut: 35,
    bullet: 40,
    stab: 28,
  });
});

test("monster relative armor is not inherited, and applies without a base armor", () => {
  const data = new CddaData([
    ...damageTypesForTests,
    { type: "MONSTER", id: "zombie", armor: { electric: 1 } },
    {
      type: "MONSTER",
      id: "fungalize",
      "copy-from": "zombie",
      relative: { armor: { bash: 1, electric: 2 } },
    },
    {
      type: "MONSTER",
      id: "fungus",
      "copy-from": "fungalize",
      relative: { armor: { bash: 1, electric: 2 } },
    },
    { type: "MONSTER", id: "raptor" },
    {
      type: "MONSTER",
      id: "raptor_fungalize",
      "copy-from": "raptor",
      relative: { armor: { bash: 1, electric: 2 } },
    },
    {
      type: "MONSTER",
      id: "silverfish_small",
      "copy-from": "zombie",
      proportional: { armor: 0.45 },
    },
  ]);
  expect((data.byId("monster", "fungalize") as any).armor).toEqual({
    bash: 1,
    electric: 3,
  });
  // mtype::load resets armor_relative, so the parent's +1/+2 is not applied again.
  expect((data.byId("monster", "fungus") as any).armor).toEqual({
    bash: 1,
    electric: 3,
  });
  expect((data.byId("monster", "raptor") as any).armor).toBeUndefined();
  expect((data.byId("monster", "raptor_fungalize") as any).armor).toEqual({
    bash: 1,
    electric: 2,
  });
  // A non-object proportional armor is ignored by the game.
  expect((data.byId("monster", "silverfish_small") as any).armor).toEqual({
    electric: 1,
  });
});

test("relative/proportional on unset monster fields start from the game defaults", () => {
  const data = new CddaData([
    { type: "MONSTER", id: "base", hp: 10 },
    {
      type: "MONSTER",
      id: "brute",
      "copy-from": "base",
      relative: { vision_night: 1 },
      proportional: { hp: 1.5, attack_cost: 1.5 },
    },
  ]);
  const brute = data.byId("monster", "brute") as any;
  expect(brute.hp).toBe(15);
  expect(brute.attack_cost).toBe(150);
  expect(brute.vision_night).toBe(2);
});
