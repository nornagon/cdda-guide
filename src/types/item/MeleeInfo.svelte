<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import {
  CddaData,
  parseMass,
  parseVolume,
  singular,
  singularName,
} from "../../data";
import type { Item } from "../../types";
import ThingLink from "../ThingLink.svelte";

let data = getContext<CddaData>("data");
const _context = "Item Melee Info";
export let item: Item;

let techniques = (item.techniques ?? []).map((t) => data.byId("technique", t));

const gripVal = { bad: 0, none: 1, solid: 2, weapon: 3 };
const lengthVal = { hand: 0, short: 1, long: 2 };
const surfaceVal = { point: 0, line: 1, any: 2, every: 3 };
const balanceVal = { clumsy: 0, uneven: 1, neutral: 2, good: 3 };

const computeToHit = ({
  grip = "weapon",
  length = "hand",
  surface = "any",
  balance = "neutral",
}: {
  grip?: keyof typeof gripVal;
  length?: keyof typeof lengthVal;
  surface?: keyof typeof surfaceVal;
  balance?: keyof typeof balanceVal;
}) => {
  const g = gripVal[grip];
  const l = lengthVal[length];
  const s = surfaceVal[surface];
  const b = balanceVal[balance];
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
};

const to_hit: number =
  typeof item.to_hit === "object"
    ? computeToHit(item.to_hit)
    : item.to_hit ?? -2;

function attackTime(item: Item) {
  return Math.floor(
    65 +
      (Math.floor(parseVolume(item.volume ?? "1 ml") / 62.5) +
        Math.floor(parseMass(item.weight ?? 0) / 60))
  );
}

const piercing =
  (item.flags ?? []).includes("SPEAR") || (item.flags ?? []).includes("STAB");
</script>

{#if item.bashing || item.cutting}
  <!-- O.G -->
  <section>
    <h1>{t("Melee", { _context, _comment: "Section heading" })}</h1>
    <dl>
      <dt>{t("Bash", { _context: "Damage Type" })}</dt>
      <dd>{item.bashing ?? 0}</dd>
      <dt>
        {t(piercing ? "Pierce" : "Cut", { _context: "Damage Type" })}
      </dt>
      <dd>{item.cutting ?? 0}</dd>
      <dt>{t("To Hit", { _context })}</dt>
      <dd>{to_hit}</dd>
      <dt>{t("Moves Per Attack", { _context })}</dt>
      <dd>{attackTime(item)}</dd>
      {#if techniques.length}
        <dt>{t("Techniques", { _context })}</dt>
        <dd>
          <ul class="no-bullets">
            {#each techniques as technique}
              <li>
                <strong><ThingLink type="technique" id={technique.id} /></strong
                >{#if technique.description}: {singular(
                    technique.description
                  )}{/if}
              </li>
            {/each}
          </ul>
        </dd>
      {/if}
    </dl>
  </section>
{/if}

{#if item.melee_damage}
  <section>
    <h1>{t("Melee", { _context, _comment: "Section heading" })}</h1>
    <dl>
      {#each Object.entries(item.melee_damage) as [damageType, damage]}
        <dt>
          {singularName(
            data.byIdMaybe("damage_type", damageType) ?? { id: damageType }
          )}
        </dt>
        <dd>{damage}</dd>
      {/each}
      <dt>{t("To Hit", { _context })}</dt>
      <dd>{to_hit}</dd>
      <dt>{t("Moves Per Attack", { _context })}</dt>
      <dd>{attackTime(item)}</dd>
      {#if techniques.length}
        <dt>{t("Techniques", { _context })}</dt>
        <dd>
          <ul class="no-bullets">
            {#each techniques as technique}
              <li>
                <strong><ThingLink type="technique" id={technique.id} /></strong
                >{#if technique.description}: {singular(
                    technique.description
                  )}{/if}
              </li>
            {/each}
          </ul>
        </dd>
      {/if}
    </dl>
  </section>
{/if}
