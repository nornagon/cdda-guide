<script lang="ts">
  export let item
  
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
    let { melee_dice, melee_dice_sides, melee_damage, melee_cut } = item
    //melee_damage = melee_damage ?? [ { damage_type: "bash", amount: `${melee_dice}d${melee_dice_sides}` } ]
    return `${melee_dice}d${melee_dice_sides}`
  }
</script>

<h1><span style="font-family: monospace;" class="c_{item.color}">{item.symbol}</span> {item.name.str}</h1>
<p>{item.description}</p>
<p>HP: {item.hp}</p>
<p>Difficulty: {difficulty(item)} <span class='c_{difficultyColor(difficulty(item))} fg_only'>({difficultyDescription(difficulty(item))})</span></p>
<p>Melee skill: {item.melee_skill ?? 0}</p>
<p>Dodge: {item.dodge ?? 0}</p>
<p>Damage: {damage(item)}</p>
<p>Body type: {item.bodytype}</p>
<p>Volume: {item.volume}</p>
<p>Weight: {item.weight}</p>
<p>Speed: {item.speed}</p>
<p>Material: {item.material.join(', ')}</p>
<p>Aggression: {item.aggression}</p>
<p>Morale: {item.morale}</p>
<p>Species: {item.species.join(', ')}</p>
<p>Default faction: {item.default_faction}</p>