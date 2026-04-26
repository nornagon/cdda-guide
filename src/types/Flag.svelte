<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { byName, CddaData, singular } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { JsonFlag } from "../types";
import ColorText from "./ColorText.svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";
import ThingLink from "./ThingLink.svelte";

export let item: JsonFlag;

let data = getContext<CddaData>("data");

// From mtype.h. See also https://github.com/CleverRaven/Cataclysm-DDA/blob/master/doc/JSON_FLAGS.md#monsters
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
  PATH_AVOID_DANGER: "This monster will path around some dangers instead of through them.",
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
  CORNERED_FIGHTER: "This creature will stop fleeing and fight back if enemies pursue it into melee range.",
  SMALL_HIDER: "This small monster can hide under or behind furniture such as beds, refrigerators, and underbrush.",
  CAN_BE_CULLED: "This animal can be culled if it's a pet.",
  EATS: "This creature has a stomach size (defined in its monster json) which gets filled up when it eats, and digests food over time.",
  WATER_CAMOUFLAGE: "If in water, stays invisible up to (current Perception, + base Perception if the character has the Spotting proficiency) tiles away, even in broad daylight. Monsters see it from the lower of day vision and night vision ranges. Can also make it harder to see in deep water or across z-levels if it is underwater and the viewer is not.",
  NOT_HALLUCINATION: "This monster does not appear while the player is hallucinating.",
  PARALYZE_VENOM: "This monster can apply paralyzing effect for 10 minutes.",
  HAS_MIND: "Is sapient and capable of reason (mi-go, triffids, cyborgs, etc.).",
};

const itemsWithFlag = data
  .byType("item")
  .filter((f) => f.id && f.flags?.includes(item.id));
const vpartsWithFlag = data
  .byType("vehicle_part")
  .filter((f) => f.id && f.flags?.includes(item.id));
const furnitureWithFlag = data
  .byType("furniture")
  .filter((f) => f.id && f.flags?.includes(item.id));
const terrainWithFlag = data
  .byType("terrain")
  .filter((f) => f.id && f.flags?.includes(item.id));
const bionicWithFlag = data
  .byType("bionic")
  .filter(
    (f) =>
      f.id &&
      (f.flags?.includes(item.id) ||
        f.active_flags?.includes(item.id) ||
        f.inactive_flags?.includes(item.id))
  );
const monstersWithFlag = data
  .byType("monster")
  .filter((f) => f.id && f.flags?.includes(item.id));
</script>

<h1>{t("Flag", { _comment: "Section heading" })}: {item.id}</h1>
{#if item.info}
  <section>
    <p><ColorText text={singular(item.info)} /></p>
  </section>
{:else if item.id in mon_flag_descriptions}
  <section>
    <p>{mon_flag_descriptions[item.id]}</p>
  </section>
{/if}
{#if itemsWithFlag.length}
  <section>
    <h1>{t("Items", { _comment: "Section heading" })}</h1>
    <LimitedList items={itemsWithFlag.sort(byName)} let:item>
      <ItemSymbol {item} />
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  </section>
{/if}
{#if vpartsWithFlag.length}
  <section>
    <h1>{t("Vehicle Parts")}</h1>
    <LimitedList items={vpartsWithFlag.sort(byName)} let:item>
      <ItemSymbol {item} />
      <ThingLink type="vehicle_part" id={item.id} />
    </LimitedList>
  </section>
{/if}
{#if terrainWithFlag.length}
  <section>
    <h1>{t("Terrain")}</h1>
    <LimitedList items={terrainWithFlag.sort(byName)} let:item>
      <ItemSymbol {item} />
      <ThingLink type="terrain" id={item.id} />
    </LimitedList>
  </section>
{/if}
{#if furnitureWithFlag.length}
  <section>
    <h1>{t("Furniture")}</h1>
    <LimitedList items={furnitureWithFlag.sort(byName)} let:item>
      <ItemSymbol {item} />
      <ThingLink type="furniture" id={item.id} />
    </LimitedList>
  </section>
{/if}
{#if bionicWithFlag.length}
  <section>
    <h1>{t("Bionics")}</h1>
    <LimitedList items={bionicWithFlag.sort(byName)} let:item>
      <ItemSymbol {item} />
      <ThingLink type="bionic" id={item.id} />
    </LimitedList>
  </section>
{/if}
{#if monstersWithFlag.length}
  <section>
    <h1>{t("Monsters")}</h1>
    <LimitedList items={monstersWithFlag.sort(byName)} let:item>
      <ItemSymbol {item} />
      <ThingLink type="monster" id={item.id} />
    </LimitedList>
  </section>
{/if}
