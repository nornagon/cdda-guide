<script lang="ts">
import { CddaData, singularName } from "../data";
import ThingLink from "./ThingLink.svelte";
import type { Proficiency } from "../types";
import { getContext } from "svelte";
import LimitedList from "../LimitedList.svelte";
import ItemSymbol from "./item/ItemSymbol.svelte";
import { t } from "@transifex/native";

export let item: Proficiency;

const data = getContext<CddaData>("data");
const _context = "Proficiency";

const recipesUsingProficiency = [
  ...new Set(
    data
      .byType("recipe")
      .filter((recipe) =>
        (recipe.proficiencies ?? []).some(
          (prof) => prof.proficiency === item.id
        )
      )
      .map((recipe) => recipe.result)
      .filter((x): x is string => !!x)
  ),
].sort((a, b) =>
  singularName(data.byId("item", a)).localeCompare(
    singularName(data.byId("item", b))
  )
);
</script>

<h1>{t("Proficiency")}: {singularName(item)}</h1>
<section>
  <dl>
    <dt>{t("Time to Learn", { _context })}</dt>
    <dd>{item.can_learn ? item.time_to_learn : "not learnable"}</dd>
    <dt>{t("Default Time Multiplier", { _context })}</dt>
    <dd>{item.default_time_multiplier ?? 2}&times;</dd>
    {#if item.default_fail_multiplier}
      <dt>{t("Default Fail Multiplier", { _context })}</dt>
      <dd>{item.default_fail_multiplier}&times;</dd>
    {:else}
      <dt>{t("Default Skill Bonus", { _context })}</dt>
      <dd>{item.default_skill_penalty ?? 1}</dd>
    {/if}
    {#if item.required_proficiencies}
      <dt>{t("Required Proficiencies", { _context })}</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.required_proficiencies as id}
            <li><ThingLink {id} type="proficiency" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>

{#if recipesUsingProficiency.length}
  <section>
    <h1>{t("Recipes", { _context })}</h1>
    <LimitedList items={recipesUsingProficiency} let:item>
      <ItemSymbol item={data.byId("item", item)} />
      <ThingLink type="item" id={item} />
    </LimitedList>
  </section>
{/if}
