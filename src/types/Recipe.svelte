<script lang="ts">
import { t } from "@transifex/native";
import JsonView from "../JsonView.svelte";
import { getContext } from "svelte";
import { CddaData, i18n, singular, singularName } from "../data";

import type { Recipe } from "../types";
import RequirementData from "./item/RequirementData.svelte";
import ThingLink from "./ThingLink.svelte";
import InterpolatedTranslation from "../InterpolatedTranslation.svelte";

export let recipe: Recipe;
export let showResult: boolean = false;

const data = getContext<CddaData>("data");
const _context = "Recipe";

function normalizeSkillsRequired(
  skills_required: [string, number] | [string, number][] | undefined
): [string, number][] {
  if (skills_required === undefined) return [];
  if (skills_required.length === 0) return [];
  if (Array.isArray(skills_required[0]))
    return skills_required as [string, number][];
  return [skills_required as [string, number]];
}

let skillsRequired = normalizeSkillsRequired(recipe.skills_required);

const writtenIn = Array.isArray(recipe.book_learn)
  ? [...recipe.book_learn]
  : [...Object.entries((recipe.book_learn ?? {}) as Record<string, any>)].map(
      ([k, v]) => [k, v.skill_level]
    );
writtenIn.sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0));

const proficiencies = (recipe.proficiencies ?? []).map((prof) => {
  const proficiency = data.byId("proficiency", prof.proficiency);
  const skill_penalty =
    prof.skill_penalty ?? proficiency.default_skill_penalty ?? 0;
  const fail_multiplier =
    prof.fail_multiplier ?? proficiency.default_fail_multiplier ?? 1;
  return {
    skill_penalty,
    fail_multiplier,
    time_multiplier: proficiency.default_time_multiplier ?? 2,
    learning_time_multiplier: 1,
    ...prof,
  };
});

const activityLevels = {
  SLEEP_EXERCISE: 0.85,
  NO_EXERCISE: 1.0,
  LIGHT_EXERCISE: 2.0,
  fake: 4.0,
  MODERATE_EXERCISE: 4.0,
  BRISK_EXERCISE: 6.0,
  ACTIVE_EXERCISE: 8.0,
  EXTRA_EXERCISE: 10.0,
};

function activityLevelName(level: number) {
  const activity_descriptions = [
    "None",
    "Light",
    "Moderate",
    "Brisk",
    "Active",
    "Extreme",
  ];
  // Activity levels are 1, 2, 4, 6, 8, 10
  // So we can easily cut them in half and round down for an index
  const idx = Math.floor(level / 2);

  return i18n.pgettext("activity description", activity_descriptions[idx]);
}
</script>

<section class="recipe">
  <h1>
    {#if recipe.name}
      {singularName(recipe)}
    {:else if showResult}{t("Byproduct", {
        _context,
        _comment: "Section heading",
      })}{:else}{t("Craft", { _context, _comment: "Section heading" })}{/if}
  </h1>
  <p>
    {#if recipe.never_learn}
      <section class="warning">
        ⚠️ {t(
          "This recipe is not learnable. It may be used by NPCs or for debugging purposes.",
          {
            _context,
            _comment:
              "This is a basecamp recipe or other utility recipe that isn't directly usable by the player.",
          }
        )}
      </section>
    {/if}
  </p>
  <dl>
    {#if (showResult || recipe.variant) && recipe.result}
      <dt>{t("Result", { _context })}</dt>
      <dd>
        <ThingLink id={recipe.result} type="item" variantId={recipe.variant} />
      </dd>
    {/if}
    <dt>{t("Primary Skill", { _context })}</dt>
    <dd>
      {#if recipe.skill_used}
        <ThingLink type="skill" id={recipe.skill_used} /> ({recipe.difficulty ??
          0})
      {:else}
        {t("none")}
      {/if}
    </dd>
    {#if skillsRequired.length}
      <dt>{t("Other Skills", { _context })}</dt>
      <dd>
        {#each skillsRequired as [skill, level], i}
          <ThingLink type="skill" id={skill} /> ({level}){#if i === skillsRequired.length - 2}{" and "}{:else if i !== skillsRequired.length - 1}{", "}{/if}
        {:else}
          {t("none")}
        {/each}
      </dd>
    {/if}
    {#if recipe.practice_data}
      <dt>{t("Difficulty Range", { _context })}</dt>
      <dd>
        {recipe.practice_data.min_difficulty ?? 0}–{recipe.practice_data
          .max_difficulty ?? 0}
        {#if recipe.practice_data.skill_limit != null}
          <InterpolatedTranslation
            str={t(`(max {skill_limit})`, {
              skill_limit: "{skill_limit}",
              _context,
              _comment: "practice recipe skill limit",
            })}
            slot0="skill_limit">
            <span slot="0">{recipe.practice_data.skill_limit ?? 0}</span>
          </InterpolatedTranslation>
        {/if}
      </dd>
    {/if}
    {#if proficiencies.length}
      <dt>{t("Proficiencies", { _context })}</dt>
      <dd>
        <ul>
          {#each proficiencies as prof}
            {@const ctx = { _context, _comment: "proficiency multiplier" }}
            {@const multipliers = [
              prof.time_multiplier !== 1
                ? `${prof.time_multiplier}× ${t("time", ctx)}`
                : null,
              prof.fail_multiplier != null && prof.fail_multiplier !== 1
                ? `${prof.fail_multiplier}× ${t("fail", ctx)}`
                : null,
              prof.skill_penalty != null && prof.skill_penalty !== 0
                ? `${prof.skill_penalty} ${t("skill bonus", ctx)}`
                : null,
              prof.learning_time_multiplier !== 1
                ? `${prof.learning_time_multiplier}× ${t(
                    "learning speed",
                    ctx
                  )}`
                : null,
            ].filter((x) => x)}
            <li>
              {#if prof.required}
                <strong>{t("Required:", { _context })}</strong>{" "}
              {/if}
              <ThingLink type="proficiency" id={prof.proficiency} />
              {#if multipliers.length}
                ({multipliers.join(", ")})
              {/if}
            </li>
          {/each}
        </ul>
      </dd>
    {/if}
    <dt>{t("Time to Complete")}</dt>
    <dd>{recipe.time ?? "0 m"}</dd>
    <dt>{t("Activity Level", { _context })}</dt>
    <dd>
      {t(
        activityLevelName(
          activityLevels[recipe.activity_level ?? "MODERATE_EXERCISE"]
        )
      )}
    </dd>
    <dt>{t("Batch Time Savings", { _context })}</dt>
    <dd>
      {#if recipe.batch_time_factors}
        {recipe.batch_time_factors[0]}% at >{recipe.batch_time_factors[1]} unit{recipe
          .batch_time_factors[1] === 1
          ? ""
          : "s"}
      {:else}
        <em>{t("none")}</em>
      {/if}
    </dd>
    {#if recipe.charges}
      <dt>{t("Recipe Makes", { _context })}</dt>
      <dd>{recipe.charges}<!-- TODO: properly switch on result type --></dd>
    {/if}
    <RequirementData requirement={recipe} />
    {#if recipe.byproducts?.length}
      <dt>{t("Byproducts", { _context })}</dt>
      <dd>
        <ul>
          {#each recipe.byproducts as c}
            <li><ThingLink type="item" id={c[0]} count={c[1] ?? 1} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    <dt
      title="Learned at these skill levels, otherwise only learnable from a book">
      {t("Autolearn", { _context })}
    </dt>
    <dd>
      <!-- prettier-ignore-->
      {#if recipe.autolearn}
        <ul class="comma-separated">
          {#if Array.isArray(recipe.autolearn)}
            {#each recipe.autolearn as [skill, level]}<li><ThingLink type="skill" id={skill} /> ({level})</li>{/each}
          {:else}
            {#if recipe.skill_used}
              <!-- prettier-ignore-->
              <li><ThingLink type="skill" id={recipe.skill_used} /> ({recipe.difficulty ?? 0})</li>{/if}{#if skillsRequired.length}
              {#each skillsRequired as [skill, level]}
                <li><ThingLink type="skill" id={skill} /> ({level})</li>
              {/each}
            {/if}
            {#if !recipe.skill_used && !skillsRequired.length}
            <li>{t('At birth', {_context})}</li>
            {/if}
          {/if}
        </ul>
      {:else}
        {t("No")}
      {/if}
    </dd>
    {#if writtenIn.length}
      <dt>
        {t("Written In", {
          _context,
          _comment: "List of books that contain the recipe",
        })}
      </dt>
      <dd>
        <ul class="comma-separated">
          {#each writtenIn as [item_id, level = 0]}
            <!-- prettier-ignore -->
            <li><span style="white-space: nowrap"><ThingLink id={item_id} type="item" /> ({level})</span></li>
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
  {#if recipe.description}
    <p style="color: var(--cata-color-gray)">{singular(recipe.description)}</p>
  {/if}
  <details>
    <summary>{t("Recipe JSON")}</summary>
    <JsonView obj={recipe} buildNumber={data.build_number} />
  </details>
</section>

<style>
.warning {
  background-color: #69553f;
}
</style>
