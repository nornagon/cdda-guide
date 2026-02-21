// Centralised list of spoilery / visually-noisy content that is hidden by default.  Add new entries as needed.  Everything here is bypassed when the URL contains ?hideNothing.

const showAll = new URL(location.href).searchParams.has("hideNothing");

const SPOILER_PREFIXES: ReadonlySet<string> = new Set([
  "f_vitrified_",
  "f_glassedbody_",
  "t_vitrified_",
  "black_glass_",
  "imperfect_doll_",
]);

const SPOILER_IDS: ReadonlySet<string> = new Set(["mon_dragon_dummy"]);

const SPOILER_SUFFIXES: ReadonlySet<string> = new Set(["_vitrified"]);

export function isSpoilerItem(id: string): boolean {
  if (showAll) return false;
  if (SPOILER_IDS.has(id)) return true;
  for (const prefix of SPOILER_PREFIXES) {
    if (id.startsWith(prefix)) return true;
  }
  for (const suffix of SPOILER_SUFFIXES) {
    if (id.endsWith(suffix)) return true;
  }
  return false;
}

export const HIDDEN_LOOT_LOCATIONS: ReadonlySet<string> = new Set(
  showAll
    ? []
    : [
        "Necropolis",
        "Isherwood Farms",
        "lab_mutagen_6_level",
        "Lab_SECURITY_1x1x6",
        "Lab_CARGO_Surface",
        "hub_01",
        "aircraft_carrier",
        "airliner_crashed",
        "farm_abandoned",
        "ranch_camp",
        "exodii_base",
        "Central Lab",
        "4x4_microlab_vent_shaft",
        "lab_subway_vent_shaft",
        "mil_base",
        "valhalla_cult",
        "nuclear power plant",
        "tutorial",
        "debug_item_group_test",
        "gas station bunker",
        "bunker shop",
        "physics_lab_LIXA",
        "office_tower_hiddenlab",
      ]
);
