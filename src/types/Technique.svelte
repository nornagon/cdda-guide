<script lang="ts">
import { t } from "@transifex/native";

import { getContext } from "svelte";
import { CddaData, byName, i18n, singular, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { MartialArtBuff, Technique } from "../types";
import BonusContainer from "./BonusContainer.svelte";
import MartialArtRequirements from "./MartialArtRequirements.svelte";
import ThingLink from "./ThingLink.svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";

export let item: Technique;
export let buffMap: Map<string, MartialArtBuff> = new Map();
export let standalone: boolean = true;

const data = getContext<CddaData>("data");
const _context = "Martial Art";

const weapons = data
  .byType("item")
  .filter((it) => {
    return it.id && (it.techniques ?? []).includes(item.id);
  })
  .sort(byName);

const type = i18n.__(
  item.block_counter
    ? "Block Counter"
    : item.dodge_counter
    ? "Dodge Counter"
    : item.miss_recovery
    ? "Miss Recovery"
    : item.grab_break
    ? "Grab Break"
    : item.defensive
    ? "Defensive"
    : "Offensive"
);

const extractInfo = (s: string): string =>
  /<info>(.+?)<\/info>/.exec(s)?.[1] ?? s;
const targetRequirements: string[] = [];
if (item.human_target)
  targetRequirements.push(
    extractInfo(i18n.__("* Only works on a <info>humanoid</info> target"))
  );
if (item.downed_target)
  targetRequirements.push(
    extractInfo(i18n.__("* Only works on a <info>downed</info> target"))
  );
if (item.stunned_target)
  targetRequirements.push(
    extractInfo(i18n.__("* Only works on a <info>stunned</info> target"))
  );
</script>

{#if standalone}
  <h1>{t("Technique", { _context })}: {singularName(item)}</h1>
{/if}

<section>
  {#if !standalone}
    <h1>{t("Technique", { _context })}: {singularName(item)}</h1>
  {/if}
  <dl>
    <dt>{t("Type", { _context })}</dt>
    <dd>{type}</dd>
    <MartialArtRequirements {item} {buffMap} />
    <dt>{t("Activate on Crit?", { _context })}</dt>
    <dd>
      {item.crit_ok
        ? t("Yes")
        : item.crit_tec
        ? t("Only", { _context: "Martial Art", _comment: "Activate on Crit?" })
        : t("No")}
    </dd>
    {#if item.weighting && item.weighting !== 1}
      <dt>{t("Chance to Activate", { _context })}</dt>
      <dd>
        {#if item.weighting > 1}
          +{((item.weighting - 1) * 100).toFixed(0)}%
        {:else if item.weighting < -1}
          1/{Math.abs(item.weighting)}
        {/if}
      </dd>
    {/if}
    {#if targetRequirements.length}
      <dt>{t("Target Requirements", { _context })}</dt>
      <dd>
        {targetRequirements.join(", ")}
      </dd>
    {/if}
    {#if item.aoe}
      <dt>{t("AoE Shape", { _context })}</dt>
      <dd>{item.aoe}</dd>
    {/if}
    <BonusContainer {item} />
    {#if item.stun_dur}
      <dt>{t("Stun Duration", { _context })}</dt>
      <dd>{item.stun_dur}</dd>
    {/if}
    {#if item.down_dur}
      <dt>{t("Down Duration", { _context })}</dt>
      <dd>{item.down_dur}</dd>
    {/if}
    {#if item.knockback_dist}
      <dt>{t("Knockback Distance", { _context })}</dt>
      <dd>{item.knockback_dist}</dd>
    {/if}
  </dl>
  {#if item.description}
    <p style="color: var(--cata-color-gray)">{singular(item.description)}</p>
  {/if}
  <details>
    <summary>{t("Technique JSON", { _context })}</summary>
    <pre>{JSON.stringify(item, null, 2)}</pre>
  </details>
</section>

{#if weapons.length}
  <section>
    <h1>{t("Weapons", { _context })}</h1>
    <LimitedList items={weapons} let:item limit={20}>
      <ItemSymbol {item} />
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  </section>
{/if}
