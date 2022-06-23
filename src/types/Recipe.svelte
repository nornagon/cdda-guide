<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../data";

import type { Recipe } from "../types";
import RequirementData from "./item/RequirementData.svelte";
import ThingLink from "./ThingLink.svelte";

export let recipe: Recipe;
export let showResult: boolean = false;

const data = getContext<CddaData>("data");

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
  return {
    fail_multiplier: proficiency.default_fail_multiplier,
    time_multiplier: proficiency.default_time_multiplier,
    learning_time_multiplier: 1,
    ...prof,
  };
});
</script>

<section class="recipe">
  <h1>
    {#if showResult}Byproduct{:else}Craft{/if}
  </h1>
  <dl>
    {#if showResult}
      <dt>Result</dt>
      <dd><ThingLink id={recipe.result} type="item" /></dd>
    {/if}
    <dt>Primary Skill</dt>
    <dd>
      {#if recipe.skill_used}
        <ThingLink type="skill" id={recipe.skill_used} /> ({recipe.difficulty ??
          0})
      {:else}
        none
      {/if}
    </dd>
    {#if skillsRequired.length}
      <dt>Other Skills</dt>
      <dd>
        {#each skillsRequired as [skill, level], i}
          <ThingLink type="skill" id={skill} /> ({level}){#if i === skillsRequired.length - 2}{" and "}{:else if i !== skillsRequired.length - 1}{", "}{/if}
        {:else}
          none
        {/each}
      </dd>
    {/if}
    {#if proficiencies.length}
      <dt>Proficiencies</dt>
      <dd>
        <ul>
          {#each proficiencies as prof}
            <li>
              <ThingLink type="proficiency" id={prof.proficiency} />
              {#if prof.time_multiplier !== 1 || prof.fail_multiplier !== 1 || prof.learning_time_multiplier !== 1}
                ({[
                  [prof.time_multiplier, "time"],
                  [prof.fail_multiplier, "fail"],
                  [prof.learning_time_multiplier, "learning speed"],
                ]
                  .filter((x) => x[0] !== 1)
                  .map(([num, name]) => `${num}× ${name}`)
                  .join(", ")})
              {/if}
            </li>
          {/each}
        </ul>
      </dd>
    {/if}
    <dt>Time to Complete</dt>
    <dd>{recipe.time ?? "0 m"}</dd>
    <dt>Activity Level</dt>
    <dd>{recipe.activity_level ?? "MODERATE_EXERCISE"}</dd>
    <dt>Batch Time Savings</dt>
    <dd>
      {#if recipe.batch_time_factors}
        {recipe.batch_time_factors[0]}% at >{recipe.batch_time_factors[1]} unit{recipe
          .batch_time_factors[1] === 1
          ? ""
          : "s"}
      {:else}
        <em>none</em>
      {/if}
    </dd>
    {#if recipe.charges}
      <dt>Recipe Makes</dt>
      <dd>{recipe.charges}<!-- TODO: properly switch on result type --></dd>
    {/if}
    <RequirementData requirement={recipe} />
    {#if recipe.byproducts?.length}
      <dt>Byproducts</dt>
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
      Autolearn
    </dt>
    <dd>
      <!-- prettier-ignore-->
      {#if recipe.autolearn}
        <ul class="comma-separated">
          {#if Array.isArray(recipe.autolearn)}
            {#each recipe.autolearn as [skill, level]}
              <li><ThingLink type="skill" id={skill} /> ({level})</li>
            {/each}
          {:else}
            {#if recipe.skill_used}
              <li>
                <ThingLink type="skill" id={recipe.skill_used} /> ({recipe.difficulty ??
                  0})
              </li>
            {/if}
            {#if skillsRequired.length}
              {#each skillsRequired as [skill, level]}
                <li><ThingLink type="skill" id={skill} /> ({level})</li>
              {/each}
            {/if}
            {#if !recipe.skill_used && !skillsRequired.length}
            <li>At birth</li>
            {/if}
          {/if}
        </ul>
      {:else}
        no
      {/if}
    </dd>
    {#if writtenIn.length}
      <dt>Written In</dt>
      <dd>
        <ul class="comma-separated">
          {#each writtenIn as [item_id, /* prettier-ignore */ level = 0]}
            <!-- prettier-ignore -->
            <li><span style="white-space: nowrap"><ThingLink id={item_id} type="item" /> ({level})</span></li>
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
  <details>
    <summary>Recipe JSON</summary>
    <pre>{JSON.stringify(recipe, null, 2)}</pre>
  </details>
</section>
