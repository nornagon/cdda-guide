<script lang="ts">
import { t } from "@transifex/native";
import { getContext } from "svelte";
import type { CddaData } from "../../data";

import type { BookSlot, ItemBasicInfo } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let item: BookSlot & ItemBasicInfo;
const _context = "Item Book Info";

let data = getContext<CddaData>("data");

const bookRecipes = new Map<string, number>();
function add(recipe_id: string, level: number) {
  bookRecipes.set(
    recipe_id,
    Math.min(level, bookRecipes.get(recipe_id) ?? Infinity)
  );
}
for (const recipe of data.byType("recipe")) {
  if (!recipe.result) continue;
  if (Array.isArray(recipe.book_learn)) {
    for (const [id, level = 0] of recipe.book_learn)
      if (id === item.id) add(recipe.result, level);
  } else if (recipe.book_learn) {
    for (const [id, obj] of Object.entries(
      recipe.book_learn as Record<string, any>
    ))
      if (id === item.id) add(recipe.result, obj.skill_level ?? 0);
  }
}

const readSkill = item.read_skill ?? item.skill;
</script>

<section>
  <h1>{t("Book", { _context, _comment: "Section heading" })}</h1>
  <dl>
    {#if readSkill}
      <dt>{t("Skill", { _context })}</dt>
      <dd><ThingLink id={readSkill} type="skill" /></dd>
      <dt>{t("Required Level", { _context })}</dt>
      <dd>{item.required_level ?? 0}</dd>
      <dt>{t("Maximum Level", { _context })}</dt>
      <dd>{item.max_level ?? 0}</dd>
    {/if}
    <dt>{t("Required Intelligence", { _context })}</dt>
    <dd>{item.intelligence ?? 0}</dd>
    <dt>{t("Read Time", { _context })}</dt>
    <dd>{item.time ?? 0}</dd>
    <dt>{t("Fun", { _context })}</dt>
    <dd>{item.fun ?? 0}</dd>
    {#if item.chapters}
      <dt>{t("Chapters", { _context })}</dt>
      <dd>{item.chapters}</dd>
    {/if}
    {#if item.martial_art}
      <dt>{t("Martial Art", { _context })}</dt>
      <dd><ThingLink type="martial_art" id={item.martial_art} /></dd>
    {/if}
    {#if bookRecipes.size}
      <dt>{t("Recipes", { _context })}</dt>
      <dd>
        <ul>
          {#each [...bookRecipes.entries()].sort((a, b) => {
            if (a[1] !== b[1]) return a[1] - b[1];
            return a[0].localeCompare(b[0]);
          }) as [id, level]}
            <li><ThingLink {id} type="item" /> ({level})</li>
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
</section>
