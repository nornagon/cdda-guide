export type Translation = string | { str: string, str_pl?: string } | { str_sp: string }

export type ItemGroupEntry =
  (
    { item: string } |
    { group: string } |
    { distribution: ItemGroupEntry[] } |
    { collection: ItemGroupEntry[] }
  ) & {
    prob?: number
    count?: number | [number, number]
    charges?: number | [number, number]
    // TODO: damage, dirt, charges, ammo, container, contents, snippets?, sealed, custom-flags
  }

export type ItemGroupEntryOrShortcut =
  ItemGroupEntry |
  [ string, number ] // item_id, prob (or item_group_id, prob if in 'groups' array)

export type ItemGroup = {
  subtype: "collection" | "distribution"
  entries?: ItemGroupEntryOrShortcut[]
  items?: (string /* item_id with prob=100 */ | ItemGroupEntryOrShortcut)[]
  groups?: (string /* item_group_id with prob=100 */ | ItemGroupEntryOrShortcut)[]
  "container-item"?: string
  // TODO: on_overflow
} | {
  subtype?: "old" // ~= "distribution"
  items: ItemGroupEntryOrShortcut[]
}

export type Construction = {
  type: 'construction'
  id: string
  group: string // construction_group_id
  required_skills?: [string /* skill_id */, number /* level */][]

  // legacy, superceded by required_skills
  skill?: string
  difficulty?: number

  category?: string // construction_category_id, default: OTHER
  time?: string | number /* minutes */

  using?: string | [string /* requirement_id */, number /* count */][]
  pre_note?: string

  pre_terrain?: string // if starts with f_, then furniture_id, else terrain_id
  post_terrain?: string // as above

  pre_flags?: string | string[]
  post_flags?: string[]

  byproducts?: ItemGroupEntry[] // subtype collection

  pre_special?: string
  post_special?: string
  explain_failure?: string

  vehicle_start?: boolean
  on_display?: boolean // default: true
  dark_craftable?: boolean
} & RequirementData


export type ItemComponent = [ string /* item_id */, number /* count */, ...('LIST' | 'NO_RECOVER')[] ]
export type QualityRequirement = {
  id: string
  level?: number // default: 1
  amount?: number // default: 1
}
export type ToolComponent = string | [string, number] | [string, number, "LIST"]

export type Requirement = {
  id: string
  type: 'requirement'
} & RequirementData

export type RequirementData = {
  components?: (ItemComponent | ItemComponent[])[]
  qualities?: (QualityRequirement | QualityRequirement[])[]
  tools?: (ToolComponent | ToolComponent[])[]
}

export type Recipe = {
  result?: string
  abstract?: string // mutex with result
  type: 'recipe' | 'uncraft'

  id_suffix?: string // only for type 'recipe'. not allowed for abstracts
  obsolete?: boolean

  time?: number /* moves */ | string /* duration */
  difficulty?: number // default: 0
  flags?: string[]

  contained?: boolean
  container?: string /* item_id, implies contained */
  sealed?: boolean

  batch_time_factors?: [number /* int */, number /* int */] // [rscale (percentage), rsize]

  charges?: number // int, no default
  result_mult?: number // int, default: 1

  skill_used?: string // skill_id

  skills_required?: [string, number] | [string, number][] // skill_id, level

  proficiencies?: any[] // TODO
  autolearn?: boolean | [string, number][]
  never_learn?: boolean
  decomp_learn?: number | [string, number][]
  book_learn?: ([string] | [string, number])[] | Record<string, {skill_level?: number, recipe_name?: string, hidden?: boolean}>

  activity_level?: string

  delete_flags?: string[] // flag_id
  using?: string | [string, number][] // requirement_id

  // for type: 'recipe' only
  category: string
  subcategory: string
  description: string
  reversible: boolean
  byproducts?: ([string] | [string, number])[]
  // TODO: construction_blueprint
} & RequirementData

export type BookProficiencyBonus = {
  id: string // proficiency_id
  fail_factor?: number // default: 0.5
  time_factor?: number // default: 0.5
  include_prereqs?: boolean // default: true
}
export type BookSlot = {
  max_level?: number // default: 0
  required_level?: number // default: 0
  fun?: number // default: 0
  intelligence?: number // default: 0

  time?: number /* mins */ | string /* duration */

  skill?: string // skill_id
  martial_art?: string // matype_id
  chapters?: number // default: 0
  proficiencies?: BookProficiencyBonus[]
}

export type DamageUnit = {
  damage_type: string
  amount?: number // float, default 0
  armor_penetration?: number // float, default 0
  armor_multiplier?: number // float, default 1
  damage_multiplier?: number // float, default 1
  constant_armor_multiplier?: number // float, default 1
  constant_damage_multiplier?: number // float, default 1
}
export type DamageInstance = DamageUnit[] | {values: DamageUnit[]} | DamageUnit

export type GunSlot = {
  skill: string // skill_id
  ammo?: string | string[] // ammunition_type_id
  range?: number // int
  ranged_damage?: DamageInstance
  dispersion?: number // int
  sight_dispersion?: number // int, default: 30
  recoil?: number // int
  handling?: number // int, default: derived from weapon type. if skill_used is rifle, smg or shotgun, 20, otherwise 10.
  durability?: number // int
  burst?: number // int, default: 0
  loudness?: number // int, default: 0
  clip_size?: number // int
  reload?: number // int moves, default 100
  reload_noise?: Translation // default "click."
  reload_noise_volume?: number // int, default: 0
  barrel_volume?: string // volume, default: 0 ml
  built_in_mods?: string[] // item_id
  default_mods?: string[] // item_id
  ups_charges?: number // int
  blackpowder_tolerance?: number // int, default: 8
  min_cycle_recoil?: number // int, default: 0
  ammo_effects?: string[]
  ammo_to_fire?: number // int, default: 1

  valid_mod_locations?: [string, number][] // [gunmod_location, count]

  modes?: ([string, string, number] | [string, string, number, string[] | string])[]
}

export type AmmoSlot = {
  ammo_type: string // ammunition_type_id
  casing?: string // item_id
  drop?: string // item_id
  drop_chance?: number // float, default: 1
  drop_active?: boolean // default: true
  damage?: DamageInstance
  range?: number // int
  dispersion?: number // int
  recoil?: number // int
  count?: number // int, default 1
  loudness?: number // int, default derived
  effects?: string[]
  critical_multiplier?: number // float, default: 2
  show_stats?: boolean
}

export type ComestibleSlot = {
  comestible_type: string // DRINK, FOOD or MED
  tool?: string // item_id, needed to consume
  charges?: number // int, default charges
  quench?: number // int, default 0
  fun?: number // int, default 0
  stim?: number // int, default 0
  fatigue_mod?: number // int, default 0
  healthy?: number // int, default 0
  parasites?: number // int, default 0
  radiation?: number // int, default 0
  freezing_point?: number // int, default 32
  spoils_in?: string | number // duration, default 0 (never spoils)
  cooks_like?: string // item_id
  smoking_result?: string // item_id
  contamination?: { disease: string /* diseasetype_id */, probability: number /* int */ }[]
  primary_material?: string // material_id
  monotony_penalty?: number // default 2 unless material is junk, in which case 0
  addiction_type?: string
  addiction_potential?: number // int, default 0
  calories?: number // int
  vitamins?: [string, number /* int */][]
  rot_spawn?: string // mongroup_id
  rot_spawn_chance?: number // int, default 10
}

export type ArmorPortionData = {
  encumbrance?: number | [number, number]
  coverage?: number
  covers?: string[] // bp_id
  sided?: boolean
}

export type ArmorSlot = {
  covers?: string[]
  armor_portion_data?: ArmorPortionData[]
  sided?: boolean
  flags?: string[]
  warmth?: number
  encumbrance?: number
  max_encumbrance?: number
  coverage?: number
  environmental_protection?: number
  material_thickness?: number
  material?: string | string[]
}

export type EngineSlot = {
  displacement?: number
}

export type ItemBasicInfo = {
  id: string
  type: AllItemTypes
  description?: Translation
  qualities?: [string, number][]
  volume?: string
  weight?: string
  longest_side?: string
  material?: string | string[] // material_id
  flags?: string[]
  faults?: string[]
  pocket_data?: PocketData[]
  bashing?: number
  cutting?: number
  min_strength?: number
  techniques?: string[]
  to_hit?: number | {grip?: string, length?: string, surface?: string, balance?: string}
}

const itemTypes = ["AMMO","ARMOR","BATTERY","BIONIC_ITEM","BOOK","COMESTIBLE","ENGINE","GENERIC","GUN","GUNMOD","MAGAZINE","PET_ARMOR","TOOL","TOOLMOD","TOOL_ARMOR","WHEEL"] as const
type AllItemTypes = typeof itemTypes[Exclude<keyof typeof itemTypes, keyof []>]

type TypedItems =
  ({ type: 'AMMO' } & AmmoSlot)
  | ({ type: 'BOOK' } & BookSlot)
  | ({ type: 'GUN' } & GunSlot)
  | ({ type: 'COMESTIBLE' } & ComestibleSlot)
  | ({ type: 'ARMOR' | 'TOOL_ARMOR' } & ArmorSlot)
  | ({ type: 'ENGINE' } & EngineSlot)
type UntypedItemType = Exclude<AllItemTypes, TypedItems['type']>

export type Item = ItemBasicInfo & (
  TypedItems
  | ({ type: UntypedItemType })
)

export type PocketData = {
  pocket_type?: string
  ammo_restriction?: Record<string, number>
  item_restriction?: Array<string>
  min_item_volume?: string
  max_item_volume?: string
  max_contains_volume: string
  max_contains_weight: string
  max_item_length?: string
  spoil_multiplier?: number // float
  weight_multiplier?: number // float
  volume_multiplier?: number // float
  magazine_well?: string // volume
  moves?: number
  fire_protection?: boolean
  watertight?: boolean
  airtight?: boolean
  open_container?: boolean
  flag_restriction?: Array<string>
  rigid?: boolean
  holster?: boolean
  sealed_data?: { spoil_multiplier?: number }
}

export type MendingMethod = {
  id: string
  name?: Translation
  description?: Translation
  success_msg: Translation
  time: string // duration
  skills: {id: string, level: number}[]
  requirements: string | Omit<Requirement, 'id' | 'type'>
  turns_into?: string // fault_id
  also_mends?: string // fault_id
}

export type Fault = {
  type: 'fault'
  id: string
  name: Translation
  description: Translation

  mending_methods?: MendingMethod[]

  flags?: string[]
}

export type JsonFlag = {
  type: "json_flag"
  id: string

  info?: string
  conflicts?: string[]
  inherit?: boolean // default: true
  craft_inherit?: boolean // default: false
  requires_flag?: string
  taste_mod?: number // default: 0
}

export type MapBashInfo = {
  str_min?: number // default: 0
  str_max?: number // default: 0
  str_min_blocked?: number // default: -1
  str_max_blocked?: number // default: -1
  str_min_supported?: number // default: -1
  str_max_supported?: number // default: -1
  explosive?: number // default: -1
  sound_vol?: number // default: -1
  sound_fail_vol?: number // default: -1
  collapse_radius?: number // default: 1
  destroy_only?: boolean // default: false
  bash_below?: boolean // default: false

  // TODO:
  // sound
  // sound_fail
  // furn_set
  // ter_set
  // move_cost

  items: ItemGroupEntry[]

  // tent_centers
}

export type MapDeconstructInfo = {
  furn_set?: string // default: f_null
  deconstruct_above?: boolean // default: false
  items?: ItemGroupEntry[]
}

export type MapDataCommon = {
  description: string
  // examine_action
  // harvest_by_season
  // curtain_transform
}

export type Furniture = MapDataCommon & {
  type: "furniture"
  id: string
  name: Translation
  move_cost_mod: number
  required_str: number
  color?: string | [string] | [string, string, string, string]
  bgcolor?: string | [string] | [string, string, string, string]
  symbol: string | [string] | [string, string, string, string] // TODO: can be 1-char or LINE_XOXO
  flags?: string[]

  coverage?: number
  comfort?: number
  floor_bedding_warmth?: number

  emmissions?: string[]

  bonus_fire_warmth_feet?: number // default: 300

  keg_capacity?: number | string // volume, default: 0 ml
  max_volume?: number | string // volume, default: 1000 L

  crafting_pseudo_item?: string // item_id
  deployed_item?: string // item_id

  light_emitted?: number // default: 0

  bash?: MapBashInfo
  deconstruct?: MapDeconstructInfo

  // TODO:
  // open
  // close
  // connects_to
  // workbench
  // plant_data
  // surgery_skill_multiplier
}

export type Proficiency = {
  type: "proficiency"
  id: string
  description: string
  name: Translation
  can_learn: boolean
  time_to_learn?: string // duration, default: 9999 h

  default_time_multiplier?: number // default: 2
  default_fail_multiplier?: number // default: 2

  required_proficiencies?: string[] // proficiency_id[]
}

export type Skill = {
  type: 'skill'
  id: string
  name: Translation
  description: string
}

export type MartialArtRequirements = {
  unarmed_allowed?: boolean
  melee_allowed?: boolean
  unarmed_weapons_allowed?: boolean // default: true
  strictly_unarmed?: boolean
  wall_adjacent?: boolean
  req_bufs?: string[] // mabuff_id[]
  req_flags?: string[] // flag_id[] (json_flag)
  skill_requirements?: {name: string, level: number}[]
  weapon_damage_requirements?: {type: string, min: number}[]
}

export type BonusContainer = {
  flat_bonuses?: {stat: string, type?: string, "scaling-stat"?: string, scale?: number}[]
  mult_bonuses?: {stat: string, type?: string, "scaling-stat"?: string, scale?: number}[]
}

export type Technique = {
  id: string
  name: Translation
  description?: Translation

  messages?: [string, string]

  crit_tec?: boolean
  crit_ok?: boolean
  downed_target?: boolean
  stunned_target?: boolean
  wall_adjacent?: boolean
  human_target?: boolean

  defensive?: boolean
  disarms?: boolean
  take_weapon?: boolean
  side_switch?: boolean
  dummy?: boolean
  dodge_counter?: boolean
  block_counter?: boolean
  miss_recovery?: boolean
  grab_break?: boolean

  weighting?: number // default: 1

  down_dur?: number // default: 0
  stun_dur?: number // default: 0
  knockback_dist?: number // default: 0
  knockback_spread?: number // default: 0
  powerful_knockback?: boolean
  knockback_follow?: boolean

  aoe?: string

  flags?: string[]
} & MartialArtRequirements & BonusContainer

export type Vitamin = {
  id: string
  type: 'vitamin'
  name: Translation
  deficiency?: string // effect_id
  excess?: string // effect_id
  min?: number // int
  max?: number // int, default 0
  rate?: string // duration
  vit_type: 'vitamin' | 'toxin' | 'drug' | 'counter'
  disease?: [number, number][]
  disease_excess?: [number, number][]
  flags?: string[]
}

type LeapAttack = {
  type: 'leap'
  max_range: number // float
  min_range?: number // float, default 1
  allow_no_target?: boolean
  move_cost?: number // default 150
  min_consider_range?: number // default 0
  max_consider_range?: number // default 200
}
type MeleeAttack = {
  type: 'melee'
  damage_max_instance?: DamageInstance
  min_mul?: number // float, default 0
  max_mul?: number // float, default 1
  move_cost?: number // int, default 100
  accuracy?: number // int, default INT_MIN
  body_parts?: [string /* bp_id */, number /* prob */][]
  effects?: {id: string, duration?: number /* int */, affect_hit_bp?: boolean, bp?: string /* bp_id */, permanent?: boolean, chance?: number /* int, default 100 */}[]
}
type BiteAttack = Omit<MeleeAttack, 'type'> & {
  type: 'bite'
  no_infection_chance?: number // int, default 14
}
type GunAttack = {
  type: 'gun'
  gun_type?: string // item_id
  ammo_type?: string // item_id
  fake_skills?: [string /* skill_id */, number /* level */][]
  fake_str?: number
  fake_dex?: number
  fake_int?: number
  fake_per?: number

  ranges?: ([number, number] | [number, number, string])[]
  max_ammo?: number // default INT_MAX
  move_cost?: number
  description?: Translation

  // TODO: ...
}

type SpellData = {
  id: string

  // TODO: ...
}

type SpellAttack = {
  type: 'spell'
  spell_data: SpellData
  monster_message: Translation
}

type GenericMonsterAttack = {
  type?: 'monster_attack'
  id: string
} & (Omit<MeleeAttack, 'type'> & {attack_type: 'melee'})

type MonsterAttack = (GenericMonsterAttack | LeapAttack | MeleeAttack | BiteAttack | GunAttack | SpellAttack) & { cooldown?: number }
export type SpecialAttack = [string, number] | MonsterAttack
export interface Mapgen {
  type: 'mapgen';
  method: 'json';
  om_terrain?: string | string[] | string[][];
  weight?: number;
  object: MapgenObject;
  nested_mapgen_id?: string;
  update_mapgen_id?: string;
}

type PlaceMapping<T> = Record<string, T | T[]>;
type PlaceList<T> = (MapgenPlace & T)[]

interface MapgenPlace {
  x: MapgenInt
  y: MapgenInt
  repeat?: MapgenInt
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
  palettes?: string[];
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
  predecessor_mapgen?: 'field' | 'forest' | 'forest_thick' | 'forest_water' | 'lake_shore' | 'lake_surface';
  //place_graffiti?: PlaceGraffitiElement[];
  //place_ter_furn_transforms?: PlaceTerFurnTransform[];
  //ter_furn_transforms?: TerFurnTransforms;
  //place_zones?: PlaceZone[];
}

type MapgenInt = number | [number] | [number, number]
export interface MapgenItemGroup {
  item: string | ItemGroup | ItemGroupEntry[] /* subtype collection */
  chance?: MapgenInt
  repeat?: MapgenInt
}

export interface MapgenSpawnItem {
  item: string
  amount?: MapgenInt
  chance?: MapgenInt
  repeat?: MapgenInt
  "custom-flags"?: string[]
}

export interface MapgenSealedItem {
  furniture: string;
  chance: MapgenInt;
  item?: MapgenSpawnItem
  items?: MapgenItemGroup
}

export interface MapgenLoot {
  ammo?: number // int
  magazine?: number // int
  chance?: number // int, default 100
  group?: string // item_group_id
  item?: string // item_id
}

export interface MapgenNested {
  neighbors: any // TODO:
  chunks?: Array<[string, number] | string>;
  else_chunks?: Array<[string, number] | string>;
}

export interface MapgenSet {
  point?: 'bash' | 'furniture' | 'terrain' | 'trap';
  line?: 'bash' | 'furniture' | 'terrain' | 'trap';
  square?: 'radiation' | 'terrain';
  id?: string; // ter/furn/trap id
  x: [number, number] | number;
  y: [number, number] | number;
  repeat?: [number, number]
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
  type: 'palette';
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
  item?: MapgenSpawnItem | MapgenSpawnItem[]
  //furniture?: string;
  //terrain?: string;
  //traps?: string;
  //fields?: Fields;
}

export type ToolQuality = {
  type: "tool_quality"
  id: string
  name: string | { str: string, str_pl?: string } | { str_sp: string }
  usages?: [number, string[]][]
}

export type HarvestEntry = {
  drop: string // item id, or group id iff type === "bionic_group"
  type?: "flesh" | "blood" | "bone" | "skin" | "offal" | "bionic" | "bionic_group"
  base_num?: [number, number] // default [1, 1]
  scale_num?: [number, number] // default [0, 0]
  max?: number // default 1000
  mass_ratio?: number // default 0
  flags?: string[] // default []
  faults?: string[] // default []
}

export type Harvest = {
  type: "harvest"
  id: string
  entries: HarvestEntry[]
  message?: string
  leftovers?: string // item_id, default "ruined_chunks"
  butchery_requirements?: string // butchery_requirement id, default "default"
}

export type Monster = {
  id: string
  type: 'MONSTER'
  material: string | string[]
  description?: Translation
  volume?: string
  weight?: string
  flags?: string[]
  harvest?: string
  bodytype?: string
  species?: string[]
  speed?: number
  melee_skill?: number
  special_attacks?: SpecialAttack[]
  hp?: number
  dodge?: number
  armor_bash?: number
  armor_stab?: number
  armor_cut?: number
  armor_bullet?: number
  armor_acid?: number
  armor_fire?: number
  vision_day?: number
  vision_night?: number
  default_faction?: string
  anger_triggers?: string[]
  placate_triggers?: string[]
  morale?: number
  aggression?: number
  death_function?: string[]
}

const types = ["AMMO","ARMOR","BATTERY","BIONIC_ITEM","BOOK","COMESTIBLE","ENGINE","GENERIC","GUN","GUNMOD","ITEM_CATEGORY","LOOT_ZONE","MAGAZINE","MIGRATION","MONSTER","MONSTER_BLACKLIST","MONSTER_FACTION","PET_ARMOR","SPECIES","SPELL","TOOL","TOOLMOD","TOOL_ARMOR","WHEEL","achievement","activity_type","ammo_effect","ammunition_type","anatomy","ascii_art","behavior","bionic","body_part","butchery_requirement","charge_removal_blacklist","city_building","clothing_mod","conduct","construction","construction_category","construction_group","disease_type","dream","effect_type","emit","enchantment","event_statistic","event_transformation","faction","fault","field_type","furniture","gate","harvest","hit_range","item_action","item_group","json_flag","map_extra","mapgen","martial_art","material","mission_definition","monster_attack","monstergroup","morale_type","movement_mode","mutation","mutation_category","mutation_type","npc","npc_class","obsolete_terrain","overlay_order","overmap_connection","overmap_land_use_code","overmap_location","overmap_special","overmap_terrain","palette","profession","profession_item_substitutions","proficiency","recipe","recipe_category","recipe_group","region_settings","relic_procgen_data","requirement","rotatable_symbol","scenario","scent_type","score","skill","skill_display_type","snippet","speech","start_location","talk_topic","technique","ter_furn_transform","terrain","tool_quality","trait_group","trap","uncraft","vehicle","vehicle_group","vehicle_part","vehicle_part_category","vehicle_placement","vehicle_spawn","vitamin","weather_type"] as const
type AllTypes = typeof types[Exclude<keyof typeof types, keyof []>]

type SupportedThing
  = Item
  | Palette
  | Mapgen
  | Skill
  | Proficiency
  | Furniture
  | JsonFlag
  | Construction
  | Requirement
  | Vitamin
  | Fault
  | Recipe
  | ToolQuality
  | Harvest
  | Monster

type UnsupportedType = Exclude<AllTypes, SupportedThing['type']>

// https://stackoverflow.com/a/53808212/216728
type IfEquals<T, U, Y=unknown, N=never> =
  (<G>() => G extends T ? 1 : 2) extends
  (<G>() => G extends U ? 1 : 2) ? Y : N;

let unsupportedTypeMustNotBeString: IfEquals<string, UnsupportedType, true, false> = false

export type Thing
  = SupportedThing
  // I would make this extra one just Exclude<string, SupportedThing['type']>, but
  // typescript-json-schema just renders that as {type: string}, which would allow any
  // non-conforming object to pass the schema.
  // This _could_ be rendered in JSON-Schema using the 'not' operator, but
  // typescript-json-schema doesn't support it.
  | { type: UnsupportedType }

export type All = {data: Thing[]}
