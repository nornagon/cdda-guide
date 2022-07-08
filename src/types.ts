type integer = number;
type volume = number | string;
type mass = number | string;
type duration = number | string;
type energy = number | string;

export type Translation =
  | string
  | { str: string; str_pl?: string }
  | { str_sp: string };

export type ItemGroupEntry = (
  | { item: string }
  | { group: string }
  | { distribution: ItemGroupEntry[] }
  | { collection: ItemGroupEntry[] }
) & {
  prob?: number;
  count?: number | [number, number];
  charges?: number | [number, number];
  // TODO: damage, dirt, charges, ammo, container, contents, snippets?, sealed, custom-flags
};

export type ItemGroupEntryOrShortcut = ItemGroupEntry | [string, number]; // item_id, prob (or item_group_id, prob if in 'groups' array)

export type ItemGroup =
  | {
      subtype: "collection" | "distribution";
      entries?: ItemGroupEntryOrShortcut[];
      items?: (string /* item_id with prob=100 */ | ItemGroupEntryOrShortcut)[];
      groups?: (
        | string /* item_group_id with prob=100 */
        | ItemGroupEntryOrShortcut
      )[];
      "container-item"?: string;
      // TODO: on_overflow
    }
  | {
      subtype?: "old"; // ~= "distribution"
      items?: ItemGroupEntryOrShortcut[];
    };

export type Construction = {
  type: "construction";
  id: string;
  group: string; // construction_group_id
  required_skills?: [string /* skill_id */, number /* level */][];

  // legacy, superceded by required_skills
  skill?: string;
  difficulty?: number;

  category?: string; // construction_category_id, default: OTHER
  time?: string | number /* minutes */;

  using?:
    | string
    | (
        | [string /* requirement_id */, number /* count */]
        | [string, number, "LIST"]
      )[];
  pre_note?: string;

  pre_terrain?: string; // if starts with f_, then furniture_id, else terrain_id
  post_terrain?: string; // as above

  pre_flags?:
    | string
    | string[]
    | { flag: string; force_terrain: boolean }
    | { flag: string; force_terrain: boolean }[];
  post_flags?: string[];

  byproducts?: string | ItemGroup | ItemGroupEntry[]; // subtype collection

  pre_special?: string;
  post_special?: string;
  explain_failure?: string;

  vehicle_start?: boolean;
  on_display?: boolean; // default: true
  dark_craftable?: boolean;
} & RequirementData;

export type ItemComponent =
  | [string /* item_id */, number /* count */, "LIST" | "NO_RECOVER"]
  | [string, number];
export type QualityRequirement = {
  id: string;
  level?: number; // default: 1
  amount?: number; // default: 1
};
export type ToolComponent =
  | string
  | [string, number]
  | [string, number, "LIST"];

export type Requirement = {
  id: string;
  type: "requirement";
} & RequirementData;

export type RequirementData = {
  components?: (ItemComponent | ItemComponent[])[];
  qualities?: (QualityRequirement | QualityRequirement[])[];
  tools?: (ToolComponent | ToolComponent[])[];
};

export type Recipe = {
  result?: string;
  abstract?: string; // mutex with result
  type: "recipe" | "uncraft";

  id_suffix?: string; // only for type 'recipe'. not allowed for abstracts
  obsolete?: boolean;

  time?: number /* moves */ | string /* duration */;
  difficulty?: number; // default: 0
  flags?: string[];

  contained?: boolean;
  container?: string /* item_id, implies contained */;
  sealed?: boolean;

  batch_time_factors?: [number /* int */, number /* int */]; // [rscale (percentage), rsize]

  charges?: number; // int, no default
  result_mult?: number; // int, default: 1

  skill_used?: string; // skill_id

  skills_required?: [string, number] | [string, number][]; // skill_id, level

  proficiencies?: {
    proficiency: string; // proficiency_id
    required?: boolean;
    time_multiplier?: number; // default to proficiency multiplier
    fail_multiplier?: number; // default to proficiency multiplier
    learning_time_multiplier?: number; // default 1.0
    max_experience?: duration;
  }[];
  autolearn?: boolean | [string, number][];
  never_learn?: boolean;
  decomp_learn?: number | [string, number][];
  book_learn?:
    | ([string] | [string, number])[]
    | Record<
        string,
        { skill_level?: number; recipe_name?: string; hidden?: boolean }
      >;

  activity_level?: string;

  delete_flags?: string[]; // flag_id
  using?: string | ([string, number] | [string, number, "LIST"])[]; // requirement_id

  // for type: 'recipe' only
  category?: string;
  subcategory?: string;
  description?: string;
  reversible?: boolean | { time: duration };
  byproducts?: ([string] | [string, number])[];
  // TODO: construction_blueprint
  construction_blueprint?: any;
} & RequirementData;

export type BookProficiencyBonus = {
  proficiency: string; // proficiency_id
  fail_factor?: number; // default: 0.5
  time_factor?: number; // default: 0.5
  include_prereqs?: boolean; // default: true
};
export type BookSlot = {
  max_level?: number; // default: 0
  required_level?: number; // default: 0
  fun?: number; // default: 0
  intelligence?: number; // default: 0

  time?: number /* mins */ | string /* duration */;

  skill?: string; // skill_id
  martial_art?: string; // matype_id
  chapters?: number; // default: 0
  proficiencies?: BookProficiencyBonus[];
};

export type ToolSlot = {
  ammo?: string | string[];
  max_charges?: integer;
  initial_charges?: integer;
  charges_per_use?: integer;
  charge_factor?: integer; // default 1
  turns_per_charge?: integer;
  power_draw?: integer;
  revert_to?: string; // item_id
  sub?: string; // item_id
  rand_charges?: integer[];
};

export type DamageType =
  | "pure"
  | "biological"
  | "bash"
  | "cut"
  | "acid"
  | "stab"
  | "bullet"
  | "heat"
  | "cold"
  | "electric";

export type DamageUnit = {
  damage_type: DamageType;
  amount?: number; // float, default 0
  armor_penetration?: number; // float, default 0
  armor_multiplier?: number; // float, default 1
  damage_multiplier?: number; // float, default 1
  constant_armor_multiplier?: number; // float, default 1
  constant_damage_multiplier?: number; // float, default 1
};
export type DamageInstance =
  | DamageUnit[]
  | { values: DamageUnit[] }
  | DamageUnit;

export type GunSlot = {
  skill: string; // skill_id
  ammo?: string | string[]; // ammunition_type_id
  range?: number; // int
  ranged_damage?: DamageInstance;
  dispersion?: number; // int
  sight_dispersion?: number; // int, default: 30
  recoil?: number; // int
  handling?: number; // int, default: derived from weapon type. if skill_used is rifle, smg or shotgun, 20, otherwise 10.
  durability?: number; // int
  burst?: number; // int, default: 0
  loudness?: number; // int, default: 0
  clip_size?: number; // int
  reload?: number; // int moves, default 100
  reload_noise?: Translation; // default "click."
  reload_noise_volume?: number; // int, default: 0
  barrel_volume?: string; // volume, default: 0 ml
  built_in_mods?: string[]; // item_id
  default_mods?: string[]; // item_id
  ups_charges?: number; // int
  blackpowder_tolerance?: number; // int, default: 8
  min_cycle_recoil?: number; // int, default: 0
  ammo_effects?: string[];
  ammo_to_fire?: number; // int, default: 1

  valid_mod_locations?: [string, number][]; // [gunmod_location, count]

  modes?: (
    | [string, string, number]
    | [string, string, number, string[] | string]
  )[];
};

export type AmmoSlot = {
  ammo_type: string; // ammunition_type_id
  casing?: string; // item_id
  drop?: string; // item_id
  drop_chance?: number; // float, default: 1
  drop_active?: boolean; // default: true
  damage?: DamageInstance;
  range?: number; // int
  dispersion?: number; // int
  recoil?: number; // int
  count?: number; // int, default 1
  loudness?: number; // int, default derived
  effects?: string[];
  critical_multiplier?: number; // float, default: 2
  show_stats?: boolean;
};

export type ComestibleSlot = {
  comestible_type?: string; // DRINK, FOOD or MED
  tool?: string; // item_id, needed to consume
  charges?: integer; // int, default 1
  quench?: integer; // int, default 0
  fun?: integer; // int, default 0
  stim?: integer; // int, default 0
  fatigue_mod?: integer; // int, default 0
  healthy?: integer; // int, default 0
  parasites?: integer; // int, default 0
  radiation?: integer; // int, default 0
  freezing_point?: number; // float, default 32
  spoils_in?: string | number; // duration, default 0 (never spoils)
  cooks_like?: string; // item_id
  smoking_result?: string; // item_id
  contamination?: {
    disease: string /* diseasetype_id */;
    probability: number /* int */;
  }[];
  primary_material?: string; // material_id
  monotony_penalty?: number; // default 2 unless material is junk, in which case 0
  addiction_type?: string;
  addiction_potential?: number; // int, default 0
  calories?: number; // int
  vitamins?: [string, number /* int */][];
  rot_spawn?: string; // mongroup_id
  rot_spawn_chance?: number; // int, default 10
};

export type ArmorPortionData = {
  encumbrance?: integer | [integer, integer];
  coverage?: integer;
  cover_melee?: integer; // default = coverage
  cover_ranged?: integer; // default = coverage
  cover_vitals?: integer; // default 0
  covers?: string[]; // bp_id
  specifically_covers?: string[]; // sub_bodypart_str_id
  sided?: boolean;
  material_thickness?: number; // default to parent thickness
  environmental_protection?: integer; // default 0
  environmental_protection_with_filter?: integer;
  volume_encumber_modifier?: number; // default 1

  material?: PartMaterial[] | string[];

  layers?: LayerLevel[];
};

export type PartMaterial = {
  type: string; // material_id
  covered_by_mat?: integer; // %, default 100
  thickness?: number; // default 0
};

export type LayerLevel =
  | "PERSONAL"
  | "SKINTIGHT"
  | "NORMAL"
  | "WAIST"
  | "OUTER"
  | "BELTED"
  | "AURA";

export type ArmorSlot = {
  covers?: string[];
  armor?: ArmorPortionData[];
  sided?: boolean;
  flags?: string[];
  warmth?: number;
  encumbrance?: number;
  max_encumbrance?: number;
  coverage?: number;
  environmental_protection?: number;
  environmental_protection_with_filter?: number;
  material_thickness?: number;
};

export type BionicSlot = {
  bionic_id?: string;
  difficulty?: integer;
  is_upgrade?: boolean;
  installation_data?: string;
};

export type EngineSlot = {
  displacement?: number;
};

export type WheelSlot = {
  diameter: integer;
  width: integer;
};

export type UseFunction = {
  type: string;
};

export type ItemBasicInfo = {
  id: string;
  category?: string; // item_category_id
  color?: string;
  symbol?: string;
  description?: Translation;
  qualities?: [string, number][];
  charged_qualities?: [string, number][];
  stackable?: boolean;
  volume?: volume;
  weight?: mass;
  longest_side?: string;
  material?: string | string[] | { type: string; portion?: integer }[]; // material_id
  flags?: string[];
  faults?: string[];
  pocket_data?: PocketData[];
  container?:
    | string
    | null
    | any /* this is to appease json-schema, which doesn't generate a correct schema for just string | null */;
  bashing?: number;
  cutting?: number;
  min_strength?: number;
  techniques?: string[];
  to_hit?:
    | number
    | { grip?: string; length?: string; surface?: string; balance?: string };
  seed_data?: {
    grow?: string; // duration, default 1 day
    plant_name: Translation;
    fruit: string; // item_id
    fruit_div?: number; // int (NB. only used for pumpkin?)
    seeds?: boolean; // default true (NB. never present in json)
    byproducts?: string[]; // item_id
  };
  ascii_picture?: string;
  weapon_category?: string[]; // weapon_category_id
  use_action?:
    | string
    | UseFunction
    | (string | UseFunction | [string] | [string, number])[];
};

export type Item =
  | SupportedTypes["AMMO"]
  | SupportedTypes["ARMOR"]
  | SupportedTypes["BATTERY"]
  | SupportedTypes["BIONIC_ITEM"]
  | SupportedTypes["BOOK"]
  | SupportedTypes["COMESTIBLE"]
  | SupportedTypes["ENGINE"]
  | SupportedTypes["GENERIC"]
  | SupportedTypes["GUN"]
  | SupportedTypes["GUNMOD"]
  | SupportedTypes["MAGAZINE"]
  | SupportedTypes["PET_ARMOR"]
  | SupportedTypes["TOOL"]
  | SupportedTypes["TOOLMOD"]
  | SupportedTypes["TOOL_ARMOR"]
  | SupportedTypes["WHEEL"];

export type PocketData = {
  pocket_type?: string;
  ammo_restriction?: Record<string, number>;
  item_restriction?: Array<string>;
  allowed_speedloaders?: Array<string>;
  min_item_volume?: string;
  max_item_volume?: string;
  max_contains_volume?: string;
  max_contains_weight?: string;
  max_item_length?: string;
  spoil_multiplier?: number; // float
  weight_multiplier?: number; // float
  volume_multiplier?: number; // float
  magazine_well?: string; // volume
  moves?: number;
  fire_protection?: boolean;
  watertight?: boolean;
  airtight?: boolean;
  open_container?: boolean;
  flag_restriction?: Array<string>;
  rigid?: boolean;
  holster?: boolean;
  sealed_data?: { spoil_multiplier?: number };
};

export type MendingMethod = {
  id: string;
  name?: Translation;
  description?: Translation;
  success_msg: Translation;
  time: string; // duration
  skills: { id: string; level: number }[];
  requirements: string | Omit<Requirement, "id" | "type">;
  turns_into?: string; // fault_id
  also_mends?: string; // fault_id
};

export type Fault = {
  type: "fault";
  id: string;
  name: Translation;
  description: Translation;

  mending_methods?: MendingMethod[];

  flags?: string[];
};

export type JsonFlag = {
  type: "json_flag";
  id: string;

  info?: string;
  conflicts?: string[];
  inherit?: boolean; // default: true
  craft_inherit?: boolean; // default: false
  requires_flag?: string;
  taste_mod?: number; // default: 0
};

export type MapBashInfo = {
  str_min?: number; // default: 0
  str_max?: number; // default: 0
  str_min_blocked?: number; // default: -1
  str_max_blocked?: number; // default: -1
  str_min_supported?: number; // default: -1
  str_max_supported?: number; // default: -1
  explosive?: number; // default: -1
  sound_vol?: number; // default: -1
  sound_fail_vol?: number; // default: -1
  collapse_radius?: number; // default: 1
  destroy_only?: boolean; // default: false
  bash_below?: boolean; // default: false

  // TODO:
  // sound
  // sound_fail
  // ter_set
  // move_cost
  furn_set?: string;

  items?: string | ItemGroupEntry[];

  // tent_centers
};

export type MapDeconstructInfo = {
  furn_set?: string; // default: f_null
  deconstruct_above?: boolean; // default: false
  items?: string | ItemGroupEntry[];
};

export type MapDataCommon = {
  color?: string | [string] | [string, string, string, string];
  bgcolor?: string | [string] | [string, string, string, string];
  symbol: string | [string] | [string, string, string, string]; // TODO: can be 1-char or LINE_XOXO
  description: Translation;
  // examine_action
  harvest_by_season?: {
    seasons: string[];
    id: string;
  }[];
  // curtain_transform
};

export type Furniture = MapDataCommon & {
  type: "furniture";
  id: string;
  name: Translation;
  move_cost_mod: number;
  required_str: number;
  flags?: string[];

  coverage?: number;
  comfort?: number;
  floor_bedding_warmth?: number;

  emmissions?: string[];

  bonus_fire_warmth_feet?: number; // default: 300

  keg_capacity?: number | string; // volume, default: 0 ml
  max_volume?: number | string; // volume, default: 1000 L

  crafting_pseudo_item?: string; // item_id
  deployed_item?: string; // item_id

  light_emitted?: number; // default: 0

  bash?: MapBashInfo;
  deconstruct?: MapDeconstructInfo;

  // TODO:
  // open
  // close
  // connects_to
  // workbench
  // plant_data
  // surgery_skill_multiplier
};

export type Proficiency = {
  type: "proficiency";
  id: string;
  description: string;
  name: Translation;
  can_learn: boolean;
  time_to_learn?: string; // duration, default: 9999 h

  default_time_multiplier?: number; // default: 2
  default_fail_multiplier?: number; // default: 2

  required_proficiencies?: string[]; // proficiency_id[]
};

export type Skill = {
  type: "skill";
  id: string;
  name: Translation;
  description: string;
};

export type MartialArtRequirements = {
  unarmed_allowed?: boolean;
  melee_allowed?: boolean;
  unarmed_weapons_allowed?: boolean; // default: true
  strictly_unarmed?: boolean;
  wall_adjacent?: boolean;
  req_buffs?: string | string[]; // mabuff_id[]
  req_flags?: string[]; // flag_id[] (json_flag)
  skill_requirements?: { name: string; level: number }[];
  weapon_damage_requirements?: { type: string; min: number }[];
};

export type BonusContainer = {
  flat_bonuses?: {
    stat: string;
    type?: string;
    "scaling-stat"?: string;
    scale?: number;
  }[];
  mult_bonuses?: {
    stat: string;
    type?: string;
    "scaling-stat"?: string;
    scale?: number;
  }[];
};

export type Technique = {
  id: string;
  type: "technique";
  name: Translation;
  description?: Translation;

  messages?: [string, string];

  crit_tec?: boolean;
  crit_ok?: boolean;
  downed_target?: boolean;
  stunned_target?: boolean;
  wall_adjacent?: boolean;
  human_target?: boolean;

  defensive?: boolean;
  disarms?: boolean;
  take_weapon?: boolean;
  side_switch?: boolean;
  dummy?: boolean;
  dodge_counter?: boolean;
  block_counter?: boolean;
  miss_recovery?: boolean;
  grab_break?: boolean;

  weighting?: number; // default: 1

  down_dur?: number; // default: 0
  stun_dur?: number; // default: 0
  knockback_dist?: number; // default: 0
  knockback_spread?: number; // default: 0
  powerful_knockback?: boolean;
  knockback_follow?: boolean;

  aoe?: string;

  flags?: string[];
} & MartialArtRequirements &
  BonusContainer;

export type Vitamin = {
  id: string;
  type: "vitamin";
  name: Translation;
  deficiency?: string; // effect_id
  excess?: string; // effect_id
  min?: number; // int
  max?: number; // int, default 0
  rate?: string; // duration
  vit_type: "vitamin" | "toxin" | "drug" | "counter";
  disease?: [number, number][];
  disease_excess?: [number, number][];
  flags?: string[];
};

export type LeapAttack = {
  type: "leap";
  max_range: number; // float
  min_range?: number; // float, default 1
  allow_no_target?: boolean;
  move_cost?: number; // default 150
  min_consider_range?: number; // default 0
  max_consider_range?: number; // default 200
};
export type MeleeAttack = {
  type: "melee";
  damage_max_instance?: DamageInstance;
  min_mul?: number; // float, default 0
  max_mul?: number; // float, default 1
  move_cost?: number; // int, default 100
  accuracy?: number; // int, default INT_MIN
  body_parts?: [string /* bp_id */, number /* prob */][];
  effects?: {
    id: string;
    duration?: number /* int */;
    affect_hit_bp?: boolean;
    bp?: string /* bp_id */;
    permanent?: boolean;
    chance?: number /* int, default 100 */;
  }[];
};
export type BiteAttack = Omit<MeleeAttack, "type"> & {
  type: "bite";
  no_infection_chance?: number; // int, default 14
};
export type GunAttack = {
  type: "gun";
  gun_type: string; // item_id
  ammo_type?: string; // item_id
  fake_skills?: [string /* skill_id */, number /* level */][];
  fake_str?: number;
  fake_dex?: number;
  fake_int?: number;
  fake_per?: number;

  ranges?: ([number, number] | [number, number, string])[];
  max_ammo?: number; // default INT_MAX
  move_cost?: number;
  description?: Translation;

  // TODO: ...
};

type SpellData = {
  id: string;

  // TODO: ...
};

export type SpellAttack = {
  type: "spell";
  spell_data: SpellData;
  monster_message?: Translation;
};

export type GenericMonsterAttack = {
  type?: "monster_attack";
  id: string;
} & Omit<MeleeAttack, "type">;

type MonsterAttack = (
  | GenericMonsterAttack
  | LeapAttack
  | MeleeAttack
  | BiteAttack
  | GunAttack
  | SpellAttack
) & { cooldown?: number };
export type SpecialAttack = [string, number] | MonsterAttack;
export interface Mapgen {
  type: "mapgen";
  method: "json";
  om_terrain?: string | string[] | string[][];
  weight?: integer;
  object: MapgenObject;
  nested_mapgen_id?: string;
  update_mapgen_id?: string;
}

export type PlaceMapping<T> = Record<string, T | T[]>;
type PlaceList<T> = (MapgenPlace & T)[];

interface MapgenPlace {
  x: MapgenInt;
  y: MapgenInt;
  repeat?: MapgenInt;
}

export interface MapgenObject {
  fill_ter?: string;
  rows?: string[];
  //terrain?: any; // TODO:
  //place_terrain?: PlaceTerrain[];
  //furniture?: any; // TODO:

  items?: PlaceMapping<MapgenItemGroup>;
  place_items?: PlaceList<MapgenItemGroup>;
  item?: PlaceMapping<MapgenSpawnItem>;
  place_item?: PlaceList<MapgenSpawnItem>;
  add?: PlaceList<MapgenSpawnItem>; // deprecated in favor of place_item
  place_loot?: PlaceList<MapgenLoot>;
  sealed_item?: PlaceMapping<MapgenSealedItem>;

  //place_monsters?: FluffyPlaceMonster[];
  //place_monster?: PurplePlaceMonster[];
  //monster?: MonsterClass;
  //monsters?: Monsters;
  // TODO: handle param/distribution/switch
  palettes?: (
    | string
    | { param: any }
    | { distribution: any }
    | { switch: any }
  )[];
  //place_vehicles?: PlaceVehicle[];
  //vehicles?: ObjectVehicles;
  place_nested?: PlaceList<MapgenNested>;
  nested?: PlaceMapping<MapgenNested>;
  set?: MapgenSet[];
  //place_rubble?: PlaceFurnitureElement[];
  //place_furniture?: PlaceFurnitureElement[];
  //gaspumps?: Gaspumps;
  //place_gaspumps?: PlaceGaspumpElement[];
  //place_npcs?: PlaceNpc[];
  //npcs?: Npcs;
  //computers?: Computers;
  mapgensize?: [number, number];
  //liquids?: LiquidsClass;
  //place_liquids?: PlaceLiquid[];
  rotation?: [number, number] | [number] | number;
  mapping?: any; // TODO:
  //place_fields?: PlaceField[];
  //fields?: Fields;
  //vendingmachines?: { [key: string]: Vendingmachine };
  //place_vendingmachines?: PlaceVendingmachine[];
  //traps?: Traps;
  //place_traps?: PlaceTrap[];
  //signs?: Signs;
  //place_signs?: PlaceGraffitiElement[];
  //place_toilets?: PlaceGaspumpElement[];
  //faction_owner?: FactionOwner[];
  predecessor_mapgen?: string;
  //place_graffiti?: PlaceGraffitiElement[];
  //place_ter_furn_transforms?: PlaceTerFurnTransform[];
  //ter_furn_transforms?: TerFurnTransforms;
  //place_zones?: PlaceZone[];
}

type MapgenInt = number | [number] | [number, number];
export interface MapgenItemGroup {
  item: string | ItemGroup | ItemGroupEntry[] /* subtype collection */;
  chance?: number;
  repeat?: MapgenInt;
}

export interface MapgenSpawnItem {
  item: string;
  amount?: MapgenInt;
  chance?: number;
  repeat?: MapgenInt;
  "custom-flags"?: string[];
}

export interface MapgenSealedItem {
  furniture: string;
  chance?: number;
  item?: MapgenSpawnItem;
  items?: MapgenItemGroup;
}

export interface MapgenLoot {
  ammo?: number; // int
  magazine?: number; // int
  chance?: number; // int, default 100
  group?: string; // item_group_id
  item?: string; // item_id
  repeat?: MapgenInt;
}

export interface MapgenNested {
  neighbors?: any; // TODO:
  chunks?: Array<[string, number] | string>;
  else_chunks?: Array<[string, number] | string>;
}

export interface MapgenSet {
  point?: "bash" | "furniture" | "terrain" | "trap";
  line?: "bash" | "furniture" | "terrain" | "trap";
  square?: "radiation" | "terrain";
  id?: string; // ter/furn/trap id
  x: [number, number] | number;
  y: [number, number] | number;
  repeat?: [number, number];
  chance?: number;
  x2?: number;
  y2?: number;
  amount?: [number, number] | number;
}

export interface PaletteData {
  items?: PlaceMapping<MapgenItemGroup>;
  item?: PlaceMapping<MapgenSpawnItem>;
  sealed_item?: PlaceMapping<MapgenSealedItem>;
}

export interface Palette {
  id: string;
  type: "palette";
  terrain?: any;
  furniture?: any;
  nested?: any;
  //toilets?: ToiletsClass;
  items?: PlaceMapping<MapgenItemGroup>;
  //vendingmachines?: Vendingmachines;
  mapping?: Record<string, MapgenMapping>;
  //computers?: Computers;
  //liquids?: Liquids;
  //monster?: MonsterClass;
  item?: PlaceMapping<MapgenSpawnItem>;
  sealed_item?: PlaceMapping<MapgenSealedItem>;
  //vehicles?: Vehicles;
  //monsters?: Monsters;
  //gaspumps?: Gaspumps;
  //signs?: Signs;
}

export interface MapgenMapping {
  items?: MapgenItemGroup | MapgenItemGroup[];
  item?: MapgenSpawnItem | MapgenSpawnItem[];
  //furniture?: string;
  //terrain?: string;
  //traps?: string;
  //fields?: Fields;
}

export type ToolQuality = {
  type: "tool_quality";
  id: string;
  name: string | { str: string; str_pl?: string } | { str_sp: string };
  usages?: [number, string[]][];
};

export type HarvestDropType = {
  id: string;
  type: "harvest_drop_type";
  group?: boolean;
  // ...
};

export type HarvestEntry = {
  drop: string; // item id (or group id iff byId("harvest_drop_type", i.type).group)
  type?: string; // harvest_drop_type id
  base_num?: [number, number]; // default [1, 1]
  scale_num?: [number, number]; // default [0, 0]
  max?: number; // default 1000
  mass_ratio?: number; // default 0
  flags?: string[]; // default []
  faults?: string[]; // default []
};

export type Harvest = {
  type: "harvest";
  id: string;
  entries: HarvestEntry[];
  message?: string;
  leftovers?: string; // item_id, default "ruined_chunks"
  butchery_requirements?: string; // butchery_requirement id, default "default"
};

export type Monster = {
  id: string;
  type: "MONSTER";
  color?: string;
  symbol?: string;
  material?: string | string[];
  description?: Translation;
  volume?: string | number;
  weight?: string;
  flags?: string[];
  harvest?: string; // harvest_id
  dissect?: string; // harvest_id
  bodytype?: string;
  species?: string[];
  speed?: number;
  melee_skill?: integer;
  melee_dice?: integer;
  melee_dice_sides?: integer;
  melee_cut?: integer;
  melee_damage?: DamageInstance;
  diff?: integer;
  emit_fields?: { emit_id: string; delay: string }[];
  attack_cost?: integer; // default: 100
  special_attacks?: SpecialAttack[];
  hp?: integer;
  regenerates?: integer;
  dodge?: number;
  armor_bash?: number;
  armor_stab?: number;
  armor_cut?: number;
  armor_bullet?: number;
  armor_acid?: number;
  armor_fire?: number;
  vision_day?: number;
  vision_night?: number;
  default_faction?: string;
  anger_triggers?: string[];
  placate_triggers?: string[];
  fear_triggers?: string[];
  special_when_hit?: [
    "NONE" | "ZAPBACK" | "ACIDSPLASH" | "RETURN_FIRE",
    integer
  ];
  morale?: number;
  aggression?: number;
  death_function?: {
    message?: Translation;
    effect?: SpellData;
    corpse_type?: "NORMAL" | "SPLATTER" | "BROKEN" | "NO_CORPSE";
  };
  upgrades?:
    | false
    | {
        half_life?: integer;
        age_grow?: integer;
        into_group?: string;
        into?: string;
      };
  ascii_picture?: string;
  death_drops?: string | ItemGroup | ItemGroupEntry[]; // distribution
};

export type MonsterGroup = {
  type: "monstergroup";
  name: string;
  default?: string;
  is_animal?: boolean;
  monsters?: {
    monster: string;
    freq: integer;
    cost_multiplier: integer;
    pack_size?: [integer, integer];
    starts?: integer;
    ends?: integer;
    spawn_data?: {
      ammo?: { ammo_id: string; qty: integer }[];
    };
    conditions?: string[];
  }[];
  replacement_time?: duration;
  is_safe?: boolean;
  freq_total?: integer; // default 1000
  auto_total?: boolean;
};

export type VehiclePartRequirements = {
  skills?: ([string, number] | [string])[];
  time?: number /* moves */ | string /* duration */;
  using?: string | [string, number][];
} & RequirementData;

export type VehiclePart = {
  type: "vehicle_part";
  name?: Translation;
  id: string;
  abstract?: string;
  item?: string; // item_id
  location?: string;
  durability?: integer;
  damage_modifier?: integer; // percentage, default 100
  energy_consumption?: integer; // watts, default 0
  power?: integer; // watts, default 0
  epower?: integer; // watts, default 0
  emissions?: string[]; // emit_id
  exhaust?: string[]; // emit_id
  fuel_type?: string; // item_id
  default_ammo?: string; // item_id
  folded_volume?: volume;
  size?: volume;
  bonus?: integer /** seatbelt (str), muffler (%), horn (vol), light (intensity), recharging (power) */;
  cargo_weight_modifier?: integer; // percentage, default 100
  categories?: string[];
  flags?: string[];
  description?: Translation;
  comfort?: integer;
  floor_bedding_warmth?: integer;
  bonus_fire_warmth_feet?: integer; // default 300
  requirements?: {
    install?: VehiclePartRequirements;
    repair?: VehiclePartRequirements;
    removal?: VehiclePartRequirements;
  };
  breaks_into?: string | ItemGroup | ItemGroupEntry[]; // collection
  qualities?: [string, number][];
  pseudo_tools?: {
    id: string;
    hotkey?: string;
  }[];
  damage_reduction?: {
    /* TODO */
  };

  // when has_flag(ENGINE)
  backfire_threshold?: number;
  backfire_freq?: integer; // default 1
  noise_factor?: integer;
  damaged_power_factor?: number;
  m2c?: integer; // default 1
  muscle_power_factor?: integer;
  exclusions?: string[];
  fuel_options?: string[];

  // when has_flag(WHEEL)
  rolling_resistance?: number;
  contact_area?: integer; // default 1
  wheel_type?: "rigid" | "off-road" | "racing" | "treads" | "rail" | "standard";

  // when has_flag(ROTOR) || has_flag(ROTOR_SIMPLE)
  rotor_diameter?: integer; // default 1

  // when has_flag(WORKBENCH)
  workbench?: {
    multiplier?: number;
    mass?: mass;
    volume?: volume;
  };

  // TODO:
  // transform_terrain
  // symbol, color, etc
  standard_symbols?: boolean;
  symbols?: Record<string, string>;
  symbol?: string;
  color?: string;
};

export type AsciiArt = {
  type: "ascii_art";
  id: string;
  picture: string[];
};

export type AmmunitionType = {
  type: "ammunition_type";
  id: string;
  name: Translation;
  default: string; // item_id
};

export type BodyPart = {
  type: "body_part";
  id: string;

  name: Translation;
  name_multiple?: Translation;
  accusative: Translation;
  accusative_multiple?: Translation;
  heading: Translation;
  heading_multiple: Translation;
  hp_bar_ui_text?: Translation;
  encumbrance_text: Translation;

  hit_size: number;
  hit_difficulty: number;
  // hit_size_relative: [number, number, number];

  base_hp: integer;
  stat_hp_mods?: any; // TODO

  drench_capacity: integer;

  is_limb?: boolean;
  is_vital?: boolean;
  limb_type:
    | "head"
    | "torso"
    | "sensor"
    | "mouth"
    | "arm"
    | "hand"
    | "leg"
    | "foot"
    | "wing"
    | "tail"
    | "other";

  fire_warmth_bonus?: integer;

  main_part: string; // bodypart_id
  connected_to?: string; // bodypart_id

  opposite_part: string; // bodypart_id

  bionic_slots?: integer;

  flags?: string[];

  side: "left" | "right" | "both";

  sub_parts?: string[]; // sub_body_part_id
  // ...
};

export type SubBodyPart = {
  id: string;
  type: "sub_body_part";
  name: Translation;
  parent: string;
  secondary?: boolean;
  max_coverage?: integer; // default 0
  side: 0 | 1 | 2; // left / right / both
  name_multiple?: Translation;
  opposite?: string; // sub_body_part_id
};

export type EffectType = {
  type: "effect_type";
  id: string;
  name?: Translation[];

  // ...
};

export type ConstructionGroup = {
  type: "construction_group";
  id: string;
  name: Translation;

  // ...
};

export type OvermapTerrain = {
  type: "overmap_terrain";
  id: string | string[];
  name: Translation;

  sym?: string; // defaults to \u00a0
  color: string;
  // ...
};

export type Material = {
  type: "material";
  id: string;
  name: Translation;

  density: number; // default 1

  bash_resist: number;
  cut_resist: number;
  bullet_resist: number;
  acid_resist: number;
  elec_resist?: number;
  fire_resist: number;
  chip_resist: integer;

  wind_resist?: integer;

  specific_heat_liquid?: number; // default 4.186
  specific_heat_solid?: number; // default 2.108
  latent_heat?: number; // default 334.0
  freezing_point?: number;

  conductive?: boolean;
  edible?: boolean;
  rotting?: boolean;
  soft?: boolean;
  reinforces?: boolean;

  salvaged_into?: string; // item_id
  repaired_with?: string; // item_id

  vitamins?: [string, number][];
};

export type MartialArtBuff = {
  id: string;
  name: Translation;
  description?: Translation;
  buff_duration?: duration; // default: 2 turns
  max_stacks?: integer; // default: 1
  bonus_dodges?: integer;
  bonus_blocks?: integer;
  quiet?: boolean;
  throw_immune?: boolean;
  stealthy?: boolean;
} & MartialArtRequirements &
  BonusContainer;

export type MartialArt = {
  type: "martial_art";
  id: string;
  name: Translation;
  description: Translation;

  learn_difficulty?: integer;
  autolearn?: [string, integer][];

  static_buffs?: MartialArtBuff[];
  onmove_buffs?: MartialArtBuff[];
  onpause_buffs?: MartialArtBuff[];
  onhit_buffs?: MartialArtBuff[];
  onattack_buffs?: MartialArtBuff[];
  ondodge_buffs?: MartialArtBuff[];
  onblock_buffs?: MartialArtBuff[];
  ongethit_buffs?: MartialArtBuff[];
  onmiss_buffs?: MartialArtBuff[];
  oncrit_buffs?: MartialArtBuff[];
  onkill_buffs?: MartialArtBuff[];

  techniques?: string[]; // technique_id
  weapons?: string[]; // item_id
  weapon_category?: string[]; // weapon_category_id

  strictly_melee?: boolean;
  strictly_unarmed?: boolean;
  allow_melee?: boolean;
  force_unarmed?: boolean;

  arm_block_with_bio_armor_arms?: boolean;
  arm_block?: integer;
  leg_block_with_bio_armor_legs?: boolean;
  leg_block?: integer;
  // ...
};

export type Spell = {
  id: string;
  type: "SPELL";

  name: Translation;
  description: Translation;
};

export type OvermapSpecial = {
  id: string;
  type: "overmap_special" | "city_building";
  locations?: string[];
} & (
  | {
      subtype?: "fixed"; // default fixed
      overmaps?: {
        point: [integer, integer, integer];
        overmap: string;
        flags?: string[];
        locations?: string[];
      }[];
    }
  | { subtype: "mutable" }
);

export type Mutation = {
  id: string;
  type: "mutation";
  name: Translation;
  description: Translation;
  points: integer;

  prereqs?: string[];
  prereqs2?: string[];
  threshreq?: string[];
  category?: string[];
  leads_to?: string[];
  changes_to?: string[];
  cancels?: string[];

  types?: string[];

  threshold?: boolean;
};

export type MutationType = {
  id: string;
  type: "mutation_type";
};

export type MutationCategory = {
  id: string;
  type: "mutation_category";
  name: Translation;
  description?: Translation;
  threshold_mut?: string;
};

export type Vehicle = {
  id: string;
  type: "vehicle";
  name: Translation;
  blueprint?: string[][] | string[];
  parts: {
    x: integer;
    y: integer;
    parts?: (string | { part: string; fuel?: string })[];
    part?: string;
    fuel?: string;
  }[];
  items?: {
    x: integer;
    y: integer;
    chance: integer;
    items?: string | string[];
    item_groups?: string | string[];
  }[];
};

export type Terrain = MapDataCommon & {
  type: "terrain";
  id: string;
  name: Translation;
  description: Translation;
  symbol: string;
  color: string | [string, string, string, string];

  move_cost?: integer;
  coverage?: integer;
  flags?: string[];
  bash?: MapBashInfo;
  deconstruct?: MapDeconstructInfo;

  transforms_into?: string;

  examine_action?:
    | string
    | { type: "cardreader" }
    | { type: "effect_on_condition" };
};

export type WeaponCategory = {
  type: "weapon_category";
  id: string;
  name: Translation;
};

export type EventStatistic = {
  type: "event_statistic";
  id: string;
  description?: Translation;
} & (
  | { stat_type: "count" }
  | {
      stat_type:
        | "total"
        | "minimum"
        | "maximum"
        | "unique_value"
        | "first_value"
        | "last_value";
      field: string;
    }
) &
  ({ event_type: string } | { event_transformation: string });

export type AchievementComparison = "==" | "<=" | ">=" | "anything";

export type AchievementRequirement = {
  event_statistic: string;
  is: AchievementComparison;
  target?: integer | duration | [string, string];
  description?: Translation;
};

export type Achievement = {
  type: "achievement" | "conduct";
  id: string;
  name: Translation;
  description?: Translation;
  requirements: AchievementRequirement[];
  hidden_by?: string | string[]; // achievement_id
  time_constraint?: {
    since: "cataclysm" | "game_start";
    is: AchievementComparison;
    target: duration;
  };
};

export type RotatableSymbol = {
  type: "rotatable_symbol";
  tuple: [string, string] | [string, string, string, string];
};

export type ItemAction = {
  type: "item_action";
  id: string;
  name: Translation;
};

export type Bionic = {
  type: "bionic";
  id: string;
  name: Translation;
  description?: Translation;
  cant_remove_reason?: Translation;

  react_cost?: energy;
  capacity?: energy;
  weight_capacity_bonus?: mass;
  act_cost?: energy;
  deact_cost?: energy;
  trigger_cost?: energy;
  power_trickle?: energy;
  time?: integer;

  flags?: string[];
  active_flags?: string[];
  inactive_flags?: string[];

  fuel_efficiency?: number;
  passive_fuel_efficiency?: number;

  passive_pseudo_items?: string[];
  toggled_pseudo_items?: string[];
  fake_weapon?: string;
  installable_weapon_flags?: string[];

  spell_on_activation?: string;
  weight_capacity_modifier?: number; // default 1
  exothermic_power_gen?: boolean;
  power_gen_emission?: string;
  coverage_power_gen_penalty?: number;
  is_remote_fueled?: boolean;

  known_ma_styles?: string[];
  learned_spells?: Record<string, number>;
  learned_proficiencies?: string[];
  canceled_mutations?: string[];
  mutation_conflicts?: string[];
  included_bionics?: string[];
  included?: boolean;
  upgraded_bionic?: string;
  fuel_options?: string[]; // material_id
  fuel_capacity?: integer;
  activated_on_install?: boolean;

  available_upgrades?: string[]; // bionic_id
  installation_requirement?: string; // requirement_id

  vitamin_absorb_mod?: number; // default 1

  dupes_allowed?: boolean;
  auto_deactivates?: string[];

  activated_close_ui?: boolean;
  deactivated_close_ui?: boolean;

  activated_eocs?: any; // TODO
  processed_eocs?: any; // TODO
  deactivated_eocs?: any; // TODO
  enchantments?: any; // TODO

  stat_bonus?: [string, integer][];
  encumbrance?: [string /* bodypart_id */, integer][];
  occupied_bodyparts?: [string /* bodypart_id */, integer][];
  env_protec?: [string /* bodypart_id */, integer][];
  bash_protec?: [string /* bodypart_id */, integer][];
  cut_protec?: [string /* bodypart_id */, integer][];
  bullet_protec?: [string /* bodypart_id */, integer][];

  social_modifiers?: {
    lie?: integer;
    persuade?: integer;
    intimidate?: integer;
  };
};

export type ItemCategory = {
  id: string;
  type: "ITEM_CATEGORY";
  name: Translation;
  sort_rank: integer;
  // TODO: zones
};

// Used for schema validation.
export type SupportedTypes = {
  // Item types.
  AMMO: { type: "AMMO" } & ItemBasicInfo & AmmoSlot;
  ARMOR: { type: "ARMOR" } & ItemBasicInfo & ArmorSlot;
  BATTERY: { type: "BATTERY" } & ItemBasicInfo;
  BIONIC_ITEM: { type: "BIONIC_ITEM" } & ItemBasicInfo & BionicSlot;
  BOOK: { type: "BOOK" } & ItemBasicInfo & BookSlot;
  COMESTIBLE: { type: "COMESTIBLE" } & ItemBasicInfo & ComestibleSlot;
  ENGINE: { type: "ENGINE" } & ItemBasicInfo & EngineSlot;
  GENERIC: { type: "GENERIC" } & ItemBasicInfo;
  GUN: { type: "GUN" } & ItemBasicInfo & GunSlot;
  GUNMOD: { type: "GUNMOD" } & ItemBasicInfo;
  MAGAZINE: { type: "MAGAZINE" } & ItemBasicInfo;
  PET_ARMOR: { type: "PET_ARMOR" } & ItemBasicInfo;
  TOOL: { type: "TOOL" } & ItemBasicInfo & ToolSlot;
  TOOLMOD: { type: "TOOLMOD" } & ItemBasicInfo;
  TOOL_ARMOR: { type: "TOOL_ARMOR" } & ItemBasicInfo & ToolSlot & ArmorSlot;
  WHEEL: { type: "WHEEL" } & ItemBasicInfo & WheelSlot;

  // Non-item types.
  ITEM_CATEGORY: ItemCategory;
  MONSTER: Monster;
  SPELL: Spell;
  achievement: Achievement;
  ammunition_type: AmmunitionType;
  ascii_art: AsciiArt;
  bionic: Bionic;
  body_part: BodyPart;
  city_building: { type: "city_building" } & OvermapSpecial;
  conduct: Achievement;
  construction: Construction;
  construction_group: ConstructionGroup;
  effect_type: EffectType;
  event_statistic: EventStatistic;
  fault: Fault;
  furniture: Furniture;
  harvest: Harvest;
  harvest_drop_type: HarvestDropType;
  item_action: ItemAction;
  item_group: { type: "item_group" } & ItemGroup;
  json_flag: JsonFlag;
  mapgen: Mapgen;
  martial_art: MartialArt;
  material: Material;
  monstergroup: MonsterGroup;
  mutation: Mutation;
  mutation_category: MutationCategory;
  mutation_type: MutationType;
  overmap_special: { type: "overmap_special" } & OvermapSpecial;
  overmap_terrain: OvermapTerrain;
  palette: Palette;
  proficiency: Proficiency;
  recipe: { type: "recipe" } & Recipe;
  requirement: Requirement;
  rotatable_symbol: RotatableSymbol;
  skill: Skill;
  sub_body_part: SubBodyPart;
  technique: Technique;
  terrain: Terrain;
  tool_quality: ToolQuality;
  uncraft: { type: "uncraft" } & Recipe;
  vehicle: Vehicle;
  vehicle_part: VehiclePart;
  vitamin: Vitamin;
  weapon_category: WeaponCategory;

  // TODO: used, but not yet typed
  monster_attack: { type: "monster_attack"; id: string };
};

export type SupportedTypesWithMapped = SupportedTypes & {
  item: Item;
  monster: Monster;
};

export type SupportedTypeMapped =
  SupportedTypesWithMapped[keyof SupportedTypesWithMapped];
