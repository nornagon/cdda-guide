<script lang="ts">
import type { MartialArt, MartialArtBuff } from "../types";
import { getContext } from "svelte";
import { CddaData, i18n, singular, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import ThingLink from "./ThingLink.svelte";
import Technique from "./Technique.svelte";
import BonusContainer from "./BonusContainer.svelte";
import MartialArtRequirements from "./MartialArtRequirements.svelte";
import { t } from "@transifex/native";

const data = getContext<CddaData>("data");

function learnDifficultyAsText(difficulty: number): string {
  if (difficulty <= 2) {
    return "easy";
  } else if (difficulty <= 4) {
    return "moderately hard";
  } else if (difficulty <= 6) {
    return "hard";
  } else if (difficulty <= 8) {
    return "very hard";
  } else {
    return "extremely hard";
  }
}

export let item: MartialArt;
const _context = "Martial Art";

const books = data
  .byType("item")
  .filter((b) => b.type === "BOOK" && b.martial_art === item.id);

const buffss: [string, MartialArtBuff[]][] = [
  ["Passive", item.static_buffs ?? []],
  ["Move", item.onmove_buffs ?? []],
  ["Pause", item.onpause_buffs ?? []],
  ["Hit", item.onhit_buffs ?? []],
  ["Miss", item.onmiss_buffs ?? []],
  ["Attack", item.onattack_buffs ?? []],
  ["Crit", item.oncrit_buffs ?? []],
  ["Kill", item.onkill_buffs ?? []],
  ["Dodge", item.ondodge_buffs ?? []],
  ["Block", item.onblock_buffs ?? []],
  ["Get hit", item.ongethit_buffs ?? []],
];

const buffMap = new Map(
  buffss.flatMap((x) => x[1]).map((buff) => [buff.id, buff])
);
</script>

<h1>{t("Martial Art")}: {singularName(item)}</h1>

<section>
  <h1>{t("General", { _context })}</h1>
  {#if item.learn_difficulty != null || item.autolearn?.length || (item.arm_block ?? 99) !== 99 || (item.leg_block ?? 99) !== 99 || item.arm_block_with_bio_armor_arms || item.leg_block_with_bio_armor_legs || books.length}
    <dl>
      {#if item.learn_difficulty != null}
        <dt>{t("Difficulty to Learn", { _context })}</dt>
        <dd>
          {item.learn_difficulty} ({i18n.__(
            learnDifficultyAsText(item.learn_difficulty)
          )})
        </dd>
      {/if}
      {#if item.autolearn?.length}
        <dt
          title="Learned at these skill levels, otherwise only learnable from a book">
          {t("Autolearn", { _context })}
        </dt>
        <dd>
          <!-- prettier-ignore-->
          {#if item.autolearn}
          <ul class="comma-separated">
          {#each item.autolearn as [skill, level]}
            <li><ThingLink type="skill" id={skill} /> ({level})</li>
          {/each}
          </ul>
        {/if}
        </dd>
      {/if}
      {#if books.length}
        <dt>{t("Found In", { _context })}</dt>
        <dd>
          <ul class="comma-separated">
            {#each books as book}
              <li><ThingLink type="item" id={book.id} /></li>
            {/each}
          </ul>
        </dd>
      {/if}
      {#if item.weapon_category}
        <dt>{t("Weapon Category", { _context })}</dt>
        <dd>
          <ul class="comma-separated">
            {#each item.weapon_category as category_id}
              <li><ThingLink type="weapon_category" id={category_id} /></li>
            {/each}
          </ul>
        </dd>
      {/if}
      {#if (item.arm_block ?? 99) != 99 || item.arm_block_with_bio_armor_arms}
        <dt>{t("Arm Block", { _context })}</dt>
        <dd>
          {#if item.arm_block_with_bio_armor_arms}
            with <ThingLink type="item" id="bio_armor_arms" />
          {:else}
            <ThingLink type="skill" id="unarmed" /> ({item.arm_block})
          {/if}
        </dd>
      {/if}
      {#if (item.leg_block ?? 99) !== 99 || item.leg_block_with_bio_armor_legs}
        <dt>{t("Leg Block", { _context })}</dt>
        <dd>
          {#if item.leg_block_with_bio_armor_legs}
            with <ThingLink type="item" id="bio_armor_legs" />
          {:else}
            <ThingLink type="skill" id="unarmed" /> ({item.leg_block})
          {/if}
        </dd>
      {/if}
    </dl>
  {/if}
  <p style="color: var(--cata-color-gray)">{singular(item.description)}</p>
</section>

{#if item.weapons?.length}
  <section>
    <h1>{t("Weapons", { _context })}</h1>
    <LimitedList
      items={[...item.weapons].sort((a, b) =>
        singularName(data.byId("item", a)).localeCompare(
          singularName(data.byId("item", b))
        )
      )}
      let:item>
      <ThingLink id={item} type="item" />
    </LimitedList>
  </section>
{/if}

<h1>{t("Buffs", { _context })}</h1>
{#each buffss as [title, buffs]}
  {#each buffs as buff}
    <section>
      <h1>{i18n.__(title)}: {singularName(buff)}</h1>
      <dl>
        <MartialArtRequirements item={buff} {buffMap} />
        <BonusContainer item={buff} />
        {#if buff.buff_duration}
          <dt>{t("Duration", { _context })}</dt>
          <dd>{buff.buff_duration}</dd>
        {/if}
        {#if buff.max_stacks}
          <dt>{t("Max Stacks", { _context })}</dt>
          <dd>{buff.max_stacks}</dd>
        {/if}
        {#if buff.bonus_dodges}
          <dt>{t("Bonus Dodges", { _context })}</dt>
          <dd>{buff.bonus_dodges}</dd>
        {/if}
        {#if buff.bonus_blocks}
          <dt>{t("Bonus Blocks", { _context })}</dt>
          <dd>{buff.bonus_blocks}</dd>
        {/if}
        {#if buff.quiet}
          <dt title="Attacks will be completely silent">
            {t("Silent", { _context })}
          </dt>
          <dd>{t("Yes")}</dd>
        {/if}
        {#if buff.stealthy}
          <dt title="Movement will make less noise">
            {t("Stealthy", { _context })}
          </dt>
          <dd>{t("Yes")}</dd>
        {/if}
        {#if buff.throw_immune}
          <dt title="Immune to throws/grabs">
            {t("Throw Immune", { _context })}
          </dt>
          <dd>{t("Yes")}</dd>
        {/if}
      </dl>
      {#if buff.description}
        <p style="color: var(--cata-color-gray); white-space: pre-wrap">
          {singular(buff.description)}
        </p>
      {/if}
    </section>
  {/each}
{/each}

{#if item.techniques?.length}
  <h1>{t("Techniques", { _context })}</h1>
  {#each item.techniques as tec_id}
    <Technique
      item={data.byId("technique", tec_id)}
      {buffMap}
      standalone={false} />
  {/each}
{/if}
