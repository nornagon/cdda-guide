<script lang="ts">
import { t } from "@transifex/native";
import { getContext } from "svelte";

import {
  asKilograms,
  asLiters,
  byName,
  CddaData,
  i18n,
  normalizeDamageInstance,
  singular,
  singularName,
} from "../data";
import ThingLink from "./ThingLink.svelte";
import type {
  Harvest,
  Monster,
  MonsterGroup,
  Resistances,
  SpecialAttack as SpecialAttackT,
} from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
import SpecialAttack from "./monster/SpecialAttack.svelte";
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
    const damageType = data.byIdMaybe("damage_type", damageTypeId)
    if (damageType?.mon_difficulty)
      armor_diff += amount
  }
  const irrelevantAttacks = ["PARROT", "PARROT_AT_DANGER", "GRAZE", "EAT_CROP", "EAT_FOOD", "EAT_CARRION"]
  const id = (a: SpecialAttackT): string => Array.isArray(a) ? a[0] : "id" in a ? a.id : ""
  const relevantSpecialAttacks = special_attacks.filter(a => !irrelevantAttacks.includes(id(a)))
  let difficulty = ( melee_skill + 1 ) * melee_dice * ( melee_dmg_total + melee_sides ) * 0.04 +
               ( sk_dodge + 1 ) * armor_diff * 0.04 +
               ( difficulty_base + relevantSpecialAttacks.length + 8 * emit_fields.length );
  difficulty = Math.floor(difficulty);
  difficulty *= ( (hp ?? 1) + speed - attack_cost + ( morale + agro ) * 0.1 ) * 0.01 +
                ( vision_day + 2 * vision_night ) * 0.01;
  return Math.max(1, Math.floor(difficulty));
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
        monsters: (item.upgrades.into
          ? [item.upgrades.into]
          : item.upgrades.into_group
          ? flattenGroup(data.byId("monstergroup", item.upgrades.into_group))
          : []
        ).sort((a, b) =>
          byName(data.byIdMaybe("monster", a), data.byIdMaybe("monster", b))
        ),
      }
    : null;

// Find monsters that upgrade to this one
interface UpgradeFromInfo {
  id: string;
  age_grow?: number;
  half_life?: number;
}

function upgradesFrom(other: Monster) {
  if (!other.id || !other.upgrades) return false;
  if (other.upgrades.into === item.id) return true;

  if (other.upgrades.into_group) {
    return flattenGroup(
      data.byId("monstergroup", other.upgrades.into_group)
    ).includes(item.id);
  }
  return false;
}

const upgradesFromRaw: UpgradeFromInfo[] = [];
for (const monster of data.byType("monster")) {
  if (!monster.id || !monster.upgrades) continue;

  if (upgradesFrom(monster)) {
    upgradesFromRaw.push({
      id: monster.id,
      age_grow: monster.upgrades.age_grow,
      half_life: monster.upgrades.half_life,
    });
  }
}

// Group monsters into their group based on upgrade type and timing
const upgradesFromByHalfLife = new Map<number, string[]>();
const upgradesFromByAgeGrow = new Map<number, string[]>();
const upgradesFromNoTiming = [];
for (const upgrade of upgradesFromRaw) {
  if (upgrade.age_grow) {
    if (!upgradesFromByAgeGrow.has(upgrade.age_grow)) {
      upgradesFromByAgeGrow.set(upgrade.age_grow, []);
    }
    upgradesFromByAgeGrow.get(upgrade.age_grow)!.push(upgrade.id);
  } else if (upgrade.half_life) {
    if (!upgradesFromByHalfLife.has(upgrade.half_life)) {
      upgradesFromByHalfLife.set(upgrade.half_life, []);
    }
    upgradesFromByHalfLife.get(upgrade.half_life)!.push(upgrade.id);
  } else {
    upgradesFromNoTiming.push(upgrade.id);
  }
}

// Sort monsters with the same timing alphabetically
for (const monsterByTime of [upgradesFromByHalfLife, upgradesFromByAgeGrow]) {
  for (const [_, monsters] of monsterByTime) {
    monsters.sort((a, b) =>
      byName(data.byIdMaybe("monster", a), data.byIdMaybe("monster", b))
    );
  }
}
upgradesFromNoTiming.sort((a, b) =>
  byName(data.byIdMaybe("monster", a), data.byIdMaybe("monster", b))
);

// Sort each group by timing and insert into one upgradesFromGrouped for display
const upgradesFromGrouped = new Map<string, string[]>();
if (upgradesFromByHalfLife.size > 0) {
  const sortedHalfLifeKeys = Array.from(upgradesFromByHalfLife.keys()).sort(
    (a, b) => a - b
  );
  for (const half_life of sortedHalfLifeKeys) {
    upgradesFromGrouped.set(
      `half_life:${half_life}`,
      upgradesFromByHalfLife.get(half_life)!
    );
  }
}
if (upgradesFromByAgeGrow.size > 0) {
  const sortedAgeGrowKeys = Array.from(upgradesFromByAgeGrow.keys()).sort(
    (a, b) => a - b
  );
  for (const age_grow of sortedAgeGrowKeys) {
    upgradesFromGrouped.set(
      `age_grow:${age_grow}`,
      upgradesFromByAgeGrow.get(age_grow)!
    );
  }
}
if (upgradesFromNoTiming.length > 0) {
  upgradesFromGrouped.set("no_timing", upgradesFromNoTiming);
}
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
              {@const damageType = data.byIdMaybe("damage_type", damageTypeId)}
              {#if value}
                <dt>{singularName(damageType ?? { id: damageTypeId })}</dt>
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
      {#if upgradesFromGrouped.size > 0}
        <dt>{t("Upgrades From", { _context })}</dt>
        <dd>
          {#each [...upgradesFromGrouped.entries()] as [timingKey, monsterIds], i}
            {#if i > 0}; {/if}
            <span class="comma-separated">
              {#each monsterIds as monId, j}
                {#if j > 0}, {/if}<ThingLink type="monster" id={monId} />
              {/each}
            </span>
            {#if timingKey.startsWith("age_grow:")}
              {@const days = parseInt(timingKey.split(":")[1])}
              {t("in {days} {days, plural, =1 {day} other {days}}", {
                _context,
                days,
              })}
            {:else if timingKey.startsWith("half_life:")}
              {@const half_life = parseInt(timingKey.split(":")[1])}
              {t(
                "with a half-life of {half_life} {half_life, plural, =1 {day} other {days}}",
                { _context, half_life }
              )}
            {/if}
          {/each}
        </dd>
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
            <li><ThingLink type="json_flag" id={flag} /></li>
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
