export const hiddenMods = new Set([
  // These mods don't affect the data in the Guide at all, so hide them.
  "cbm_slots",
  "no_npc_food",
  "personal_portal_storms",
  "standard_combat_test",
  "stats_through_kills",
  "translate_dialogue",

  // MA isn't properly supported; we'd need to load all the map data and rework loot calcs to do it right.
  "MA",

  // This should probably be available, but it throws errors right now.
  "alt_map_key",
]);

export function isHiddenMod(id: string): boolean {
  return hiddenMods.has(id);
}

export function resolveModDependencies(
  mod: string,
  getModInfo: (id: string) => { dependencies?: string[] } | undefined,
): string[] {
  const result: string[] = [];
  const seen = new Set([mod, "dda"]);

  function visit(id: string) {
    if (seen.has(id)) return;
    seen.add(id);
    for (const dependency of getModInfo(id)?.dependencies ?? []) {
      visit(dependency);
    }
    result.push(id);
  }

  for (const dependency of getModInfo(mod)?.dependencies ?? []) {
    visit(dependency);
  }
  return result;
}
