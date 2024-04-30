<script lang="ts">
import { t } from "@transifex/native";
import { getContext } from "svelte";

import {
  asKilograms,
  asLiters,
  CddaData,
  i18n,
  normalizeDamageInstance,
  singular,
  singularName,
} from "../data";
import ThingLink from "./ThingLink.svelte";
import type { Harvest, Monster, MonsterGroup, Resistances } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import SpecialAttack from "./monster/SpecialAttack.svelte";
import Spoiler from "../Spoiler.svelte";
import ColorText from "./ColorText.svelte";
import ItemTable from "./item/ItemTable.svelte";

const _context = "Monster";

export let item: Monster;

let data = getContext<CddaData>("data");

function monsterArmor(armor: Resistances): Record<string, number> {
  if (armor) {
    const ret: Record<string, number> = {};
    for (const damageType of data.allDamageTypes()) {
      let value = armor[damageType.id];
      if (!value && damageType.derived_from) {
        const [derived_from, multiplier] = damageType.derived_from;
        value = armor[derived_from] * multiplier;
      }
      if (value) ret[damageType.id] = value;
    }
    return ret;
  }
  return {};
}

// prettier-ignore
function difficulty(mon: Monster): number {
  const {
    melee_skill = 0,
    melee_dice = 0,
    melee_damage = [],
    melee_dice_sides: melee_sides = 0,
    dodge: sk_dodge = 0,
    diff: difficulty_base = 0,
    special_attacks = [],
    emit_fields = [],
    hp,
    speed = 0,
    attack_cost = 100,
    morale = 0,
    aggression: agro = 0,
    vision_day = 40,
    vision_night = 1
  } = mon
  const normalizedMeleeDamage = normalizeDamageInstance(melee_damage)
  const melee_dmg_total = normalizedMeleeDamage.reduce((acc, { amount = 0, damage_multiplier = 1, constant_damage_multiplier = 1 }) => acc + amount * damage_multiplier * constant_damage_multiplier, 0)
  let armor_diff = 3
  for (const [damageTypeId, amount] of Object.entries(monsterArmor(mon.armor ?? {}))) {
    const damageType = data.byId("damage_type", damageTypeId)
    if (damageType.mon_difficulty)
      armor_diff += amount
  }
  let difficulty = ( melee_skill + 1 ) * melee_dice * ( melee_dmg_total + melee_sides ) * 0.04 +
               ( sk_dodge + 1 ) * armor_diff * 0.04 +
               ( difficulty_base + special_attacks.length + 8 * emit_fields.length );
  difficulty = Math.floor(difficulty);
  difficulty *= ( (hp ?? 1) + speed - attack_cost + ( morale + agro ) * 0.1 ) * 0.01 +
                ( vision_day + 2 * vision_night ) * 0.01;
  return Math.floor(difficulty);
}

function difficultyDescription(diff: number) {
  if (diff < 3) {
    return i18n.__("<color_light_gray>Minimal threat.</color>");
  } else if (diff < 10) {
    return i18n.__("<color_light_gray>Mildly dangerous.</color>");
  } else if (diff < 20) {
    return i18n.__("<color_light_red>Dangerous.</color>");
  } else if (diff < 30) {
    return i18n.__("<color_red>Very dangerous.</color>");
  } else if (diff < 50) {
    return i18n.__("<color_red>Extremely dangerous.</color>");
  }
  return i18n.__("<color_red>Fatally dangerous!</color>");
}

function damage(mon: Monster) {
  let {
    melee_dice = 0,
    melee_dice_sides = 0,
    melee_damage = [],
    melee_cut,
  } = mon;
  const du = normalizeDamageInstance(melee_damage);
  if (melee_cut) {
    du.push({
      damage_type: "cut",
      amount: melee_cut,
    });
  }
  //melee_damage = melee_damage ?? [ { damage_type: "bash", amount: `${melee_dice}d${melee_dice_sides}` } ]
  return (
    `${melee_dice}d${melee_dice_sides} ${singularName(
      data.byIdMaybe("damage_type", "bash") ?? { id: "bash" }
    )}` +
    du
      .map(
        (u) =>
          ` + ${u.amount} ${singularName(
            data.byIdMaybe("damage_type", u.damage_type) ?? {
              id: u.damage_type,
            }
          )}`
      )
      .join("")
  );
}

// From mtype.h. See also http://cddawiki.chezzo.com/cdda_wiki/index.php?title=Template:Enemyflags&action=edit.
// prettier-ignore
const mon_flag_descriptions: Record<string, string> = {
  SEES: "It can see you (and will run/follow)",
  HEARS: "It can hear you",
  GOODHEARING: "Pursues sounds more than most monsters",
  SMELLS: "It can smell you",
  KEENNOSE: "Keen sense of smell",
  STUMBLES: "Stumbles in its movement",
  WARM: "Warm blooded",
  NOHEAD: "Headshots not allowed!",
  HARDTOSHOOT: "It's one size smaller for ranged attacks, no less then creature_size::tiny",
  GRABS: "Its attacks may grab us!",
  BASHES: "Bashes down doors",
  DESTROYS: "Bashes down walls and more",
  BORES: "Tunnels through just about anything",
  POISON: "Poisonous to eat",
  VENOM: "Attack may poison the player",
  BADVENOM: "Attack may SEVERELY poison the player",
  PARALYZE: "Attack may paralyze the player with venom",
  WEBWALK: "Doesn't destroy webs",
  DIGS: "Digs through the ground",
  CAN_DIG: "Can dig and walk",
  FLIES: "Can fly (over water, etc)",
  AQUATIC: "Confined to water",
  SWIMS: "Treats water as 50 movement point terrain",
  ATTACKMON: "Attacks other monsters",
  ANIMAL: "Is an \"animal\" for purposes of the Animal Empath trait",
  PLASTIC: "Absorbs physical damage to a great degree",
  SUNDEATH: "Dies in full sunlight",
  ELECTRIC: "Shocks unarmed attackers",
  ACIDPROOF: "Immune to acid",
  ACIDTRAIL: "Leaves a trail of acid",
  SHORTACIDTRAIL: "Leaves an intermittent trail of acid",
  FIREPROOF: "Immune to fire",
  SLUDGEPROOF: "Ignores the effect of sludge trails",
  SLUDGETRAIL: "Causes monster to leave a sludge trap trail when moving",
  COLDPROOF: "Immune to cold damage",
  FIREY: "Burns stuff and is immune to fire",
  QUEEN: "When it dies, local populations start to die off too",
  ELECTRONIC: "e.g. a robot; affected by EMP blasts, and other stuff",
  FUR: "May produce fur when butchered",
  LEATHER: "May produce leather when butchered",
  WOOL: "May produce wool when butchered",
  BONES: "May produce bones and sinews when butchered; if combined with POISON flag, tainted bones, if combined with HUMAN, human bones",
  FAT: "May produce fat when butchered; if combined with POISON flag, tainted fat",
  CONSOLE_DESPAWN: "Despawns when a nearby console is properly hacked",
  IMMOBILE: "Doesn't move (e.g. turrets)",
  ID_CARD_DESPAWN: "Despawns when a science ID card is used on a nearby console",
  RIDEABLE_MECH: "A rideable mech that is immobile until ridden.",
  MILITARY_MECH: "A rideable mech that was designed for military work.",
  MECH_RECON_VISION: "This mech gives you IR night-vision.",
  MECH_DEFENSIVE: "This mech gives you thorough protection.",
  HIT_AND_RUN: "Flee for several turns after a melee attack",
  GUILT: "You feel guilty for killing it",
  PAY_BOT: "You can pay this bot to be your friend for a time",
  HUMAN: "It's a live human, as long as it's alive",
  NO_BREATHE: "Creature can't drown and is unharmed by gas, smoke, or poison",
  FLAMMABLE: "Monster catches fire, burns, and spreads fire to nearby objects",
  REVIVES: "Monster corpse will revive after a short period of time",
  CHITIN: "May produce chitin when butchered",
  VERMIN: "Obsolete flag labeling \"nuisance\" or \"scenery\" monsters, now used to prevent loading the same.",
  NOGIB: "Creature won't leave gibs / meat chunks when killed with huge damage.",
  LARVA: "Creature is a larva. Currently used for gib and blood handling.",
  ARTHROPOD_BLOOD: "Forces monster to bleed hemolymph.",
  ACID_BLOOD: "Makes monster bleed acid. Fun stuff! Does not automatically dissolve in a pool of acid on death.",
  BILE_BLOOD: "Makes monster bleed bile.",
  ABSORBS: "Consumes objects it moves over which gives bonus hp.",
  ABSORBS_SPLITS: "Consumes objects it moves over which gives bonus hp. If it gets enough bonus HP, it spawns a copy of itself.",
  CBM_CIV: "May produce a common CBM a power CBM when butchered.",
  CBM_POWER: "May produce a power CBM when butchered, independent of MF_CBM_wev.",
  CBM_SCI: "May produce a bionic from bionics_sci when butchered.",
  CBM_OP: "May produce a bionic from bionics_op when butchered, and the power storage is mk 2.",
  CBM_TECH: "May produce a bionic from bionics_tech when butchered.",
  CBM_SUBS: "May produce a bionic from bionics_subs when butchered.",
  FILTHY: "Any clothing it drops will be filthy.",
  FISHABLE: "It is fishable.",
  GROUP_BASH: "Monsters that can pile up against obstacles and add their strength together to break them.",
  SWARMS: "Monsters that like to group together and form loose packs",
  GROUP_MORALE: "Monsters that are more courageous when near friends",
  INTERIOR_AMMO: "Monster contain's its ammo inside itself, no need to load on launch. Prevents ammo from being dropped on disable.",
  CLIMBS: "Monsters that can climb certain terrain and furniture",
  PACIFIST: "Monsters that will never use melee attack, useful for having them use grab without attacking the player",
  PUSH_MON: "Monsters that can push creatures out of their way",
  PUSH_VEH: "Monsters that can push vehicles out of their way",
  NIGHT_INVISIBILITY: "Monsters that are invisible in poor light conditions",
  REVIVES_HEALTHY: "When revived, this monster has full hitpoints and speed",
  NO_NECRO: "This monster can't be revived by necros. It will still rise on its own.",
  PATH_AVOID_DANGER_1: "This monster will path around some dangers instead of through them.",
  PATH_AVOID_DANGER_2: "This monster will path around most dangers instead of through them.",
  PATH_AVOID_FIRE: "This monster will path around heat-related dangers instead of through them.",
  PATH_AVOID_FALL: "This monster will path around cliffs instead of off of them.",
  PRIORITIZE_TARGETS: "This monster will prioritize targets depending on their danger levels",
  NOT_HALLU: "Monsters that will NOT appear when player's producing hallucinations",
  CATFOOD: "This monster will become friendly when fed cat food.",
  CATTLEFODDER: "This monster will become friendly when fed cattle fodder.",
  BIRDFOOD: "This monster will become friendly when fed bird food.",
  CANPLAY: "This monster can be played with if it's a pet.",
  PET_MOUNTABLE: "This monster can be mounted and ridden when tamed.",
  PET_HARNESSABLE: "This monster can be harnessed when tamed.",
  DOGFOOD: "This monster will become friendly when fed dog food.",
  MILKABLE: "This monster is milkable.",
  SHEARABLE: "This monster is shearable.",
  NO_BREED: "This monster doesn't breed, even though it has breed data",
  PET_WONT_FOLLOW: "This monster won't follow the player automatically when tamed.",
  DRIPS_NAPALM: "This monster occasionally drips napalm on move",
  DRIPS_GASOLINE: "This monster occasionally drips gasoline on move",
  ELECTRIC_FIELD: "This monster is surrounded by an electrical field that ignites flammable liquids near it",
  LOUDMOVES: "This monster makes move noises as if ~2 sizes louder, even if flying.",
  CAN_OPEN_DOORS: "This monster can open doors.",
  STUN_IMMUNE: "This monster is immune to the stun effect",
  DROPS_AMMO: "This monster drops ammo. Should not be set for monsters that use pseudo ammo.",
  INSECTICIDEPROOF: "This monster is immune to insecticide, even though it's made of bug flesh",
  RANGED_ATTACKER: "This monster has any sort of ranged attack",
};

// prettier-ignore
const trigger_descriptions: Record<string, string> = {
  FIRE: "Triggers if there's a fire within 3 tiles, the strength of the effect equals 5 * the field intensity of the fire.",
  FRIEND_ATTACKED: "Triggers if the monster sees another monster of the same type being attacked; strength = 15.",
  FRIEND_DIED: "Triggers if the monster sees another monster of the same type dying; strength = 15.",
  HURT: "Triggers when the monster is hurt, strength equals 1 + (damage / 3).",
  MEAT: "Meat or a corpse is nearby.",
  PLAYER_CLOSE: "Triggers when a potential enemy is within 5 tiles range.",
  PLAYER_WEAK: "Raises monster aggression by 10 - (percent of hp remaining / 10) if a potential enemy has less than 70% hp remaining",
  PLAYER_NEAR_BABY: "Increases monster aggression by 8 and morale by 4 if **the player** comes within 3 tiles of its offspring (defined by the baby_monster field in its reproduction data)",
  SOUND: "Not an actual trigger, monsters above 10 aggression and 0 morale will wander towards, monsters below 0 morale will wander away from the source of the sound for 1 turn (6, if they have the GOODHEARING flag).",
  STALK: "Raises monster aggresssion by 1, triggers 20% of the time each turn if aggression > 5.",
  HOSTILE_SEEN: "Increases aggression/decreases morale by a random amount between 0-2 for every potential enemy it can see, up to 20 aggression.",
  MATING_SEASON: "Increases aggression by 3 if a potential enemy is within 5 tiles range and the season is the same as the monster's mating season (defined by the baby_flags field in its reproduction data).",
}

let materials = item.material ?? [];

let deathDrops = data.flatDeathDrops(item.id);

let harvest: Harvest | undefined = item.harvest
  ? data.byId("harvest", item.harvest)
  : undefined;

let dissect: Harvest | undefined = item.dissect
  ? data.byId("harvest", item.dissect)
  : undefined;

function flattenGroup(mg: MonsterGroup): string[] {
  const results = new Set<string>();
  if (mg.default) results.add(mg.default);
  for (const m of mg.monsters ?? []) {
    if (m.monster) results.add(m.monster);
    if (m.group)
      for (const n of flattenGroup(data.byId("monstergroup", m.group)))
        results.add(n);
  }
  return [...results];
}

let upgrades =
  item.upgrades && (item.upgrades.into || item.upgrades.into_group)
    ? {
        ...item.upgrades,
        monsters: item.upgrades.into
          ? [item.upgrades.into]
          : item.upgrades.into_group
          ? flattenGroup(data.byId("monstergroup", item.upgrades.into_group))
          : [],
      }
    : null;
</script>

<h1><ItemSymbol {item} /> {singularName(item)}</h1>
<section>
  <dl>
    {#if item.bodytype}
      <dt>{t("Body Type", { _context })}</dt>
      <dd>{item.bodytype}</dd>
    {/if}
    {#if item.species && item.species.length}
      <dt>{t("Species", { _context })}</dt>
      <dd>{[item.species ?? []].flat().join(", ")}</dd>
    {/if}
    <dt>{t("Volume")}</dt>
    <dd>{asLiters(item.volume ?? 0)}</dd>
    <dt>{t("Weight")}</dt>
    <dd>{asKilograms(item.weight ?? 0)}</dd>
    {#if materials.length}
      <dt>{t("Material")}</dt>
      <dd>
        <ul class="comma-separated">
          {#each materials as id}
            <li><ThingLink type="material" {id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    <dt>{t("Difficulty", { _context })}</dt>
    <dd>
      {difficulty(item)}
      (<ColorText
        text={difficultyDescription(difficulty(item))}
        fgOnly={true} />)
    </dd>
  </dl>
  {#if item.description}
    <p style="color: var(--cata-color-gray)">{singular(item.description)}</p>
  {/if}
</section>
<Spoiler spoily={item.id === "mon_dragon_dummy"}>
  <div class="side-by-side">
    <section>
      <h1>{t("Attack", { _context, _comment: "Section heading" })}</h1>
      <dl>
        <dt>{t("Speed", { _context })}</dt>
        <dd>{item.speed ?? 0}</dd>
        <dt>{t("Melee Skill", { _context })}</dt>
        <dd>{item.melee_skill ?? 0}</dd>
        <dt>{t("Damage", { _context })}</dt>
        <dd>{damage(item)}</dd>
        {#if item.special_attacks}
          <dt>{t("Special Attacks", { _context })}</dt>
          <dd>
            <ul class="no-bullets">
              {#each item.special_attacks as special_attack}
                <li>
                  {#if Array.isArray(special_attack) && special_attack[0] && data.byIdMaybe("monster_attack", special_attack[0])}
                    <ThingLink type="monster_attack" id={special_attack[0]} />
                  {:else}
                    <SpecialAttack {special_attack} />
                  {/if}
                </li>
              {/each}
            </ul>
          </dd>
        {/if}
      </dl>
    </section>
    <section>
      <h1>{t("Defense", { _context, _comment: "Section heading" })}</h1>
      <dl style="flex: 1">
        <dt>{t("HP", { _context })}</dt>
        <dd>{item.hp}</dd>
        {#if item.regenerates}
          <dt>{t("Regenerates", { _context })}</dt>
          <dd>{item.regenerates} hp/turn</dd>
        {/if}
        <dt>{t("Dodge", { _context })}</dt>
        <dd>{item.dodge ?? 0}</dd>
        <dt>{t("Armor", { _context })}</dt>
        {#if item.armor}
          <dd>
            <dl>
              {#each Object.entries(monsterArmor(item.armor)) as [damageTypeId, value]}
                {@const damageType = data.byId("damage_type", damageTypeId)}
                {#if value}
                  <dt>{singularName(damageType)}</dt>
                  <dd>{value.toFixed(1)}</dd>
                {/if}
              {/each}
            </dl>
          </dd>
        {:else}
          <dd>
            <dl>
              <dt>{t("Bash", { _context: "Damage Type" })}</dt>
              <dd>{item.armor_bash ?? 0}</dd>
              <dt>{t("Cut", { _context: "Damage Type" })}</dt>
              <dd>{item.armor_cut ?? 0}</dd>
              <dt>{t("Stab", { _context: "Damage Type" })}</dt>
              <dd>
                {item.armor_stab ?? Math.floor((item.armor_cut ?? 0) * 0.8)}
              </dd>
              <dt>{t("Ballistic", { _context: "Damage Type" })}</dt>
              <dd>{item.armor_bullet ?? 0}</dd>
              <dt>{t("Acid", { _context: "Damage Type" })}</dt>
              <dd>
                {item.armor_acid ?? Math.floor((item.armor_cut ?? 0) * 0.5)}
              </dd>
              <dt>{t("Heat", { _context: "Damage Type" })}</dt>
              <dd>{item.armor_fire ?? 0}</dd>
            </dl>
          </dd>
        {/if}
        {#if item.special_when_hit}
          <dt>{t("When Hit", { _context })}</dt>
          <dd>{item.special_when_hit[0]} ({item.special_when_hit[1]}%)</dd>
        {/if}
      </dl>
    </section>
  </div>
  <section>
    <h1>{t("Behavior", { _context, _comment: "Section heading" })}</h1>
    <dl>
      <dt
        title="Monsters with high aggression are more likely to be hostile. Ranges from -100 to 100">
        {t("Aggression", { _context })}
      </dt>
      <dd>{item.aggression ?? 0}</dd>
      <dt title="Morale at spawn. Monsters with low morale will flee.">
        {t("Morale", { _context })}
      </dt>
      <dd>{item.morale ?? 0}</dd>
      <dt>{t("Vision Range", { _context })}</dt>
      <dd>
        {item.vision_day ?? 40} ({t("day", { _context })}) / {item.vision_night ??
          1} ({t("night", { _context })})
      </dd>
      <dt>{t("Default Faction", { _context })}</dt>
      <dd>{item.default_faction}</dd>
      {#if item.anger_triggers?.length}
        <dt>{t("Anger Triggers", { _context })}</dt>
        <dd>
          <ul class="comma-separated">
            {#each item.anger_triggers as t}
              <li><abbr title={trigger_descriptions[t]}>{t}</abbr></li>
            {/each}
          </ul>
        </dd>
      {/if}
      {#if item.placate_triggers?.length}
        <dt>{t("Placate Triggers", { _context })}</dt>
        <dd>
          <ul class="comma-separated">
            {#each item.placate_triggers as t}
              <li><abbr title={trigger_descriptions[t]}>{t}</abbr></li>
            {/each}
          </ul>
        </dd>
      {/if}
      {#if item.fear_triggers?.length}
        <dt>{t("Fear Triggers", { _context })}</dt>
        <dd>
          <ul class="comma-separated">
            {#each item.fear_triggers as t}
              <li><abbr title={trigger_descriptions[t]}>{t}</abbr></li>
            {/each}
          </ul>
        </dd>
      {/if}
      {#if item.flags?.length}
        <dt>{t("Flags")}</dt>
        <dd>
          <ul class="comma-separated">
            {#each item.flags ?? [] as flag}
              <li><abbr title={mon_flag_descriptions[flag]}>{flag}</abbr></li>
            {/each}
          </ul>
        </dd>
      {/if}
      {#if item.death_function}
        <dt>{t("On Death", { _context })}</dt>
        <dd>
          {#if item.death_function.effect?.id && data.byIdMaybe("SPELL", item.death_function.effect.id)}
            {singularName(data.byId("SPELL", item.death_function.effect.id))} ({singular(
              data.byId("SPELL", item.death_function.effect.id).description
            )})
          {:else}
            {item.death_function.effect?.id ??
              item.death_function.corpse_type ??
              "NORMAL"}
          {/if}
        </dd>
      {/if}
      {#if upgrades}
        <dt>{t("Upgrades Into", { _context })}</dt>
        <dd>
          <ul class="comma-separated or">
            <!-- prettier-ignore -->
            {#each upgrades.monsters as mon}<li><ThingLink type="monster" id={mon} /></li>{/each}
          </ul>
          {#if upgrades.age_grow}
            {t("in {days} {days, plural, =1 {day} other {days}}", {
              _context,
              days: upgrades.age_grow,
            })}
          {:else if upgrades.half_life}
            {t(
              "with a half-life of {half_life} {half_life, plural, =1 {day} other {days}}",
              { _context, half_life: upgrades.half_life }
            )}
          {/if}
        </dd>
      {/if}
    </dl>
  </section>
  {#if deathDrops.size}
    <ItemTable loot={deathDrops} heading={t("Drops")} />
  {/if}
  {#if harvest && (harvest.entries ?? []).length}
    <section>
      <h1>{t("Butchering Results", { _context })}</h1>
      <ul>
        {#each harvest.entries as harvest_entry}
          {#if (harvest_entry.type && data.byIdMaybe("harvest_drop_type", harvest_entry.type)?.group) || harvest_entry.type === "bionic_group"}
            {#each data.flattenTopLevelItemGroup(data.byId("item_group", harvest_entry.drop)) as { id, prob }}
              <li>
                <ItemSymbol item={data.byId("item", id)} />
                <ThingLink type="item" {id} /> ({(prob * 100).toFixed(2)}%)
              </li>
            {/each}
          {:else}
            <li>
              <ItemSymbol item={data.byId("item", harvest_entry.drop)} />
              <ThingLink type="item" id={harvest_entry.drop} />
            </li>
          {/if}
        {/each}
      </ul>
    </section>
  {/if}
  {#if dissect && (dissect.entries ?? []).length}
    <section>
      <h1>{t("Dissection Results", { _context })}</h1>
      <ul>
        {#each dissect.entries as harvest_entry}
          {#if (harvest_entry.type && data.byId("harvest_drop_type", harvest_entry.type)?.group) || harvest_entry.type === "bionic_group"}
            {#each data
              .flattenTopLevelItemGroup(data.byId("item_group", harvest_entry.drop))
              .sort((a, b) => b.prob - a.prob) as { id, prob }}
              <li>
                <ItemSymbol item={data.byId("item", id)} />
                <ThingLink type="item" {id} /> ({(prob * 100).toFixed(2)}%)
              </li>
            {/each}
          {:else}
            <li>
              <ItemSymbol item={data.byId("item", harvest_entry.drop)} />
              <ThingLink type="item" id={harvest_entry.drop} />
            </li>
          {/if}
        {/each}
      </ul>
    </section>
  {/if}
</Spoiler>
