<script lang="ts">
import { getContext } from "svelte";
import { CddaData, parseMass, parseVolume } from "../../data";
import ThingLink from "../ThingLink.svelte";

let data = getContext<CddaData>('data')
export let item
  
let techniques: any[] = (item.techniques ?? []).map(t => data.byId('technique', t));

const gripVal = { bad: 0, none: 1, solid: 2, weapon: 3 }
const lengthVal = { hand: 0, short: 1, long: 2 }
const surfaceVal = { point: 0, line: 1, any: 2, every: 3 }
const balanceVal = { clumsy: 0, uneven: 1, neutral: 2, good: 3 }
  
const computeToHit = ({grip = 'weapon', length = 'hand', surface = 'any', balance = 'neutral'}: {grip?: string, length?: string, surface?: string, balance?: string}) => {
  const g = gripVal[grip]
  const l = lengthVal[length]
  const s = surfaceVal[surface]
  const b = balanceVal[balance]
  // all items have a basic accuracy of -2, per GAME_BALANCE.md
  const base_acc = -2;
  // grip val should go from -1 to 2 but enum_to_string wants to start at 0
  const grip_offset = -1;
  // surface val should from from -2 to 1 but enum_to_string wants to start at 0
  const surface_offset = -2;
  // balance val should from from -2 to 1 but enum_to_string wants to start at 0
  const balance_offset = -2;
  // all the constant offsets and the base accuracy together
  const acc_offset = base_acc + grip_offset + surface_offset + balance_offset;
  return acc_offset + g + l + s + b;
}
  
const to_hit: number =
typeof item.to_hit === 'object' ? computeToHit(item.to_hit) : item.to_hit ?? 0

function attackTime(item) {
  return Math.floor(65 + ( Math.floor(parseVolume(item.volume) / 62.5) + Math.floor(parseMass(item.weight) / 60) ));
}
</script>

{#if item.bashing || item.cutting}
<section>
<h1>Melee</h1>
<dl>
  <dt>Bash</dt><dd>{item.bashing ?? 0}</dd>
  <dt>Cut</dt><dd>{item.cutting ?? 0}</dd>
  <dt>To Hit</dt><dd>{to_hit}</dd>
  <dt>Moves Per Attack</dt><dd>{attackTime(item)}</dd>
{#if techniques.length}
  <dt>Techniques</dt><dd><ul class="no-bullets">{#each techniques as technique}
  <li><strong><ThingLink type="technique" id={technique.id} /></strong>: {technique.description}</li>
  {/each}
  </ul></dd>
{/if}
</dl>
</section>
{/if}