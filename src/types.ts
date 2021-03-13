// TODO: should be called "Translation"
export type Name = string | { str: string, str_pl?: string } | { str_sp: string }

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

  pre_flags?: string[]
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
  include_prereqs?: number // default: true
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
  ammo?: string[] // ammunition_type_id
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
  reload_noise?: Name // default "click."
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
  
  modes?: [string, string, number] | [string, string, number, string[]][]
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
  spoils_in?: string // duration, default 0 (never spoils)
  cooks_like?: string // item_id
  smoking_result?: string // item_id
  contamination?: { disease: string /* diseasetype_id */, probability: number /* int */ }[]
  primary_material?: string // material_id
  material?: string[] // material_id
  monotony_penalty?: number // default 2 unless material is junk, in which case 0
  addiction_type?: string
  addiction_potential?: number // int, default 0
  calories?: number // int
  vitamins?: [string, number /* int */][]
  rot_spawn?: string // mongroup_id
  rot_spawn_chance?: number // int, default 10
}

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
  name?: Name
  description?: Name
  success_msg: Name
  time: string // duration
  skills: {id: string, level: number}[]
  requirements: string | Omit<Requirement, 'id' | 'type'>
  turns_into?: string // fault_id
  also_mends?: string // fault_id
}

export type Fault = {
  type: 'fault'
  id: string
  name: Name
  description: Name
  
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
  name: Name
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
  name: Name
  can_learn: boolean
  time_to_learn?: string // duration, default: 9999 h

  default_time_multiplier?: number // default: 2
  default_fail_multiplier?: number // default: 2
  
  required_proficiencies?: string[] // proficiency_id[]
}

export type Skill = {
  type: 'skill'
  id: string
  name: Name
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
  name: Name
  description?: string
  
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
  name: Name
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
  description?: Name
  
  // TODO: ...
}
type GenericMonsterAttack = {
  type?: 'monster_attack'
  id: string
} & (Omit<MeleeAttack, 'type'> & {attack_type: 'melee'})

type MonsterAttack = (GenericMonsterAttack | LeapAttack | MeleeAttack | BiteAttack | GunAttack) & { cooldown?: number }
export type SpecialAttack = [string, number] | MonsterAttack