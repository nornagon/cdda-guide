<script lang="ts">
  import { getContext } from 'svelte';

  import { asKilograms, asLiters, CddaData, singularName } from '../data'
  import ThingLink from './ThingLink.svelte';

  export let item

  let data = getContext<CddaData>('data')
  
  function difficulty(item: any) {
    const {
      melee_skill = 0,
      melee_dice = 0,
      melee_cut: bonus_cut = 0,
      melee_dice_sides: melee_sides = 0,
      dodge: sk_dodge = 0,
      armor_bash = -1,
      armor_cut = -1,
      diff: difficulty_base = 0,
      special_attacks = [],
      emit_fields = [],
      hp,
      speed,
      attack_cost = 100,
      morale = 0,
      aggression: agro = 0,
      vision_day = 40,
      vision_night = 1
    } = item
    let difficulty = ( melee_skill + 1 ) * melee_dice * ( bonus_cut + melee_sides ) * 0.04 +
                 ( sk_dodge + 1 ) * ( 3 + armor_bash + armor_cut ) * 0.04 +
                 ( difficulty_base + special_attacks.length + 8 * emit_fields.length );
    difficulty = Math.floor(difficulty);
    difficulty *= ( hp + speed - attack_cost + ( morale + agro ) * 0.1 ) * 0.01 +
                  ( vision_day + 2 * vision_night ) * 0.01;
    return Math.floor(difficulty);
  }
  
  function difficultyDescription(diff: number) {
    if (diff < 3) {
      return "Minimal threat.";
    } else if( diff < 10 ) {
      return "Mildly dangerous.";
    } else if( diff < 20 ) {
      return "Dangerous.";
    } else if( diff < 30 ) {
      return "Very dangerous.";
    } else if( diff < 50 ) {
      return "Extremely dangerous.";
    }
    return "Fatally dangerous!";
  }
  
  function difficultyColor(diff: number) {
    if (diff < 3) {
      return "light_gray";
    } else if( diff < 10 ) {
      return "light_gray";
    } else if( diff < 20 ) {
      return "light_red";
    } else if( diff < 30 ) {
      return "red";
    } else if( diff < 50 ) {
      return "red";
    }
    return "red";
  }
  
  function damage(item: any) {
    let { melee_dice = 0, melee_dice_sides = 0, melee_damage, melee_cut } = item
    //melee_damage = melee_damage ?? [ { damage_type: "bash", amount: `${melee_dice}d${melee_dice_sides}` } ]
    return `${melee_dice}d${melee_dice_sides}`
  }
  
  // From mtype.h. See also http://cddawiki.chezzo.com/cdda_wiki/index.php?title=Template:Enemyflags&action=edit.
  const mon_flag_descriptions = {
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
    AVOID_DANGER_1: "This monster will path around some dangers instead of through them.",
    AVOID_DANGER_2: "This monster will path around most dangers instead of through them.",
    AVOID_FIRE: "This monster will path around heat-related dangers instead of through them.",
    AVOID_FALL: "This monster will path around cliffs instead of off of them.",
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
  }
  
  function specialAttackToString(special_attack: any): string {
    if (Array.isArray(special_attack))
      if (special_attack.length > 1)
        return `${special_attack[0]} (cooldown: ${special_attack[1]})`
      else
        return special_attack[0]
    if ('type' in special_attack)
      if ('cooldown' in special_attack)
        return `${special_attack.type} (cooldown: ${special_attack.cooldown})`
      else
        return special_attack.type
    if ('id' in special_attack)
      if ('damage_max_instance' in special_attack)
        return `${special_attack.id}: ${special_attack.damage_max_instance.map(inst => {
          return `(${inst.damage_type} for ${inst.amount} damage)`
        }).join(' ')}`
      else
        return special_attack.id
  }

  let materials: any[] = item.material ?? []
  
  type ItemGroupEntry = 
    (
      { item: string } |
      { group: string } |
      { distribution: ItemGroupEntry[] } |
      { collection: ItemGroupEntry[] }
    ) & {
      prob?: number
      // TODO: damage, dirt, charges, count, ammo, container, contents, snippets?, sealed, custom-flags
    }
  
  type ItemGroupEntryOrShortcut =
    ItemGroupEntry |
    [ string, number ] // item_id, prob (or item_group_id, prob if in 'groups' array)
    
  type ItemGroup = {
    subtype: "collection" | "distribution"
    entries?: ItemGroupEntryOrShortcut[]
    items?: (string /* item_id with prob=100 */ | ItemGroupEntryOrShortcut)[]
    groups?: (string /* item_group_id with prob=100 */ | ItemGroupEntryOrShortcut)[]
    // TODO: container-item, on_overflow
  } | {
    subtype?: "old" // ~= "distribution"
    items: ItemGroupEntryOrShortcut[]
  }
  
  function flattenItemGroup(group: ItemGroup): {id: string, prob: number}[] {
    const retMap = new Map<string, number>()
    
    function addOne({id, prob}: {id: string, prob: number}) {
      const prevProb = retMap.get(id) ?? 0
      const newProb = 1 - (1 - prevProb) * (1 - prob)
      retMap.set(id, newProb)
    }
    
    function add(...args: {id: string, prob: number}[]) {
      args.forEach(addOne)
    }
    
    const normalizedEntries: ItemGroupEntry[] = []
    if (group.subtype === 'old' || !group.subtype) {
      for (const item of group.items as ItemGroupEntryOrShortcut[])
        if (Array.isArray(item))
          normalizedEntries.push({ item: item[0], prob: item[1] })
        else
          normalizedEntries.push(item)
    } else {
      for (const entry of group.entries ?? [])
        if (Array.isArray(entry))
          normalizedEntries.push({ item: entry[0], prob: entry[1] })
        else
          normalizedEntries.push(entry)
      for (const item of group.items ?? [])
        if (Array.isArray(item))
          normalizedEntries.push({ item: item[0], prob: item[1] })
        else if (typeof item === 'string')
          normalizedEntries.push({ item, prob: 100 })
        else
          normalizedEntries.push(item)
      for (const g of group.groups ?? [])
        if (Array.isArray(g))
          normalizedEntries.push({ group: g[0], prob: g[1] })
        else if (typeof g === 'string')
          normalizedEntries.push({ group: g, prob: 100 })
        else
          normalizedEntries.push(g)
    }
    
    if (group.subtype === 'collection') {
      for (const entry of normalizedEntries) {
        const { prob = 100 } = entry
        const nProb = Math.min(prob, 100) / 100
        if ('item' in entry) {
          add({id: entry.item, prob: nProb})
        } else if ('group' in entry) {
          add(...flattenItemGroup(
            data.byId('item_group', entry.group)
          ).map(p => ({...p, prob: p.prob * nProb})))
        } else if ('collection' in entry) {
          add(...flattenItemGroup({
            subtype: 'collection',
            entries: entry.collection
          }).map(p => ({...p, prob: p.prob * nProb})))
        } else if ('distribution' in entry) {
          add(...flattenItemGroup({
            subtype: 'distribution',
            entries: entry.distribution
          }).map(p => ({...p, prob: p.prob * nProb})))
        } else {
          throw new Error(`unknown item group entry: ${JSON.stringify(entry)}`)
        }
      }
    } else { // distribution
      let totalProb = 0
      for (const entry of normalizedEntries)
        totalProb += entry.prob ?? 100
      for (const entry of normalizedEntries) {
        const nProb = (entry.prob ?? 100) / totalProb
        if ('item' in entry) {
          add({id: entry.item, prob: nProb})
        } else if ('group' in entry) {
          add(...flattenItemGroup(
            data.byId('item_group', entry.group)
          ).map(p => ({...p, prob: p.prob * nProb})))
        } else if ('collection' in entry) {
          add(...flattenItemGroup({
            subtype: 'collection',
            entries: entry.collection
          }).map(p => ({...p, prob: p.prob * nProb})))
        } else if ('distribution' in entry) {
          add(...flattenItemGroup({
            subtype: 'distribution',
            entries: entry.distribution
          }).map(p => ({...p, prob: p.prob * nProb})))
        } else {
          throw new Error(`unknown item group entry: ${JSON.stringify(entry)}`)
        }
      }
    }

    return [...retMap.entries()].map(([id, prob]) => ({id, prob}))
  }
  
  function normalizedDeathDrops(): ItemGroup | undefined {
    if (item.death_drops) {
      if (typeof item.death_drops === 'string') {
        return data.byId('item_group', item.death_drops) as ItemGroup
      } else if (Array.isArray(item.death_drops)) {
        return {subtype: 'distribution', entries: item.death_drops}
      } else {
        return {subtype: 'distribution', ...item.death_drops}
      }
    }
  }
  
  let deathDrops = item.death_drops
    ? flattenItemGroup(normalizedDeathDrops()).sort((a, b) => b.prob - a.prob)
    : undefined
    
  let deathDropsLimit = 10
</script>

<h1><span style="font-family: monospace;" class="c_{item.color}">{item.symbol}</span> {singularName(item)}</h1>
<section>
  <p>{item.description}</p>
  <p>Difficulty: {difficulty(item)} <span class='c_{difficultyColor(difficulty(item))} fg_only'>({difficultyDescription(difficulty(item))})</span></p>
</section>
<section>
  <h1>Body</h1>
  <dl>
    <dt>Body type</dt><dd>{item.bodytype}</dd>
    <dt>Species</dt><dd>{(item.species ?? []).join(', ')}</dd>
    <dt>Volume</dt><dd>{asLiters(item.volume)}</dd>
    <dt>Weight</dt><dd>{asKilograms(item.weight)}</dd>
    <dt>Material</dt>
    <dd>
      <ul class="comma-separated">
        {#each materials as id}
        <li><ThingLink type="material" {id} /></li>
        {/each}
      </ul>
    </dd>
  </dl>
</section>
<section>
  <h1>Combat</h1>
  <div style="display: flex; flex-direction: row; align-items: start; flex-wrap: wrap;">
  <dl style="flex: 1">
    <dt>Speed</dt><dd>{item.speed}</dd>
    <dt>Melee skill</dt><dd>{item.melee_skill ?? 0}</dd>
    <dt>Damage</dt><dd>{damage(item)}</dd>
    {#if item.special_attacks}
    <dt>Special attacks:</dt><dd>
      <ul class="no-bullets">
      {#each item.special_attacks as special_attack}
        <li>{specialAttackToString(special_attack)}</li>
      {/each}
      </ul>
    </dd>
    {/if}
  </dl>
  <dl style="flex: 1">
    <dt>HP</dt><dd>{item.hp}</dd>
    <dt>Dodge</dt><dd>{item.dodge ?? 0}</dd>
    <dt>Armor</dt>
    <dd>
      <dl>
        <dt>Bash</dt><dd>{item.armor_bash ?? 0}</dd>
        <dt>Cut</dt><dd>{item.armor_cut ?? 0}</dd>
        <dt>Stab</dt><dd>{item.armor_stab ?? Math.floor((item.armor_cut ?? 0) * 0.8)}</dd>
        <dt>Bullet</dt><dd>{item.armor_bullet ?? 0}</dd>
        <dt>Acid</dt><dd>{item.armor_acid ?? Math.floor((item.armor_cut ?? 0) * 0.5)}</dd>
        <dt>Fire</dt><dd>{item.armor_fire ?? 0}</dd>
      </dl>
    </dd>
  </dl>
  </div>
</section>
<section>
  <h1>Behavior</h1>
  <dl>
    <dt>Aggression</dt><dd>{item.aggression}</dd>
    <dt>Morale</dt><dd>{item.morale}</dd>
    <dt>Vision range</dt><dd>{item.vision_day ?? 40} (day) / {item.vision_night ?? 1} (night)</dd>
    <dt>Default faction</dt><dd>{item.default_faction}</dd>
    {#if item.anger_triggers}
    <dt>Anger triggers</dt><dd>{item.anger_triggers.join(', ')}</dd>
    {/if}
    {#if item.placate_triggers}
    <dt>Placate triggers</dt><dd>{item.placate_triggers.join(', ')}</dd>
    {/if}
    <dt>Flags</dt><dd>{#each item.flags ?? [] as flag, i}<abbr title={mon_flag_descriptions[flag]}>{flag}</abbr>{#if i < item.flags.length - 1}, {/if}{/each}</dd>
    <dt>On death</dt><dd>{(item.death_function ?? []).join(', ')}</dd>
  </dl>
</section>
{#if deathDrops}
<section>
  <h1>Drops</h1>
  <ul>
    {#each deathDrops.slice(0, deathDropsLimit) as {id, prob}}
    <li><ThingLink type="item" {id} /> ({(prob * 100).toFixed(2)}%)</li>
    {/each}
  </ul>
  {#if deathDropsLimit !== Infinity}
  <a href="" on:click={(e) => { e.preventDefault(); deathDropsLimit = Infinity }}>See all...</a>
  {/if}
</section>
{/if}